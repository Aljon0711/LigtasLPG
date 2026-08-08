import { supabase } from './supabase'
import { getCurrentUser } from './profile'

const DEFAULT_HARDWARE_ID = 'LPG-ESP32-001'
const ONLINE_MS = 45_000

function randomApiKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `ligtas_${crypto.randomUUID().replace(/-/g, '')}`
  }
  return `ligtas_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function isDeviceOnline(device) {
  if (!device?.last_seen_at) return false
  return Date.now() - new Date(device.last_seen_at).getTime() < ONLINE_MS
}

export function pressureToGaugeOffset(pressureKpa) {
  const max = 10
  const clamped = Math.max(0, Math.min(max, Number(pressureKpa) || 0))
  // circumference ≈ 264; higher pressure → lower offset (more arc filled)
  return Math.round(264 - (clamped / max) * 184)
}

export async function ensureUserDevice(hardwareId = DEFAULT_HARDWARE_ID) {
  const { user, error: userError } = await getCurrentUser()
  if (userError || !user) {
    return {
      device: null,
      settings: null,
      error: userError || new Error('Not authenticated'),
      code: 'auth',
    }
  }

  const { data: existing, error: fetchError } = await supabase
    .from('devices')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (fetchError) {
    return {
      device: null,
      settings: null,
      error: fetchError,
      code: isMissingMonitoringSchema(fetchError) ? 'schema' : 'fetch',
    }
  }

  let device = existing

  if (!device) {
    const { data: created, error: createError } = await supabase
      .from('devices')
      .insert({
        user_id: user.id,
        hardware_id: hardwareId,
        device_api_key: randomApiKey(),
        firmware_version: 'v1.0.0',
        system_status: 'offline',
        valve_open: true,
      })
      .select('*')
      .single()

    if (createError) {
      return {
        device: null,
        settings: null,
        error: createError,
        code: isMissingMonitoringSchema(createError) ? 'schema' : 'create',
      }
    }
    device = created
  } else if (!device.device_api_key) {
    const { data: updated, error: updateError } = await supabase
      .from('devices')
      .update({
        device_api_key: randomApiKey(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', device.id)
      .select('*')
      .single()

    if (updateError) {
      return {
        device,
        settings: null,
        error: updateError,
        code: isMissingMonitoringSchema(updateError) ? 'schema' : 'update',
      }
    }
    if (updated) device = updated
  }

  let { data: settings } = await supabase
    .from('device_settings')
    .select('*')
    .eq('device_id', device.id)
    .maybeSingle()

  if (!settings) {
    const { data: createdSettings, error: settingsError } = await supabase
      .from('device_settings')
      .insert({
        device_id: device.id,
        user_id: user.id,
        leak_sensitivity: 45,
        notify_push: true,
        notify_sms: false,
        notify_email: true,
      })
      .select('*')
      .single()

    if (settingsError) {
      return { device, settings: null, error: settingsError, code: 'settings' }
    }
    settings = createdSettings
  }

  return { device, settings, error: null, code: null }
}

function isMissingMonitoringSchema(error) {
  const msg = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`
  return /device_api_key|pressure_kpa|pending_command|wifi_networks|scan_wifi|connect_wifi|wifi_connect_status|schema cache/i.test(msg)
}

export function getSchemaSetupMessage(error) {
  if (!isMissingMonitoringSchema(error)) {
    return error?.message || 'Something went wrong loading your device.'
  }
  return (
    'Database not updated yet. Open Supabase → SQL Editor, run ' +
    'supabase/monitoring.sql then supabase/wifi_scan.sql, and refresh this page.'
  )
}

export async function getUserDevice() {
  const { user, error: userError } = await getCurrentUser()
  if (userError || !user) {
    return { device: null, settings: null, error: userError || new Error('Not authenticated') }
  }

  const { data: device, error } = await supabase
    .from('devices')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) return { device: null, settings: null, error }

  if (!device) return ensureUserDevice()

  const { data: settings } = await supabase
    .from('device_settings')
    .select('*')
    .eq('device_id', device.id)
    .maybeSingle()

  return { device, settings, error: null }
}

export function subscribeToDevice(deviceId, onChange) {
  if (!deviceId) return () => {}

  const channel = supabase
    .channel(`device-${deviceId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'devices',
        filter: `id=eq.${deviceId}`,
      },
      (payload) => {
        if (payload.new) onChange(payload.new)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function sendDeviceCommand(deviceId, command, payload = null) {
  const { data, error } = await supabase
    .from('devices')
    .update({
      pending_command: command,
      pending_command_payload: payload,
      command_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(command === 'emergency_shutoff'
        ? { valve_open: false, system_status: 'critical', emergency_latched: true }
        : {}),
      ...(command === 'open_valve' ? { valve_open: true } : {}),
      ...(command === 'close_valve' ? { valve_open: false } : {}),
      ...(command === 'test_alarm' ? { alarm_active: true } : {}),
      ...(command === 'reset_emergency'
        ? {
            emergency_latched: false,
            system_status: 'safe',
            valve_open: true,
            alarm_active: false,
          }
        : {}),
      ...(command === 'scan_wifi' ? { wifi_networks: [] } : {}),
      ...(command === 'connect_wifi'
        ? {
            wifi_connect_status: 'connecting',
            wifi_connect_message: 'Connecting…',
            wifi_connect_at: new Date().toISOString(),
          }
        : {}),
    })
    .eq('id', deviceId)
    .select('*')
    .single()

  return { data, error }
}

export async function connectDeviceWifi(deviceId, ssid, password = '') {
  return sendDeviceCommand(deviceId, 'connect_wifi', {
    ssid: String(ssid || '').trim(),
    password: String(password || ''),
  })
}

export function parseWifiNetworks(device) {
  const raw = device?.wifi_networks
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

export function wifiRssiLabel(rssi) {
  const n = Number(rssi)
  if (!Number.isFinite(n)) return '—'
  if (n >= -55) return 'Strong'
  if (n >= -70) return 'Good'
  if (n >= -80) return 'Fair'
  return 'Weak'
}

export async function updateDeviceSettings(settingsId, updates) {
  const { data, error } = await supabase
    .from('device_settings')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', settingsId)
    .select('*')
    .single()

  return { data, error }
}

export async function updateDeviceMeta(deviceId, updates) {
  const { data, error } = await supabase
    .from('devices')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', deviceId)
    .select('*')
    .single()

  return { data, error }
}

export async function getActivityLogs(limit = 50) {
  const { user, error: userError } = await getCurrentUser()
  if (userError || !user) {
    return { data: [], error: userError || new Error('Not authenticated') }
  }

  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return { data: data || [], error }
}

export async function addActivityLog({
  deviceId,
  title,
  description,
  logType = 'info',
  icon = 'info',
  iconFilled = false,
  hasReport = false,
  pressureKpa = null,
}) {
  const { user, error: userError } = await getCurrentUser()
  if (userError || !user) return { data: null, error: userError }

  const { data, error } = await supabase
    .from('activity_logs')
    .insert({
      user_id: user.id,
      device_id: deviceId || null,
      title,
      description,
      log_type: logType,
      icon,
      icon_filled: iconFilled,
      has_report: hasReport,
      pressure_kpa: pressureKpa,
    })
    .select('*')
    .single()

  return { data, error }
}

export function formatUptime(seconds) {
  const s = Math.max(0, Number(seconds) || 0)
  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const mins = Math.floor((s % 3600) / 60)
  return `${days}d ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`
}

export { DEFAULT_HARDWARE_ID }
