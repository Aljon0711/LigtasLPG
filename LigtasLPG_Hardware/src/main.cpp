#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <WiFiManager.h>
#include <math.h>
#include "secrets.h"

// ============================================================
// PIN CONFIGURATION
// ============================================================
#define FLAME_PIN 18
#define PRESSURE_PIN 34
#define RELAY_PIN 26
#define BUZZER_PIN 25  // optional; safe if unused

#define RELAY_ON HIGH
#define RELAY_OFF LOW

const float LOW_PRESSURE_VOLTS = 0.30;
float dropThreshold = 0.028;

float peakPressure = 0.0;
bool systemLatchedEmergency = false;
int leakDetectionCounter = 0;
bool valveOpen = true;
bool manualValveHoldClosed = false;  // app close_valve — stay closed until open_valve
bool alarmActive = false;
unsigned long bootMs = 0;
unsigned long emergencyResetHoldoffUntil = 0;  // ignore re-latch briefly after I AM SAFE
String lastLoggedEvent = "";

float getSmoothedPressure() {
  long sum = 0;
  for (int i = 0; i < 30; i++) {
    sum += analogRead(PRESSURE_PIN);
    delay(2);
  }
  float avgRaw = sum / 30.0;
  return avgRaw * (3.3 / 4095.0);
}

bool checkFlameDetected() {
  int activeCount = 0;
  for (int i = 0; i < 10; i++) {
    if (digitalRead(FLAME_PIN) == LOW) activeCount++;
    delay(2);
  }
  return (activeCount >= 5);
}

float voltsToKpa(float volts) {
  // Simple linear map for UI (0–3.3V → 0–10 kPa). Calibrate later if needed.
  return constrain(volts * (10.0f / 3.3f), 0.0f, 20.0f);
}

String wifiSignalLabel() {
  long rssi = WiFi.RSSI();
  if (rssi >= -55) return "Strong";
  if (rssi >= -70) return "Good";
  if (rssi >= -80) return "Fair";
  return "Weak";
}

void setValve(bool open) {
  valveOpen = open;
  digitalWrite(RELAY_PIN, open ? RELAY_ON : RELAY_OFF);
}

void pulseAlarm(int ms = 800) {
  alarmActive = true;
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, HIGH);
  delay(ms);
  digitalWrite(BUZZER_PIN, LOW);
  alarmActive = false;
}

bool connectWifi() {
  if (WiFi.status() == WL_CONNECTED) return true;

  Serial.println("WiFi: connecting (saved credentials or setup portal)...");
  WiFi.mode(WIFI_STA);

  // Optional hardcoded fallback — only if you define WIFI_SSID in secrets.h
#if defined(WIFI_SSID) && defined(WIFI_PASSWORD)
  if (strlen(WIFI_SSID) > 0 && strcmp(WIFI_SSID, "YOUR_WIFI_SSID") != 0) {
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - start < 12000) {
      delay(300);
      Serial.print(".");
    }
    Serial.println();
    if (WiFi.status() == WL_CONNECTED) {
      Serial.print("WiFi OK (secrets): ");
      Serial.println(WiFi.localIP());
      return true;
    }
  }
#endif

  // Auto: use saved Wi-Fi, or open phone setup hotspot "LigtasLPG-Setup"
  WiFiManager wm;
  wm.setConfigPortalTimeout(180);
  wm.setConnectTimeout(20);
  wm.setHostname("ligtaslpg");

  bool ok = wm.autoConnect(WIFI_SETUP_AP_NAME);
  if (ok) {
    Serial.print("WiFi OK: ");
    Serial.print(WiFi.SSID());
    Serial.print(" / ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi FAILED — join hotspot LigtasLPG-Setup on your phone to configure.");
  }
  return ok;
}

String extractJsonString(const String &json, const char *key) {
  String pattern = String("\"") + key + "\":";
  int idx = json.indexOf(pattern);
  if (idx < 0) return "";
  idx += pattern.length();
  while (idx < (int)json.length() && (json[idx] == ' ')) idx++;
  if (idx >= (int)json.length()) return "";
  if (json[idx] == 'n') return ""; // null
  if (json[idx] != '"') {
    // number / bare word (null/true/false)
    int end = idx;
    while (end < (int)json.length() &&
           (isDigit(json[end]) || json[end] == '.' || json[end] == '-' ||
            (json[end] >= 'a' && json[end] <= 'z'))) end++;
    return json.substring(idx, end);
  }
  idx++;
  String out;
  while (idx < (int)json.length()) {
    char c = json[idx++];
    if (c == '\\' && idx < (int)json.length()) {
      char n = json[idx++];
      if (n == '"' || n == '\\' || n == '/') out += n;
      else if (n == 'n') out += '\n';
      else if (n == 't') out += '\t';
      else out += n;
      continue;
    }
    if (c == '"') break;
    out += c;
  }
  return out;
}

String extractJsonObject(const String &json, const char *key) {
  String pattern = String("\"") + key + "\":";
  int idx = json.indexOf(pattern);
  if (idx < 0) return "";
  idx += pattern.length();
  while (idx < (int)json.length() && json[idx] == ' ') idx++;
  if (idx >= (int)json.length()) return "";
  if (json[idx] == 'n') return ""; // null
  if (json[idx] != '{') return "";

  int depth = 0;
  bool inString = false;
  bool escape = false;
  int start = idx;
  for (int i = idx; i < (int)json.length(); i++) {
    char c = json[i];
    if (inString) {
      if (escape) escape = false;
      else if (c == '\\') escape = true;
      else if (c == '"') inString = false;
      continue;
    }
    if (c == '"') {
      inString = true;
      continue;
    }
    if (c == '{') depth++;
    else if (c == '}') {
      depth--;
      if (depth == 0) return json.substring(start, i + 1);
    }
  }
  return "";
}

void ackCommand(const String &command) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  String url = String(SUPABASE_URL) + "/rest/v1/rpc/ack_device_command";
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);

  String body = "{";
  body += "\"p_hardware_id\":\"" + String(HARDWARE_ID) + "\",";
  body += "\"p_api_key\":\"" + String(DEVICE_API_KEY) + "\",";
  body += "\"p_command\":\"" + command + "\"";
  body += "}";

  int code = http.POST(body);
  Serial.printf("ack_command HTTP %d\n", code);
  http.end();
}

void reportWifiScan() {
  if (WiFi.status() != WL_CONNECTED && WiFi.getMode() == WIFI_OFF) {
    WiFi.mode(WIFI_STA);
  }

  Serial.println("WiFi scan: starting...");
  int n = WiFi.scanNetworks(/*async=*/false, /*hidden=*/false);
  Serial.printf("WiFi scan: found %d networks\n", n);

  String networks = "[";
  int reported = 0;
  for (int i = 0; i < n && reported < 20; i++) {
    String ssid = WiFi.SSID(i);
    if (ssid.length() == 0) continue;

    ssid.replace("\\", "\\\\");
    ssid.replace("\"", "\\\"");

    if (reported > 0) networks += ",";
    networks += "{";
    networks += "\"ssid\":\"" + ssid + "\",";
    networks += "\"rssi\":" + String(WiFi.RSSI(i)) + ",";
    networks += "\"secure\":" + String(WiFi.encryptionType(i) != WIFI_AUTH_OPEN ? "true" : "false");
    networks += "}";
    reported++;
  }
  networks += "]";
  WiFi.scanDelete();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi scan: reconnecting to upload results...");
    connectWifi();
  }
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi scan: still offline — cannot upload results");
    return;
  }

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  String url = String(SUPABASE_URL) + "/rest/v1/rpc/report_wifi_scan";
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);

  String body = "{";
  body += "\"p_hardware_id\":\"" + String(HARDWARE_ID) + "\",";
  body += "\"p_api_key\":\"" + String(DEVICE_API_KEY) + "\",";
  body += "\"p_networks\":" + networks;
  body += "}";

  int code = http.POST(body);
  Serial.printf("wifi_scan HTTP %d\n", code);
  if (code < 200 || code >= 300) {
    Serial.println(http.getString());
  }
  http.end();
}

void reportWifiConnectResult(bool success, const String &message, const String &ssid) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("wifi_connect: offline — cannot report result yet");
    return;
  }

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  String url = String(SUPABASE_URL) + "/rest/v1/rpc/report_wifi_connect_result";
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);

  String safeMsg = message;
  safeMsg.replace("\\", "\\\\");
  safeMsg.replace("\"", "\\\"");
  String safeSsid = ssid;
  safeSsid.replace("\\", "\\\\");
  safeSsid.replace("\"", "\\\"");

  String body = "{";
  body += "\"p_hardware_id\":\"" + String(HARDWARE_ID) + "\",";
  body += "\"p_api_key\":\"" + String(DEVICE_API_KEY) + "\",";
  body += "\"p_success\":" + String(success ? "true" : "false") + ",";
  body += "\"p_message\":\"" + safeMsg + "\",";
  body += "\"p_wifi_ssid\":\"" + safeSsid + "\",";
  body += "\"p_signal_strength\":\"" + (success ? wifiSignalLabel() : String("")) + "\"";
  body += "}";

  int code = http.POST(body);
  Serial.printf("wifi_connect_result HTTP %d\n", code);
  if (code < 200 || code >= 300) {
    Serial.println(http.getString());
  }
  http.end();
}

bool waitForWifi(unsigned long timeoutMs) {
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < timeoutMs) {
    delay(250);
    Serial.print(".");
  }
  Serial.println();
  return WiFi.status() == WL_CONNECTED;
}

void connectToWifiFromApp(const String &ssid, const String &password) {
  if (ssid.length() == 0) {
    reportWifiConnectResult(false, "Missing SSID", "");
    return;
  }

  Serial.print("WiFi connect-from-app: ");
  Serial.println(ssid);

  // Trial connect without overwriting saved NVS credentials
  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.disconnect(false, false);
  delay(200);
  WiFi.begin(ssid.c_str(), password.c_str());

  bool ok = waitForWifi(20000);

  if (ok) {
    // Persist new credentials, then reconnect once with saved config
    WiFi.persistent(true);
    WiFi.disconnect(false, false);
    delay(150);
    WiFi.begin(ssid.c_str(), password.c_str());
    ok = waitForWifi(15000);
  } else {
    // Restore previous NVS credentials
    WiFi.persistent(true);
    WiFi.disconnect(false, false);
    delay(150);
    WiFi.begin();
    waitForWifi(15000);
  }

  if (ok && WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi connect OK: ");
    Serial.println(WiFi.SSID());
    reportWifiConnectResult(true, "Connected", WiFi.SSID());
  } else {
    Serial.println("WiFi connect FAILED — restored previous network if possible");
    if (WiFi.status() != WL_CONNECTED) {
      // Soft retry of saved credentials only (no setup portal here)
      WiFi.begin();
      waitForWifi(12000);
    }
    if (WiFi.status() == WL_CONNECTED) {
      reportWifiConnectResult(false, "Wrong password or connection failed", WiFi.SSID());
    }
  }
}

void applyPendingCommand(const String &command, const String &payloadJson) {
  if (command.length() == 0) return;

  Serial.print("Command from cloud: ");
  Serial.println(command);

  if (command == "open_valve") {
    manualValveHoldClosed = false;
    if (!systemLatchedEmergency) setValve(true);
  } else if (command == "close_valve") {
    manualValveHoldClosed = true;
    setValve(false);
  } else if (command == "test_alarm") {
    pulseAlarm();
  } else if (command == "emergency_shutoff") {
    manualValveHoldClosed = false;
    setValve(false);
    systemLatchedEmergency = true;
    pulseAlarm(1200);
  } else if (command == "reset_emergency") {
    systemLatchedEmergency = false;
    manualValveHoldClosed = false;
    leakDetectionCounter = 0;
    peakPressure = getSmoothedPressure();
    lastLoggedEvent = "";
    emergencyResetHoldoffUntil = millis() + 15000UL;
    setValve(true);
  } else if (command == "scan_wifi") {
    reportWifiScan();
    ackCommand(command);
    return;
  } else if (command == "connect_wifi") {
    String ssid = extractJsonString(payloadJson, "ssid");
    String password = extractJsonString(payloadJson, "password");
    connectToWifiFromApp(ssid, password);
    // report_wifi_connect_result already clears pending command + password
    if (WiFi.status() == WL_CONNECTED) {
      ackCommand(command);
    }
    return;
  }

  ackCommand(command);
}

void reportTelemetry(
  float pressureVolts,
  bool flame,
  const char *status,
  const char *logTitle,
  const char *logDescription,
  const char *logType,
  const char *logIcon
) {
  if (!connectWifi()) return;

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  String url = String(SUPABASE_URL) + "/rest/v1/rpc/report_device_telemetry";
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  http.addHeader("Prefer", "return=representation");

  float kpa = voltsToKpa(pressureVolts);
  unsigned long uptimeSec = (millis() - bootMs) / 1000UL;

  String body = "{";
  body += "\"p_hardware_id\":\"" + String(HARDWARE_ID) + "\",";
  body += "\"p_api_key\":\"" + String(DEVICE_API_KEY) + "\",";
  body += "\"p_pressure_volts\":" + String(pressureVolts, 3) + ",";
  body += "\"p_pressure_kpa\":" + String(kpa, 2) + ",";
  body += "\"p_flame_detected\":" + String(flame ? "true" : "false") + ",";
  body += "\"p_valve_open\":" + String(valveOpen ? "true" : "false") + ",";
  body += "\"p_system_status\":\"" + String(status) + "\",";
  body += "\"p_emergency_latched\":" + String(systemLatchedEmergency ? "true" : "false") + ",";
  body += "\"p_alarm_active\":" + String(alarmActive ? "true" : "false") + ",";
  body += "\"p_wifi_ssid\":\"" + WiFi.SSID() + "\",";
  body += "\"p_signal_strength\":\"" + wifiSignalLabel() + "\",";
  body += "\"p_firmware_version\":\"v1.2.1-valve\",";
  body += "\"p_uptime_seconds\":" + String(uptimeSec);

  if (logTitle && strlen(logTitle) > 0) {
    body += ",\"p_log_title\":\"" + String(logTitle) + "\"";
    if (logDescription) body += ",\"p_log_description\":\"" + String(logDescription) + "\"";
    if (logType) body += ",\"p_log_type\":\"" + String(logType) + "\"";
    if (logIcon) body += ",\"p_log_icon\":\"" + String(logIcon) + "\"";
  }

  body += "}";

  int code = http.POST(body);
  String response = http.getString();
  Serial.printf("telemetry HTTP %d\n", code);
  if (code >= 200 && code < 300) {
    String cmd = extractJsonString(response, "pending_command");
    String payload = extractJsonObject(response, "pending_command_payload");
    String sens = extractJsonString(response, "leak_sensitivity");
    if (sens.length() > 0) {
      int s = sens.toInt();
      // Map sensitivity 0–100 → drop threshold 0.05–0.012
      dropThreshold = 0.050f - (s / 100.0f) * 0.038f;
    }
    applyPendingCommand(cmd, payload);
  } else {
    Serial.println(response);
  }
  http.end();
}

void maybeLogEvent(
  const String &key,
  const char *title,
  const char *description,
  const char *type,
  const char *icon,
  float volts,
  bool flame,
  const char *status
) {
  if (key == lastLoggedEvent) {
    reportTelemetry(volts, flame, status, nullptr, nullptr, nullptr, nullptr);
    return;
  }
  lastLoggedEvent = key;
  reportTelemetry(volts, flame, status, title, description, type, icon);
}

void setup() {
  Serial.begin(115200);
  bootMs = millis();

  pinMode(FLAME_PIN, INPUT);
  pinMode(PRESSURE_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  setValve(true);

  delay(1000);
  peakPressure = getSmoothedPressure();

  Serial.println("\n==========================================");
  Serial.println(" LigtasLPG - Cloud Safety System v1.1");
  Serial.println("==========================================");

  connectWifi();
  reportTelemetry(peakPressure, false, "safe", "Device Online",
                  "ESP32 connected and reporting telemetry.", "safe", "check_circle");
}

void loop() {
  if (systemLatchedEmergency) {
    setValve(false);
    Serial.println("SYSTEM LOCKED: Emergency Shutdown!");
    maybeLogEvent("locked", "Emergency Lockout",
                  "Valve remains closed until reset from the app.",
                  "critical", "warning", getSmoothedPressure(), false, "critical");
    delay(2000);
    return;
  }

  float currentPressure = getSmoothedPressure();
  bool isFlameDetected = checkFlameDetected();

  if (currentPressure > peakPressure) peakPressure = currentPressure;

  bool isPressureDropping = (peakPressure - currentPressure) >= dropThreshold;
  bool isPressureCriticallyLow = (currentPressure < LOW_PRESSURE_VOLTS);

  Serial.printf("[Peak: %.2fV | Curr: %.2fV] Flame=%s Th=%.3f --> ",
                peakPressure, currentPressure,
                isFlameDetected ? "ON" : "OFF", dropThreshold);

  const bool holdoffActive = millis() < emergencyResetHoldoffUntil;

  if (isPressureCriticallyLow && !holdoffActive) {
    setValve(false);
    systemLatchedEmergency = true;
    Serial.println("CRITICAL: Low Pressure Cutoff!");
    maybeLogEvent("low_pressure", "Low Pressure Cutoff",
                  "Pressure critically low. Valve shutoff and locked.",
                  "critical", "warning", currentPressure, isFlameDetected, "critical");
  } else if (isPressureDropping && !isFlameDetected && !holdoffActive) {
    leakDetectionCounter++;
    Serial.printf("WARNING: Drop Counter %d/2\n", leakDetectionCounter);
    if (leakDetectionCounter >= 2) {
      setValve(false);
      systemLatchedEmergency = true;
      Serial.println("EMERGENCY: Gas Leak Confirmed!");
      maybeLogEvent("leak", "Leak Detected - Auto Shutoff",
                    "Pressure drop without flame. Valve closed automatically.",
                    "critical", "warning", currentPressure, false, "critical");
    } else {
      if (manualValveHoldClosed) setValve(false);
      maybeLogEvent("warn_drop", "Pressure Drop Warning",
                    "Unusual pressure drop while flame is off.",
                    "warning", "trending_down", currentPressure, false, "warning");
    }
  } else if (isPressureDropping && isFlameDetected) {
    leakDetectionCounter = 0;
    peakPressure = currentPressure;
    if (manualValveHoldClosed) {
      setValve(false);
      Serial.println("SAFE: Cooking Active (manual valve hold closed)");
    } else {
      setValve(true);
      Serial.println("SAFE: Cooking Active");
    }
    maybeLogEvent("cooking", "Normal Cooking Detected",
                  "Pressure change consistent with burner activity.",
                  "info", "local_fire_department", currentPressure, true, "safe");
  } else {
    leakDetectionCounter = 0;
    if (manualValveHoldClosed) {
      setValve(false);
      Serial.println("SYSTEM STABLE (manual valve hold closed)");
      maybeLogEvent("stable_closed", "Valve Held Closed",
                    "User closed the valve from the app. Waiting for open command.",
                    "info", "settings_input_component", currentPressure, isFlameDetected, "safe");
    } else {
      setValve(true);
      Serial.println("SYSTEM STABLE");
      maybeLogEvent("stable", "System Safe",
                    "Sensors within normal parameters. Valve open.",
                    "safe", "check_circle", currentPressure, isFlameDetected, "safe");
    }
  }

  delay(1000);
}
