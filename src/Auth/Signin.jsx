import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  signInWithEmail,
  signInWithGoogle,
  getAuthErrorMessage,
  setStaySignedInForDays,
  clearStaySignedInPreference,
  getPersistedSession,
  markActiveTabSession,
  STAY_SIGNED_IN_TEST_DAYS,
} from '../lib/auth'
import BrandLogo from '../Components/BrandLogo'
import { usePreferences } from '../lib/PreferencesContext'
import styles from '../styles'

export default function Signin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = usePreferences()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [focusedInput, setFocusedInput] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [staySignedIn, setStaySignedIn] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    if (location.state?.authError) {
      setAuthError(location.state.authError)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  // Auto sign-in if "Stay signed in" session is still valid
  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      const { session, reason } = await getPersistedSession()
      if (cancelled) return

      if (session) {
        navigate('/dashboard', { replace: true })
        return
      }

      if (reason === 'expired') {
        setAuthError(t('signin.sessionExpired'))
      }

      setCheckingSession(false)
    }

    restoreSession()
    return () => {
      cancelled = true
    }
  }, [navigate, t])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (authError) setAuthError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAuthError('')
    setIsSubmitting(true)

    const { data, error } = await signInWithEmail(formData)

    if (error) {
      setAuthError(getAuthErrorMessage(error))
      setIsSubmitting(false)
      return
    }

    if (data?.session) {
      if (staySignedIn) {
        setStaySignedInForDays(STAY_SIGNED_IN_TEST_DAYS)
      } else {
        clearStaySignedInPreference()
      }
      markActiveTabSession()
      navigate('/dashboard', { state: { toast: t('signin.success') } })
      return
    }

    setAuthError('Unable to sign in. Please try again.')
    setIsSubmitting(false)
  }

  const handleGoogleSignIn = async () => {
    setAuthError('')
    setIsGoogleLoading(true)

    // After Google OAuth, AuthCallback blocks unregistered accounts
    const { error } = await signInWithGoogle('signin', {
      rememberDays: staySignedIn ? STAY_SIGNED_IN_TEST_DAYS : 0,
    })

    if (error) {
      setAuthError(getAuthErrorMessage(error))
      setIsGoogleLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className={styles.pageContainer}>
        <main className={styles.mainContainer}>
          <div className={styles.card}>
            <div className={styles.headerSection}>
              <h2 className={styles.cardTitle}>{t('splash.checking')}</h2>
              <p className={styles.cardSubtitle}>{t('splash.restoring')}</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.brandHeader} style={{ justifyContent: 'center' }}>
            <BrandLogo size={40} className={styles.brandHeaderIcon} />
            <span className={styles.brandHeadline}>LigtasLPG</span>
          </div>
          <p className={styles.brandSubtitle}>{t('signin.subtitle')}</p>
        </div>
      </div>

      <main className={styles.mainContainer}>
        <div className={styles.card}>
          <div className={styles.headerSection}>
            <h2 className={styles.cardTitle}>{t('signin.welcome')}</h2>
            <p className={styles.cardSubtitle}>{t('signin.description')}</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="email">
                {t('signin.email')}
              </label>
              <div
                className={`${styles.inputWrapper} ${
                  focusedInput === 'email' ? styles.inputWrapperFocused : ''
                }`}
              >
                <div className={styles.inputIconContainer}>
                  <span className={styles.materialIcon}>mail</span>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="your@email.com"
                  className={styles.input}
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  disabled={isSubmitting || isGoogleLoading}
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.fieldHeader}>
                <label className={styles.label} htmlFor="password">
                  {t('signin.password')}
                </label>
                <a href="#forgot" className={styles.forgotLink}>
                  {t('signin.forgot')}
                </a>
              </div>
              <div
                className={`${styles.inputWrapper} ${
                  focusedInput === 'password' ? styles.inputWrapperFocused : ''
                }`}
              >
                <div className={styles.inputIconContainer}>
                  <span className={styles.materialIcon}>lock</span>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={styles.input}
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  disabled={isSubmitting || isGoogleLoading}
                />
                <button
                  type="button"
                  className={styles.togglePasswordBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  <span className={styles.materialIcon}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {authError && (
              <div className={`${styles.alertBox} ${styles.animateBounce}`}>
                <span className={styles.materialIcon}>warning</span>
                <span className={styles.featureText}>{authError}</span>
              </div>
            )}

            <div className={styles.checkboxContainer}>
              <input
                className={styles.checkbox}
                id="staySignedIn"
                type="checkbox"
                checked={staySignedIn}
                onChange={(e) => setStaySignedIn(e.target.checked)}
                disabled={isSubmitting || isGoogleLoading}
              />
              <label className={styles.termsText} htmlFor="staySignedIn">
                {t('signin.stay', { days: STAY_SIGNED_IN_TEST_DAYS })}
              </label>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting || isGoogleLoading}
            >
              {isSubmitting ? (
                <>
                  <span className={`${styles.materialIcon} ${styles.animateSpin}`}>
                    progress_activity
                  </span>
                  <span>{t('signin.signingIn')}</span>
                </>
              ) : (
                <>
                  <span>{t('signin.submit')}</span>
                  <span className={styles.materialIcon}>login</span>
                </>
              )}
            </button>

            <div className={styles.dividerContainer}>
              <div className={styles.dividerLine} aria-hidden="true">
                <div className={styles.dividerLineInner}></div>
              </div>
              <div className={styles.dividerTextWrapper}>
                <span className={styles.dividerText}>{t('signin.or')}</span>
              </div>
            </div>

            <button
              type="button"
              className={styles.googleBtn}
              onClick={handleGoogleSignIn}
              disabled={isSubmitting || isGoogleLoading}
            >
              {isGoogleLoading ? (
                <>
                  <span className={`${styles.materialIcon} ${styles.animateSpin}`}>
                    progress_activity
                  </span>
                  {t('signin.googleLoading')}
                </>
              ) : (
                <>
                  <svg
                    className={styles.googleIcon}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {t('signin.google')}
                </>
              )}
            </button>
          </form>

          <div className={styles.createAccountContainer}>
            <p className={styles.createAccountText}>
              {t('signin.noAccount')}{' '}
              <Link to="/signup" className={styles.createAccountLink}>
                {t('signin.createAccount')}
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.trustBadges}>
          <div className={styles.badgeItem}>
            <span className={styles.materialIcon}>notifications_active</span>
            <span className={styles.badgeText}>{t('signin.monitoring')}</span>
          </div>
        </div>
        <p className={styles.copyright}>{t('signin.copyright')}</p>
      </footer>
    </div>
  )
}
