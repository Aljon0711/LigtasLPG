import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getPersistedSession } from '../lib/auth'

const AUTH_REDIRECT_PATHS = new Set(['/', '/signup', '/terms'])

/**
 * Keeps users on dashboard when "Stay signed in" is still valid,
 * and logs them out after the configured expiry (2 days for testing).
 */
export default function SessionGuard() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let cancelled = false

    async function check() {
      const { session, reason } = await getPersistedSession()
      if (cancelled) return

      if (reason === 'expired') {
        navigate('/', {
          replace: true,
          state: {
            authError:
              'Your stay signed-in session expired. Please sign in again.',
          },
        })
        return
      }

      if (session && reason === 'valid' && AUTH_REDIRECT_PATHS.has(location.pathname)) {
        navigate('/dashboard', { replace: true })
      }
    }

    check()

    const intervalId = setInterval(check, 60_000)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [location.pathname, navigate])

  return null
}
