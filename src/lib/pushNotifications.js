import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { supabase } from './supabase'
import { getCurrentUser } from './profile'
import { setAlertMinimized } from './alertSession'

export function isPushNative() {
  return Capacitor.isNativePlatform()
}

async function saveToken(token) {
  const { user } = await getCurrentUser()
  if (!user || !token) return { error: new Error('Not authenticated') }

  const platform = Capacitor.getPlatform()
  const { error } = await supabase.from('push_tokens').upsert(
    {
      user_id: user.id,
      token,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,token' }
  )

  return { error }
}

async function removeToken(token) {
  const { user } = await getCurrentUser()
  if (!user || !token) return
  await supabase
    .from('push_tokens')
    .delete()
    .eq('user_id', user.id)
    .eq('token', token)
}

/**
 * Register for FCM push (Android/iOS native app only).
 * Call after login when notify_push is enabled.
 */
export async function registerPushNotifications() {
  if (!isPushNative()) {
    return { ok: false, reason: 'not-native' }
  }

  try {
    let perm = await PushNotifications.checkPermissions()
    if (perm.receive !== 'granted') {
      perm = await PushNotifications.requestPermissions()
    }
    if (perm.receive !== 'granted') {
      return { ok: false, reason: 'denied' }
    }

    await PushNotifications.register()
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'register-failed',
    }
  }
}

export async function unregisterPushNotifications() {
  if (!isPushNative()) return
  try {
    // Best-effort: clear stored tokens for this user on this device after next token event is hard;
    // remove all tokens for user when they disable push.
    const { user } = await getCurrentUser()
    if (!user) return
    await supabase.from('push_tokens').delete().eq('user_id', user.id)
  } catch {
    /* ignore */
  }
}

let listenersAttached = false

/** Attach token / notification listeners once for the app lifetime. */
export async function attachPushListeners(navigate) {
  if (!isPushNative() || listenersAttached) return () => {}
  listenersAttached = true

  const reg = await PushNotifications.addListener('registration', async (token) => {
    if (token?.value) await saveToken(token.value)
  })

  const regErr = await PushNotifications.addListener(
    'registrationError',
    (err) => {
      console.warn('Push registration error', err)
    }
  )

  const openAlert = () => {
    setAlertMinimized(false)
    if (typeof navigate === 'function') {
      navigate('/alert', { replace: true })
    }
  }

  const received = await PushNotifications.addListener(
    'pushNotificationReceived',
    () => {
      // App is open/foreground — jump straight to Alert
      openAlert()
    }
  )

  const action = await PushNotifications.addListener(
    'pushNotificationActionPerformed',
    () => {
      // User tapped the notification (app was background/killed)
      openAlert()
    }
  )

  return async () => {
    listenersAttached = false
    await reg.remove()
    await regErr.remove()
    await received.remove()
    await action.remove()
  }
}

export { saveToken, removeToken }
