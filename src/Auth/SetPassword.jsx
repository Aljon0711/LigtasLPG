import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  setAppPassword,
  getProfile,
  getAuthErrorMessage,
  signOut,
} from '../lib/auth'
import BrandLogo from '../Components/BrandLogo'
import { usePreferences } from '../lib/PreferencesContext'
import styles from '../styles'

/**
 * Forced after Google Sign Up — user must set an app password
 * separate from their Google password.
 */
export default function SetPassword() {
  const navigate = useNavigate()
  const { t } = usePreferences()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')
  const [email, setEmail] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function guard() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        navigate('/signup', { replace: true })
        return
      }

      const { data: profile } = await getProfile(session.user.id)

      if (profile?.password_set) {
        navigate('/dashboard', {
          replace: true,
          state: { toast: t('signin.success') },
        })
        return
      }

      if (!cancelled) {
        setEmail(session.user.email || '')
        setChecking(false)
      }
    }

    guard()
    return () => {
      cancelled = true
    }
  }, [navigate, t])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAuthError('')

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)

    const { error } = await setAppPassword(password)

    if (error) {
      setAuthError(getAuthErrorMessage(error))
      setIsSubmitting(false)
      return
    }

    navigate('/dashboard', {
      replace: true,
      state: { toast: 'Sign up successful' },
    })
  }

  const handleCancel = async () => {
    await signOut()
    navigate('/signup', { replace: true })
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center font-sans">
        <p className="text-sm font-semibold text-[#5b403d]">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.bgDecoration}>
        <div className={styles.safetyMesh}></div>
        <div className={styles.glowTopLeft}></div>
        <div className={styles.glowBottomRight}></div>
      </div>

      <main className={styles.mainCanvas}>
        <section className={styles.formSection} style={{ maxWidth: 440 }}>
          <div className={styles.mobileLogo}>
            <BrandLogo size={48} />
            <span className={styles.brandHeadline}>LigtasLPG</span>
          </div>

          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>{t('setPassword.title')}</h2>
              <p className={styles.formSubtitle}>
                {t('setPassword.subtitle')}
                {email ? ` (${email})` : ''}
              </p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="password">
                  {t('setPassword.password')}
                </label>
                <div className={styles.inputWrapper}>
                  <span className={`${styles.materialIcon} ${styles.inputIcon}`}>
                    lock
                  </span>
                  <input
                    className={styles.input}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="confirmPassword">
                  {t('setPassword.confirm')}
                </label>
                <div className={styles.inputWrapper}>
                  <span className={`${styles.materialIcon} ${styles.inputIcon}`}>
                    verified_user
                  </span>
                  <input
                    className={styles.input}
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <label className={styles.termsText} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                Show passwords
              </label>

              {authError && (
                <div className={`${styles.alertBox} ${styles.animateBounce}`}>
                  <span className={styles.materialIcon}>warning</span>
                  <span className={styles.featureText}>{authError}</span>
                </div>
              )}

              <div className={styles.actionContainer}>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className={`${styles.materialIcon} ${styles.animateSpin}`}
                      >
                        progress_activity
                      </span>
                      {t('setPassword.saving')}
                    </>
                  ) : (
                    <>
                      {t('setPassword.submit')}
                      <span className={styles.materialIcon}>arrow_forward</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className={styles.signInLinkBtn}
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}
