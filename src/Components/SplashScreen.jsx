import { useEffect, useLayoutEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import { usePreferences } from '../lib/PreferencesContext'

const SPLASH_MS = 2400
const SKIP_PATHS = new Set(['/auth/callback'])

/**
 * Full-screen branded splash — shows once per app open (page load).
 * Skipped on OAuth callback so Google return is not delayed.
 */
export default function SplashScreen({ onDone }) {
  const location = useLocation()
  const { t } = usePreferences()
  const shouldSkip = SKIP_PATHS.has(location.pathname)
  const [visible, setVisible] = useState(!shouldSkip)
  const [exiting, setExiting] = useState(false)

  useLayoutEffect(() => {
    if (shouldSkip) {
      onDone?.()
    }
  }, [shouldSkip, onDone])

  useEffect(() => {
    if (!visible) return undefined

    const exitTimer = setTimeout(() => setExiting(true), SPLASH_MS - 450)
    const doneTimer = setTimeout(() => {
      setVisible(false)
      onDone?.()
    }, SPLASH_MS)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
    }
  }, [visible, onDone])

  if (!visible) return null

  return (
    <div
      className={`splash-screen${exiting ? ' splash-screen--exit' : ''}`}
      role="presentation"
      aria-hidden="true"
    >
      <div className="splash-glow" />
      <div className="splash-content">
        <div className="splash-logo">
          <BrandLogo size={88} />
        </div>
        <h1 className="splash-title">LigtasLPG</h1>
        <p className="splash-tagline">{t('brand.tagline')}</p>
      </div>
    </div>
  )
}
