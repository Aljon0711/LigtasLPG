import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  resolveOAuthFlow,
  getProfile,
  signOut,
  consumePendingRememberDays,
  setStaySignedInForDays,
  clearStaySignedInPreference,
  markActiveTabSession,
} from '../lib/auth'

/**
 * Handles Google OAuth return:
 * - signup (or incomplete account) → force set app password
 * - signin → only allow users who already registered + set password
 */
export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('Completing Google sign-in...')

  useEffect(() => {
    let cancelled = false
    let done = false

    async function routeAfterAuth(session, flow) {
      if (cancelled || done || !session?.user) return
      done = true

      const userId = session.user.id
      let { data: profile } = await getProfile(userId)

      // New Google user: wait for profile trigger
      if (!profile) {
        await new Promise((r) => setTimeout(r, 1000))
        const retry = await getProfile(userId)
        profile = retry.data
      }

      if (cancelled) return

      const passwordSet = Boolean(profile?.password_set)

      // Fully registered → dashboard
      if (passwordSet) {
        const rememberDays = consumePendingRememberDays()
        if (rememberDays > 0) {
          setStaySignedInForDays(rememberDays)
        } else {
          clearStaySignedInPreference()
        }
        markActiveTabSession()

        navigate('/dashboard', {
          replace: true,
          state: { toast: 'Sign in successful' },
        })
        return
      }

      // Explicit sign-in attempt without completed registration → block
      if (flow === 'signin') {
        setStatus('This Google account is not registered...')
        await signOut()
        navigate('/', {
          replace: true,
          state: {
            authError:
              'This Google account is not registered yet. Please sign up first and set an app password.',
          },
        })
        return
      }

      // signup flow, or flow lost but account incomplete → set password
      setStatus('Almost done — set your app password...')
      navigate('/set-password', { replace: true })
    }

    async function finishOAuth() {
      const flow = resolveOAuthFlow()

      // Prefer URL/code exchange for PKCE
      const href = window.location.href
      if (href.includes('code=') || href.includes('access_token')) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(href)
        if (exchangeError) {
          // ignore — getSession may still work for hash tokens
          console.warn('exchangeCodeForSession:', exchangeError.message)
        }
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (cancelled) return

      if (session?.user) {
        await routeAfterAuth(session, flow)
        return
      }

      if (sessionError) {
        navigate('/signup', {
          replace: true,
          state: {
            authError: 'Google sign-in failed. Please try again.',
          },
        })
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled || done) return
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        const flow = resolveOAuthFlow()
        await routeAfterAuth(session, flow)
      }
    })

    finishOAuth()

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center px-4 font-sans">
      <div className="text-center space-y-3">
        <span className="material-symbols-outlined text-[#af101a] text-4xl animate-pulse">
          progress_activity
        </span>
        <p className="text-sm font-semibold text-[#5b403d]">{status}</p>
      </div>
    </div>
  )
}
