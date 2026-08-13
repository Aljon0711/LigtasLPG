import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import AppHeader, { HeaderIconLink } from './AppHeader'
import BottomNav from './BottomNav'
import SuccessToast from './SuccessToast'
import { getCurrentProfile } from '../lib/profile'
import { usePreferences } from '../lib/PreferencesContext'
import {
  ensureUserDevice,
  subscribeToDevice,
  sendDeviceCommand,
  addActivityLog,
  isDeviceOnline,
  pressureToGaugeOffset,
  getSchemaSetupMessage,
} from '../lib/devices'
import {
  triggerAlarmFeedback,
  vibrateAlarm,
  stopAlarmSound,
} from '../lib/alarmFeedback'
import { isAlertMinimized, setAlertMinimized } from '../lib/alertSession'
import styles from '../styles'

export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = usePreferences()

  const [userName, setUserName] = useState('')
  const [device, setDevice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isTestingAlarm, setIsTestingAlarm] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [busy, setBusy] = useState(false)
  const lastStatusRef = useRef(null)
  // Ignore conflicting realtime valve_open briefly after user taps open/close
  const valveLockRef = useRef({ until: 0, expected: null })
  // After "I AM SAFE", ignore stale critical telemetry for a short grace window
  const alertSuppressUntilRef = useRef(0)

  const showToastMsg = (message) => {
    setToastMessage(message)
    setShowToast(true)
  }

  useEffect(() => {
    let cancelled = false
    let unsubscribe = () => {}

    async function boot() {
      const { user, profile, error } = await getCurrentProfile()
      if (cancelled) return
      if (error || !user) {
        navigate('/', { replace: true })
        return
      }

      setUserName(profile?.full_name || t('common.user'))

      const { device: d, error: deviceError, code } = await ensureUserDevice()
      if (cancelled) return

      if (deviceError) {
        showToastMsg(getSchemaSetupMessage(deviceError))
        setLoading(false)
        return
      }

      if (code === 'auth' || !d) {
        navigate('/', { replace: true })
        return
      }

      setDevice(d)
      lastStatusRef.current = d?.system_status
      setLoading(false)

      unsubscribe = subscribeToDevice(d.id, (next) => {
        const suppressAlert = Date.now() < alertSuppressUntilRef.current
        setDevice((prev) => {
          const lock = valveLockRef.current
          const locked =
            lock.expected != null && Date.now() < lock.until
          let merged = next
          if (
            locked &&
            prev &&
            Boolean(next.valve_open) !== Boolean(lock.expected)
          ) {
            merged = { ...next, valve_open: lock.expected }
          } else if (
            locked &&
            Boolean(next.valve_open) === Boolean(lock.expected)
          ) {
            valveLockRef.current = { until: 0, expected: null }
          }
          // Keep UI clear of stale emergency while reset is settling
          if (
            suppressAlert &&
            (merged.system_status === 'critical' || merged.emergency_latched)
          ) {
            merged = {
              ...merged,
              system_status: 'safe',
              emergency_latched: false,
              alarm_active: false,
            }
          }
          return merged
        })
        if (
          !suppressAlert &&
          !isAlertMinimized() &&
          next.system_status === 'critical' &&
          lastStatusRef.current !== 'critical'
        ) {
          navigate('/alert', { replace: true })
        }
        if (!suppressAlert) {
          lastStatusRef.current = next.system_status
        } else {
          lastStatusRef.current = 'safe'
        }
      })
    }

    boot()
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [navigate, t])

  useEffect(() => {
    const message = location.state?.toast
    const fromEmergencyReset = Boolean(location.state?.emergencyReset)
    const fromMinimize = Boolean(location.state?.alertMinimized)
    if (fromMinimize) {
      setAlertMinimized(true)
    }
    if (fromEmergencyReset) {
      alertSuppressUntilRef.current = Date.now() + 20000
      lastStatusRef.current = 'safe'
      setDevice((prev) =>
        prev
          ? {
              ...prev,
              system_status: 'safe',
              emergency_latched: false,
              alarm_active: false,
            }
          : prev
      )
    }
    if (message) {
      showToastMsg(message)
    }
    if (message || fromEmergencyReset || fromMinimize) {
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  // Auto-open alert if already critical (skip after I AM SAFE or minimize)
  useEffect(() => {
    if (Date.now() < alertSuppressUntilRef.current) return
    if (isAlertMinimized()) return
    if (device?.system_status === 'critical' || device?.emergency_latched) {
      navigate('/alert', { replace: true })
    }
  }, [device?.system_status, device?.emergency_latched, navigate])

  const emergencyMinimized =
    isAlertMinimized() &&
    (device?.system_status === 'critical' || device?.emergency_latched)

  const clearButtonFocus = (event) => {
    // Prevent sticky :hover/:focus styles on touch phones
    event.currentTarget?.blur?.()
  }

  useEffect(() => {
    if (!isTestingAlarm) stopAlarmSound()
  }, [isTestingAlarm])

  const handleTestAlarm = async (event) => {
    if (!device || isTestingAlarm || busy) return
    // Vibrate immediately in the tap stack (before blur/async) for Android
    vibrateAlarm([450, 100, 450, 100, 450, 100, 450, 100, 800])
    clearButtonFocus(event)
    setIsTestingAlarm(true)
    setBusy(true)
    void triggerAlarmFeedback()
    const { error } = await sendDeviceCommand(device.id, 'test_alarm')
    await addActivityLog({
      deviceId: device.id,
      title: 'Test Alarm Triggered',
      description: 'User triggered a test alarm from the dashboard.',
      logType: 'info',
      icon: 'notifications_active',
      pressureKpa: device.pressure_kpa,
    })
    setBusy(false)
    if (error) showToastMsg(error.message)
    setTimeout(() => setIsTestingAlarm(false), 2500)
  }

  const handleToggleValve = async (event) => {
    if (!device || busy) return
    clearButtonFocus(event)
    setBusy(true)
    const nextOpen = !device.valve_open
    const command = nextOpen ? 'open_valve' : 'close_valve'
    valveLockRef.current = { until: Date.now() + 12000, expected: nextOpen }
    setDevice((prev) => (prev ? { ...prev, valve_open: nextOpen } : prev))
    const { data, error } = await sendDeviceCommand(device.id, command)
    if (data) {
      setDevice({ ...data, valve_open: nextOpen })
    }
    await addActivityLog({
      deviceId: device.id,
      title: nextOpen ? 'Valve Opened' : 'Valve Closed',
      description: `User requested valve ${nextOpen ? 'open' : 'close'} from dashboard.`,
      logType: 'neutral',
      icon: 'settings_input_component',
      pressureKpa: device.pressure_kpa,
    })
    setBusy(false)
    if (error) {
      valveLockRef.current = { until: 0, expected: null }
      showToastMsg(error.message)
    }
  }

  const handleEmergencyShutOff = async (event) => {
    if (!device || busy) return
    clearButtonFocus(event)
    setBusy(true)
    valveLockRef.current = { until: Date.now() + 12000, expected: false }
    const { data, error } = await sendDeviceCommand(device.id, 'emergency_shutoff')
    if (data) setDevice({ ...data, valve_open: false })
    await addActivityLog({
      deviceId: device.id,
      title: 'Emergency Shutoff',
      description: 'Emergency protocol activated from the dashboard. Valve closed.',
      logType: 'critical',
      icon: 'warning',
      iconFilled: true,
      hasReport: true,
      pressureKpa: device.pressure_kpa,
    })
    setBusy(false)
    if (error) showToastMsg(error.message)
    navigate('/alert')
  }

  const firstName = userName.trim().split(/\s+/)[0] || t('common.user')
  const online = isDeviceOnline(device)
  const pressure = Number(device?.pressure_kpa || 0)
  const gaugeOffset = pressureToGaugeOffset(pressure)
  const flameOn = Boolean(device?.flame_detected)
  const valveOpen = Boolean(device?.valve_open)
  const status = device?.system_status || 'offline'

  const statusTitle =
    status === 'critical'
      ? t('alert.title')
      : status === 'warning'
        ? 'System Warning'
        : status === 'offline' || !online
          ? 'Device Offline'
          : t('dashboard.statusOk')

  const statusDesc =
    status === 'critical'
      ? t('alert.subtitle')
      : status === 'warning'
        ? 'Unusual pressure drop detected. Monitoring closely.'
        : status === 'offline' || !online
          ? 'Waiting for ESP32 telemetry. Pair device in Settings.'
          : t('dashboard.statusDesc')

  const alarmText = isTestingAlarm
    ? t('dashboard.testingAlarm')
    : t('dashboard.testAlarm')

  if (loading) {
    return (
      <div className={styles.pageBody}>
        <AppHeader />
        <main className={styles.mainContent}>
          <p className="text-sm text-[#5b403d]">{t('common.loading')}</p>
        </main>
      </div>
    )
  }

  return (
    <div className={styles.pageBody}>
      <SuccessToast
        message={toastMessage}
        visible={showToast}
        onHide={() => setShowToast(false)}
      />

      <AppHeader>
        <div className={`${styles.onlineBadge} flex items-center gap-2`}>
          <div
            className={styles.pulseDot}
            style={!online ? { backgroundColor: '#8f6f6c' } : undefined}
          />
          <span className={styles.onlineText}>
            {online ? t('dashboard.online') : 'Offline'}
          </span>
        </div>
        {userName && (
          <span className="hidden sm:inline text-sm font-semibold text-[#5b403d] max-w-[140px] truncate">
            {firstName}
          </span>
        )}
        <HeaderIconLink to="/profile" icon="account_circle" label="Account" />
      </AppHeader>

      <main className={styles.mainContent}>
        {emergencyMinimized && (
          <button
            type="button"
            onClick={() => {
              setAlertMinimized(false)
              navigate('/alert', { replace: true })
            }}
            className="mb-4 w-full flex items-center justify-between gap-3 rounded-xl bg-[#af101a] px-4 py-3 text-left text-white shadow-md"
          >
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-wider">
                {t('alert.title')}
              </p>
              <p className="text-xs text-white/90 mt-0.5">
                {t('alert.minimizedBanner')}
              </p>
            </div>
            <span className="material-symbols-outlined shrink-0">chevron_right</span>
          </button>
        )}

        <div className="mb-4 px-1">
          <h2 className="text-xl font-bold text-[#1a1c1c]">
            {t('dashboard.welcome')}
            {userName ? ` ${firstName}` : ''}
          </h2>
          <p className="text-sm text-[#5b403d] mt-0.5">{statusDesc}</p>
        </div>

        <section className={styles.statusCard}>
          <div className={styles.statusCardBody}>
            <div className={styles.statusIconWrapper}>
              <span
                className={`${styles.materialIcon} ${styles.materialIconFilled} ${styles.statusIcon}`}
              >
                {status === 'critical'
                  ? 'warning'
                  : online
                    ? 'verified_user'
                    : 'cloud_off'}
              </span>
            </div>
            <div>
              <h2 className={styles.statusHeadline}>{statusTitle}</h2>
              <p className={styles.statusDescription}>{statusDesc}</p>
            </div>
          </div>
        </section>

        <div className={styles.gridBento}>
          <div className={styles.metricCard}>
            <h3 className={styles.cardTitle}>{t('dashboard.gaugeLabel')}</h3>
            <div className={styles.gaugeContainer}>
              <svg className={styles.gaugeSvg} viewBox="0 0 100 100">
                <circle
                  className={styles.gaugeTrack}
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                />
                <circle
                  className={styles.gaugeProgress}
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r="42"
                  stroke="currentColor"
                  strokeDasharray="264"
                  strokeDashoffset={gaugeOffset}
                  strokeLinecap="round"
                  strokeWidth="8"
                />
              </svg>
              <div className={styles.gaugeValueWrapper}>
                <span className={styles.gaugeNumber}>{pressure.toFixed(1)}</span>
                <span className={styles.gaugeUnit}>kPa</span>
              </div>
            </div>
            <div className={styles.infoFooter}>
              <span className={styles.materialIcon} style={{ fontSize: '14px' }}>
                info
              </span>
              <span className={styles.infoText}>
                {device?.pressure_volts != null
                  ? `${Number(device.pressure_volts).toFixed(2)} V sensor`
                  : t('dashboard.statusTitle')}
              </span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <h3 className={styles.cardTitle}>{t('dashboard.flameTitle')}</h3>
            <div className={styles.flameVisualWrapper}>
              <div className={styles.flameVisualBorder} />
              <span className={`${styles.materialIcon} ${styles.flameIcon}`}>
                {flameOn ? 'local_fire_department' : 'mode_fan'}
              </span>
            </div>
            <div className={styles.flameTextGroup}>
              <p className={styles.flameTitle}>
                {flameOn ? 'Flame Detected' : 'No Flame Detected'}
              </p>
              <p className={styles.statusDescription}>
                {flameOn
                  ? 'Cooking / burner activity detected'
                  : t('dashboard.flameInactive')}
              </p>
            </div>
            <div className={styles.flameBadge}>
              <span className={styles.idleDot} />
              <span className={styles.cardTitle}>{flameOn ? 'ACTIVE' : 'IDLE'}</span>
            </div>
          </div>
        </div>

        <section className={styles.controlsSection}>
          <h3 className={styles.cardTitle}>{t('dashboard.statusTitle')}</h3>
          <div className={styles.controlsGrid}>
            <button
              className={styles.btnAlarm}
              onClick={handleTestAlarm}
              type="button"
              disabled={busy}
            >
              <span className={`${styles.materialIcon} ${styles.btnAlarmIcon}`}>
                notifications_active
              </span>
              <span className={styles.cardTitle}>{alarmText}</span>
            </button>

            <button
              className={styles.btnValve}
              onClick={handleToggleValve}
              type="button"
              disabled={busy || device?.emergency_latched}
            >
              <span className={`${styles.materialIcon} ${styles.btnValveIcon}`}>
                settings_input_component
              </span>
              <span className={styles.cardTitle}>
                {valveOpen ? t('dashboard.closeValve') : t('dashboard.openValve')}
              </span>
            </button>
          </div>
        </section>

        <div className={styles.emergencyBanner}>
          <div className={styles.emergencyLeft}>
            <span className={`${styles.materialIcon} ${styles.emergencyIcon}`}>
              emergency_home
            </span>
            <div>
              <h4 className={styles.emergencyTitle}>{t('dashboard.emergency')}</h4>
              <p className={styles.emergencyText}>{t('dashboard.emergencyDesc')}</p>
            </div>
          </div>
          <button
            className={styles.emergencyBtn}
            onClick={handleEmergencyShutOff}
            type="button"
            disabled={busy}
          >
            SHUT OFF
          </button>
        </div>
      </main>

      <BottomNav />

      <aside className={styles.desktopSidebar}>
        <Link
          to="/dashboard"
          className={`${styles.materialIcon} ${styles.materialIconFilled} ${styles.sidebarIconActive}`}
          aria-label={t('nav.home')}
        >
          dashboard
        </Link>
        <Link
          to="/logs"
          className={`${styles.materialIcon} ${styles.sidebarIcon}`}
          aria-label={t('nav.logs')}
        >
          history
        </Link>
        <Link
          to="/settings"
          className={`${styles.materialIcon} ${styles.sidebarIcon}`}
          aria-label={t('nav.settings')}
        >
          settings
        </Link>
      </aside>
    </div>
  )
}
