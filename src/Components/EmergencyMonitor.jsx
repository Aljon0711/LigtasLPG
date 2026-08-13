import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { App as CapApp } from '@capacitor/app'
import { LocalNotifications } from '@capacitor/local-notifications'
import { ensureUserDevice, subscribeToDevice } from '../lib/devices'
import { getCurrentUser } from '../lib/profile'
import {
  clearAlertSession,
  getLastNotifiedDeviceKey,
  isAlertMinimized,
  setLastNotifiedDeviceKey,
} from '../lib/alertSession'
import {
  clearEmergencyNotification,
  ensureNotificationPermission,
  isNativeApp,
  notifyEmergencyAlert,
  setupNotificationChannel,
} from '../lib/localNotifications'

/**
 * Keeps watching the device while the app is open (any screen).
 * On critical status: local notification + open Alert (unless user minimized).
 */
export default function EmergencyMonitor() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let cancelled = false
    let unsubscribe = () => {}
    let appListener = { remove: async () => {} }
    let tapListener = { remove: async () => {} }

    async function start() {
      if (isNativeApp()) {
        await setupNotificationChannel()
        await ensureNotificationPermission()

        tapListener = await LocalNotifications.addListener(
          'localNotificationActionPerformed',
          (event) => {
            const route = event?.notification?.extra?.route || '/alert'
            navigate(route, { replace: true })
          }
        )

        appListener = await CapApp.addListener('appStateChange', ({ isActive }) => {
          if (!isActive) return
          // When returning to foreground, subscription continues via Realtime
        })
      }

      const { user } = await getCurrentUser()
      if (cancelled || !user) return

      const { device, settings, error } = await ensureUserDevice()
      if (cancelled || error || !device?.id) return
      const pushEnabled = settings?.notify_push !== false

      unsubscribe = subscribeToDevice(device.id, async (next) => {
        if (cancelled || !next) return

        const critical =
          next.system_status === 'critical' || next.emergency_latched

        if (!critical) {
          clearAlertSession()
          clearEmergencyNotification()
          return
        }

        // On native + push enabled, FCM (server) owns notifications.
        // Local notifications here caused DUPLICATE alerts with FCM.
        const notifyKey = `${next.id}:critical`
        if (
          pushEnabled &&
          !isNativeApp() &&
          getLastNotifiedDeviceKey() !== notifyKey
        ) {
          setLastNotifiedDeviceKey(notifyKey)
          await notifyEmergencyAlert({
            title: 'LigtasLPG Emergency',
            body: 'Gas leak detected. Open the app and check your tank.',
          })
        } else if (pushEnabled && isNativeApp()) {
          setLastNotifiedDeviceKey(notifyKey)
        }

        const onAlert = location.pathname === '/alert'
        if (!onAlert && !isAlertMinimized()) {
          navigate('/alert', { replace: true })
        }
      })
    }

    start()

    return () => {
      cancelled = true
      unsubscribe()
      void appListener.remove()
      void tapListener.remove()
    }
    // Only remount path changes for navigation decisions inside subscription via closure —
    // re-bind when pathname changes so minimize/open behavior stays correct.
  }, [navigate, location.pathname])

  return null
}
