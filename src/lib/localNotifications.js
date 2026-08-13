import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

const EMERGENCY_ID = 1001
/** Must match EmergencyMessagingService.NOTIFICATION_ID (FCM full-screen banner). */
const FCM_EMERGENCY_ID = 2001

export function isNativeApp() {
  return Capacitor.isNativePlatform()
}

export async function ensureNotificationPermission() {
  if (!isNativeApp()) return false

  try {
    let status = await LocalNotifications.checkPermissions()
    if (status.display !== 'granted') {
      status = await LocalNotifications.requestPermissions()
    }
    return status.display === 'granted'
  } catch {
    return false
  }
}

/**
 * Show a local notification for gas leak emergency.
 * Works on installed Android app (foreground/background while process is alive).
 * Fully killed apps need remote push (FCM) — not included here.
 */
export async function notifyEmergencyAlert({
  title = 'LigtasLPG Emergency',
  body = 'Gas leak alert — open the app immediately.',
} = {}) {
  if (!isNativeApp()) return { ok: false, reason: 'not-native' }

  const granted = await ensureNotificationPermission()
  if (!granted) return { ok: false, reason: 'denied' }

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: EMERGENCY_ID,
          title,
          body,
          schedule: { at: new Date(Date.now() + 250) },
          channelId: 'ligtas_emergency',
          extra: { route: '/alert' },
        },
      ],
    })
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'schedule-failed',
    }
  }
}

export async function clearEmergencyNotification() {
  if (!isNativeApp()) return
  try {
    // Cancels local + FCM emergency banners (same NotificationManager IDs).
    await LocalNotifications.cancel({
      notifications: [{ id: EMERGENCY_ID }, { id: FCM_EMERGENCY_ID }],
    })
  } catch {
    /* ignore */
  }
}

/** Create Android notification channel (idempotent). */
export async function setupNotificationChannel() {
  if (!isNativeApp() || Capacitor.getPlatform() !== 'android') return

  try {
    await LocalNotifications.createChannel({
      id: 'ligtas_emergency',
      name: 'Emergency Alerts',
      description: 'Gas leak and emergency shutoff alerts',
      importance: 5,
      visibility: 1,
      vibration: true,
      sound: 'default',
    })
  } catch {
    /* older plugin / ignore */
  }
}
