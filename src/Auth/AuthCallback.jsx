import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { resolveOAuthFlow, resolveGoogleAuthDestination } from '../lib/auth'

/**
 * Legacy redirect handler (old Supabase OAuth URL return).
 * New Google login uses Firebase → signInWithIdToken and skips this page.
 */
export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('Completing Google sign-in...')

  useEffect(() => {
    let cancelled = false

    async function finishOAuth() {
      const flow = resolveOAuthFlow()

      const href = window.location.href
      if (href.includes('code=') || href.includes('access_token')) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(href)
        if (exchangeError) {
          console.warn('exchangeCodeForSession:', exchangeError.message)
        }
      }

      if (cancelled) return

      const { next, message } = await resolveGoogleAuthDestination(flow)

      if (cancelled) return

      if (next === 'dashboard') {
        navigate('/dashboard', {
          replace: true,
          state: { toast: 'Sign in successful' },
        })
        return
      }

      if (next === 'set-password') {
        setStatus('Almost done — set your app password...')
        navigate('/set-password', { replace: true })
        return
      }

      navigate(flow === 'signup' ? '/signup' : '/', {
        replace: true,
        state: {
          authError: message || 'Google sign-in failed. Please try again.',
        },
      })
    }

    finishOAuth()

    return () => {
      cancelled = true
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
