package com.ligtaslpg.app;

import android.app.NotificationManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        maybeRequestFullScreenPermission();
        handleEmergencyRoute(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleEmergencyRoute(intent);
    }

    private void handleEmergencyRoute(Intent intent) {
        if (intent == null) return;
        final String route = intent.getStringExtra("emergency_route");
        if (route == null || route.isEmpty()) return;

        // Banner was tapped / opened — clear it from the drawer
        EmergencyMessagingService.cancelEmergencyNotification(this);

        // Navigate the Capacitor WebView to the React Alert route
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge
                .getWebView()
                .postDelayed(
                    () -> {
                        try {
                            String js =
                                "window.location.hash='';window.location.replace('" +
                                route +
                                "');";
                            this.bridge.getWebView().evaluateJavascript(js, null);
                        } catch (Exception ignored) {}
                    },
                    700
                );
        }
    }

    private void maybeRequestFullScreenPermission() {
        try {
            if (Build.VERSION.SDK_INT >= 34) {
                NotificationManager nm = getSystemService(NotificationManager.class);
                if (nm != null && !nm.canUseFullScreenIntent()) {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT);
                    intent.setData(Uri.parse("package:" + getPackageName()));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                    return;
                }
            }
            // Realme / ColorOS: help user enable "display pop-up" style access
            if (!Settings.canDrawOverlays(this)) {
                Intent intent = new Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getPackageName())
                );
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
            }
        } catch (Exception ignored) {}
    }
}
