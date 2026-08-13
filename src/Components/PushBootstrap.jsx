import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ensureUserDevice } from '../lib/devices'
import {
  attachPushListeners,
  isPushNative,
  registerPushNotifications,
  unregisterPushNotifications,
} from '../lib/pushNotifications'

/**
 * Registers FCM when the user is signed in and Push Notifications is enabled.
 */
export default function PushBootstrap() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!isPushNative()) return undefined

    let cancelled = false
    let detach = async () => {}

    async function syncPush(session) {
      if (cancelled) return
      if (!session?.user) {
        await unregisterPushNotifications()
        return
      }

      detach = (await attachPushListeners(navigate)) || detach

      const { settings } = await ensureUserDevice()
      if (cancelled) return

      if (settings?.notify_push === false) {
        await unregisterPushNotifications()
        return
      }

      await registerPushNotifications()
    }

    supabase.auth.getSession().then(({ data }) => {
      syncPush(data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncPush(session)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
      void detach()
    }
  }, [navigate])

  return null
}
