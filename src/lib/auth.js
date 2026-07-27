import { supabase } from './supabase'

const OAUTH_FLOW_KEY = 'ligtas_oauth_flow'
const STAY_SIGNED_IN_UNTIL_KEY = 'ligtas_stay_signed_in_until'
const PENDING_REMEMBER_DAYS_KEY = 'ligtas_pending_remember_days'
const ACTIVE_TAB_KEY = 'ligtas_active_tab'

// User requested 30 days, but 2 days for current testing.
export const STAY_SIGNED_IN_TEST_DAYS = 2

export async function signUpWithEmail({ name, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: name.trim(),
      },
    },
  })

  if (!error && data?.user) {
    await supabase
      .from('profiles')
      .update({
        full_name: name.trim(),
        password_set: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.user.id)
  }

  return { data, error }
}

export async function signInWithEmail({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  return { data, error }
}

export function setStaySignedInForDays(days) {
  if (!days || Number(days) <= 0) {
    localStorage.removeItem(STAY_SIGNED_IN_UNTIL_KEY)
    return
  }

  const durationMs = Number(days) * 24 * 60 * 60 * 1000
  const expiresAt = Date.now() + durationMs
  localStorage.setItem(STAY_SIGNED_IN_UNTIL_KEY, String(expiresAt))
}

export function clearStaySignedInPreference() {
  localStorage.removeItem(STAY_SIGNED_IN_UNTIL_KEY)
}

export function hasStaySignedInPreference() {
  const raw = localStorage.getItem(STAY_SIGNED_IN_UNTIL_KEY)
  if (!raw) return false
  const expiresAt = Number(raw)
  return Number.isFinite(expiresAt) && expiresAt > 0
}

export function isStaySignedInExpired() {
  const raw = localStorage.getItem(STAY_SIGNED_IN_UNTIL_KEY)
  if (!raw) return false

  const expiresAt = Number(raw)
  if (!Number.isFinite(expiresAt) || expiresAt <= 0) return false

  return Date.now() > expiresAt
}

/** Marks this browser/app process as an active session (cleared when tab/app closes). */
export function markActiveTabSession() {
  sessionStorage.setItem(ACTIVE_TAB_KEY, '1')
}

export function hasActiveTabSession() {
  return sessionStorage.getItem(ACTIVE_TAB_KEY) === '1'
}

/**
 * Returns a usable session when "Stay signed in" is still valid,
 * or when the user is still in the same open tab/app process.
 * After close/reopen without stay-signed-in, signs the user out.
 */
export async function getPersistedSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) return { session: null, reason: 'none' }

  if (hasStaySignedInPreference()) {
    if (isStaySignedInExpired()) {
      await supabase.auth.signOut()
      clearStaySignedInPreference()
      setPendingRememberDays(0)
      return { session: null, reason: 'expired' }
    }
    markActiveTabSession()
    return { session, reason: 'valid' }
  }

  // No stay-signed-in: keep session only while this tab/app process is alive.
  // Closing the tab/app clears sessionStorage → next open requires login.
  if (hasActiveTabSession()) {
    return { session, reason: 'ephemeral-active' }
  }

  await supabase.auth.signOut()
  clearStaySignedInPreference()
  return { session: null, reason: 'ephemeral' }
}

export function setPendingRememberDays(days) {
  if (!days || Number(days) <= 0) {
    sessionStorage.removeItem(PENDING_REMEMBER_DAYS_KEY)
    localStorage.removeItem(PENDING_REMEMBER_DAYS_KEY)
    return
  }

  const value = String(Number(days))
  sessionStorage.setItem(PENDING_REMEMBER_DAYS_KEY, value)
  localStorage.setItem(PENDING_REMEMBER_DAYS_KEY, value)
}

export function consumePendingRememberDays() {
  const fromSession = sessionStorage.getItem(PENDING_REMEMBER_DAYS_KEY)
  const fromLocal = localStorage.getItem(PENDING_REMEMBER_DAYS_KEY)
  sessionStorage.removeItem(PENDING_REMEMBER_DAYS_KEY)
  localStorage.removeItem(PENDING_REMEMBER_DAYS_KEY)

  const parsed = Number(fromSession || fromLocal || 0)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

/**
 * @param {'signin' | 'signup'} flow
 * @param {{ rememberDays?: number }} options
 */
export async function signInWithGoogle(flow = 'signin', options = {}) {
  sessionStorage.setItem(OAUTH_FLOW_KEY, flow)
  localStorage.setItem(OAUTH_FLOW_KEY, flow)
  setPendingRememberDays(options.rememberDays || 0)

  // Keep flow in redirect URL so it survives Google OAuth (sessionStorage can be lost)
  const redirectTo = `${window.location.origin}/auth/callback?flow=${flow}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  return { data, error }
}

/**
 * Resolve OAuth flow from URL first, then storage.
 * Returns 'signin' | 'signup' | null
 */
export function resolveOAuthFlow() {
  const params = new URLSearchParams(window.location.search)
  const fromUrl = params.get('flow')
  if (fromUrl === 'signin' || fromUrl === 'signup') {
    sessionStorage.removeItem(OAUTH_FLOW_KEY)
    localStorage.removeItem(OAUTH_FLOW_KEY)
    return fromUrl
  }

  const fromSession = sessionStorage.getItem(OAUTH_FLOW_KEY)
  const fromLocal = localStorage.getItem(OAUTH_FLOW_KEY)
  sessionStorage.removeItem(OAUTH_FLOW_KEY)
  localStorage.removeItem(OAUTH_FLOW_KEY)

  const stored = fromSession || fromLocal
  if (stored === 'signin' || stored === 'signup') return stored

  return null
}

/** @deprecated use resolveOAuthFlow */
export function consumeOAuthFlow() {
  return resolveOAuthFlow() || 'signin'
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  return { data, error }
}

export async function setAppPassword(password) {
  const { data: userData, error: userError } = await supabase.auth.updateUser({
    password,
  })

  if (userError) return { data: null, error: userError }

  const userId = userData.user?.id
  if (userId) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        password_set: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (profileError) return { data: userData, error: profileError }
  }

  return { data: userData, error: null }
}

export async function signOut() {
  clearStaySignedInPreference()
  setPendingRememberDays(0)
  sessionStorage.removeItem(ACTIVE_TAB_KEY)
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function enforceStaySignedInExpiry() {
  if (!isStaySignedInExpired()) return false

  await supabase.auth.signOut()
  clearStaySignedInPreference()
  setPendingRememberDays(0)
  return true
}

export function getAuthErrorMessage(error) {
  if (!error) return 'Something went wrong. Please try again.'

  const message = error.message || ''

  if (/invalid login credentials/i.test(message)) {
    return 'Invalid email or password.'
  }
  if (/user already registered/i.test(message)) {
    return 'This email is already registered. Please sign in.'
  }
  if (/password should be at least/i.test(message)) {
    return 'Password must be at least 6 characters.'
  }
  if (/email not confirmed/i.test(message)) {
    return 'Please confirm your email before signing in.'
  }
  if (/network/i.test(message)) {
    return 'Network error. Check your connection and try again.'
  }

  return message
}
