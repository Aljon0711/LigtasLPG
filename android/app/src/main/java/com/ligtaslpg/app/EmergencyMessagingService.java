package com.ligtaslpg.app;

import android.app.ActivityOptions;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.os.Build;
import android.os.PowerManager;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

/**
 * Receives FCM data messages and shows a Full-Screen Intent for emergencies.
 * Also forwards events to the Capacitor Push plugin.
 */
public class EmergencyMessagingService extends FirebaseMessagingService {
    public static final String CHANNEL_ID = "ligtas_emergency_fullscreen";
    public static final int NOTIFICATION_ID = 2001;

    /** Clear the sticky emergency banner from the notification drawer. */
    public static void cancelEmergencyNotification(Context context) {
        if (context == null) return;
        try {
            NotificationManager nm =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.cancel(NOTIFICATION_ID);
        } catch (Exception ignored) {}
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        try {
            PushNotificationsPlugin.sendRemoteMessage(remoteMessage);
        } catch (Exception ignored) {}

        Map<String, String> data = remoteMessage.getData();
        String type = data != null ? data.get("type") : null;

        if ("emergency".equalsIgnoreCase(type)) {
            showFullscreenEmergency(
                data.get("title"),
                data.get("body"),
                data.get("route")
            );
            return;
        }

        if (remoteMessage.getNotification() != null) {
            showFullscreenEmergency(
                remoteMessage.getNotification().getTitle(),
                remoteMessage.getNotification().getBody(),
                "/alert"
            );
        }
    }

    @Override
    public void onNewToken(@NonNull String token) {
        try {
            PushNotificationsPlugin.onNewToken(token);
        } catch (Exception ignored) {}
    }

    private void showFullscreenEmergency(String title, String body, String route) {
        ensureChannel();
        wakeScreen();

        if (title == null || title.isEmpty()) title = "LigtasLPG Emergency";
        if (body == null || body.isEmpty()) {
            body = "Gas leak detected. Open the app immediately.";
        }
        if (route == null || route.isEmpty()) route = "/alert";

        Intent alertIntent = new Intent(this, EmergencyAlertActivity.class);
        alertIntent.putExtra(EmergencyAlertActivity.EXTRA_TITLE, title);
        alertIntent.putExtra(EmergencyAlertActivity.EXTRA_BODY, body);
        alertIntent.putExtra(EmergencyAlertActivity.EXTRA_ROUTE, route);
        alertIntent.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_CLEAR_TOP
                | Intent.FLAG_ACTIVITY_SINGLE_TOP
        );

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent fullScreenPending = PendingIntent.getActivity(
            this,
            NOTIFICATION_ID,
            alertIntent,
            flags
        );

        // Tap opens the app (React decides if still critical) — not the native alarm again.
        Intent tapIntent = new Intent(this, MainActivity.class);
        tapIntent.putExtra("emergency_route", route);
        tapIntent.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_CLEAR_TOP
                | Intent.FLAG_ACTIVITY_SINGLE_TOP
        );
        PendingIntent contentPending = PendingIntent.getActivity(
            this,
            NOTIFICATION_ID + 1,
            tapIntent,
            flags
        );

        boolean canFullScreen = true;
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 34 && nm != null) {
            canFullScreen = nm.canUseFullScreenIntent();
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setOngoing(false)
            .setContentIntent(contentPending);

        if (canFullScreen) {
            builder.setFullScreenIntent(fullScreenPending, true);
        }

        if (nm != null) {
            nm.notify(NOTIFICATION_ID, builder.build());
        }

        // OEM fallback when screen is unlocked (FSI often only fires while locked).
        // Use PendingIntent.send with background-start allowance on API 34+.
        try {
            if (Build.VERSION.SDK_INT >= 34) {
                ActivityOptions options = ActivityOptions.makeBasic();
                options.setPendingIntentBackgroundActivityStartMode(
                    ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED
                );
                fullScreenPending.send(this, 0, null, null, null, null, options.toBundle());
            } else {
                startActivity(alertIntent);
            }
        } catch (Exception ignored) {
            try {
                startActivity(alertIntent);
            } catch (Exception ignored2) {}
        }
    }

    private void wakeScreen() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm == null) return;
            @SuppressWarnings("deprecation")
            PowerManager.WakeLock wakeLock = pm.newWakeLock(
                PowerManager.FULL_WAKE_LOCK
                    | PowerManager.ACQUIRE_CAUSES_WAKEUP
                    | PowerManager.ON_AFTER_RELEASE,
                "ligtaslpg:emergency"
            );
            wakeLock.acquire(10000L);
        } catch (Exception ignored) {}
    }

    private void ensureChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        // Recreate channel with max importance (channel settings stick after first create)
        NotificationChannel existing = nm.getNotificationChannel(CHANNEL_ID);
        if (existing == null) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Emergency Full Screen Alerts",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Full-screen gas leak emergency alerts");
            channel.enableVibration(true);
            channel.enableLights(true);
            channel.setBypassDnd(true);
            channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
            AudioAttributes audio = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
            channel.setSound(
                android.media.RingtoneManager.getDefaultUri(
                    android.media.RingtoneManager.TYPE_ALARM
                ),
                audio
            );
            nm.createNotificationChannel(channel);
        }
    }
}
