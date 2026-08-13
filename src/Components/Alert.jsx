import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppHeader from './AppHeader'
import { usePreferences } from '../lib/PreferencesContext'
import {
  ensureUserDevice,
  sendDeviceCommand,
  addActivityLog,
  subscribeToDevice,
} from '../lib/devices'
import { getCurrentProfile, getEmergencyContacts } from '../lib/profile'
import {
  startContinuousAlarm,
  stopContinuousAlarm,
  ensureAlarmPlaying,
} from '../lib/alarmFeedback'
import { isSmsConfigured, sendEmergencySmsAlerts } from '../lib/sms'
import { clearAlertSession, setAlertMinimized } from '../lib/alertSession'
import { clearEmergencyNotification } from '../lib/localNotifications'
import '../styles'

export default function Alert() {
  const navigate = useNavigate()
  const { t } = usePreferences()
  const [holdingProgress, setHoldingProgress] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [device, setDevice] = useState(null)
  const [primaryContact, setPrimaryContact] = useState(null)
  const [smsStatus, setSmsStatus] = useState('')
  const pressTimerRef = useRef(null)
  const smsSentRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    let unsubscribe = () => {}

    async function load() {
      const { user, error } = await getCurrentProfile()
      if (cancelled) return
      if (error || !user) {
        navigate('/', { replace: true })
        return
      }

      const { device: d, settings: s } = await ensureUserDevice()
      if (cancelled) return
      setDevice(d)
      // Stale notification tap after "I am safe" — don't keep alarm screen open
      const stillCritical =
        d?.system_status === 'critical' || d?.emergency_latched
      if (!stillCritical) {
        clearEmergencyNotification()
        navigate('/dashboard', { replace: true })
        return
      }
      if (d?.id) unsubscribe = subscribeToDevice(d.id, setDevice)

      const { data: contacts } = await getEmergencyContacts(user.id)
      if (cancelled) return

      const primary =
        contacts?.find((c) => c.is_primary) || contacts?.[0] || null
      setPrimaryContact(primary)

      if (
        !smsSentRef.current &&
        s?.notify_sms &&
        isSmsConfigured() &&
        primary
      ) {
        smsSentRef.current = true
        setSmsStatus('Sending SMS alert…')
        const { sent, errors } = await sendEmergencySmsAlerts({
          contacts: [primary],
          pressureKpa: d?.pressure_kpa,
          hardwareId: d?.hardware_id,
        })
        if (cancelled) return
        if (sent.length > 0) {
          setSmsStatus(`SMS sent to ${primary.name || primary.phone}`)
        } else {
          setSmsStatus(errors[0]?.message || 'SMS send failed')
        }
      } else if (s?.notify_sms && !isSmsConfigured()) {
        setSmsStatus('SMS alerts on — add VITE_TEXTBEE_API_KEY in .env')
      }
    }

    load()
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [navigate])

  useEffect(() => {
    void startContinuousAlarm()
    return () => {
      stopContinuousAlarm()
    }
  }, [])

  const startPress = () => {
    if (isResetting) return
    ensureAlarmPlaying()
    setHoldingProgress(true)
    pressTimerRef.current = setTimeout(() => {
      handleIAmSafe()
    }, 2000)
  }

  const cancelPress = () => {
    if (isResetting) return
    setHoldingProgress(false)
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current)
  }

  const handleMinimize = () => {
    stopContinuousAlarm()
    setAlertMinimized(true)
    navigate('/dashboard', {
      replace: true,
      state: {
        toast: t('alert.minimizedToast'),
        alertMinimized: true,
      },
    })
  }

  const handleIAmSafe = async () => {
    setIsResetting(true)
    setHoldingProgress(false)
    stopContinuousAlarm()
    clearAlertSession()
    clearEmergencyNotification()

    if (device?.id) {
      await sendDeviceCommand(device.id, 'reset_emergency')
      await addActivityLog({
        deviceId: device.id,
        title: 'System Reset',
        description: 'User confirmed safety and reset the emergency lockout.',
        logType: 'safe',
        icon: 'check_circle',
        iconFilled: true,
        pressureKpa: device.pressure_kpa,
      })
    }

    setTimeout(
      () =>
        navigate('/dashboard', {
          replace: true,
          state: {
            emergencyReset: true,
            toast: t('alert.safeToast'),
          },
        }),
      800
    )
  }

  const handleEmergencyCall = () => {
    ensureAlarmPlaying()
    const phone = primaryContact?.phone || '911'
    window.location.href = `tel:${phone.replace(/\s+/g, '')}`
  }

  return (
    <div
      className="bg-[#d32f2f] text-white overflow-hidden h-screen flex flex-col font-sans relative"
      onPointerDown={ensureAlarmPlaying}
    >
      <AppHeader variant="alert">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleMinimize()
          }}
          className="material-symbols-outlined text-white !text-[24px] p-1"
          aria-label={t('alert.minimize')}
          title={t('alert.minimize')}
        >
          close
        </button>
        <Link
          to="/profile"
          className="material-symbols-outlined text-white !text-[24px] p-1"
          aria-label="Account"
          onClick={(e) => e.stopPropagation()}
        >
          account_circle
        </Link>
      </AppHeader>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center relative pt-16 pb-24">
        <div className="z-10 w-full max-w-md flex flex-col gap-6">
          <div className="relative mx-auto">
            <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center pulse-red">
              <span
                className="material-symbols-outlined text-[#d32f2f] text-[64px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                warning
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl leading-tight font-extrabold uppercase tracking-tight">
              {t('alert.title')}
            </h1>
            <p className="text-base font-medium text-white/90">
              {t('alert.subtitle')}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-white text-[#d32f2f] rounded-full text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">
                gpp_good
              </span>
              {device?.valve_open === false
                ? 'VALVE CLOSED'
                : 'EMERGENCY ACTIVE'}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl text-left space-y-4">
            <div className="flex gap-4 items-center">
              <span className="material-symbols-outlined flex-shrink-0 text-white">
                door_open
              </span>
              <p className="text-base text-white font-medium">
                Leave the area immediately. Open windows if it is safe to do so.
              </p>
            </div>

            <div className="h-[1px] bg-white/20 w-full" />

            <div className="flex gap-4 items-center opacity-90">
              <span className="material-symbols-outlined flex-shrink-0 text-white">
                info
              </span>
              <p className="text-xs text-white">
                Pressure:{' '}
                {device?.pressure_kpa != null
                  ? `${Number(device.pressure_kpa).toFixed(1)} kPa`
                  : '—'}
                {device?.last_seen_at
                  ? ` · Updated ${new Date(device.last_seen_at).toLocaleTimeString()}`
                  : ''}
              </p>
            </div>

            {smsStatus ? (
              <>
                <div className="h-[1px] bg-white/20 w-full" />
                <div className="flex gap-4 items-center">
                  <span className="material-symbols-outlined flex-shrink-0 text-white">
                    sms
                  </span>
                  <p className="text-xs text-white font-medium">{smsStatus}</p>
                </div>
              </>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleMinimize()
              }}
              className="w-full border-2 border-white/80 text-white text-base py-3 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <span className="material-symbols-outlined">minimize</span>
              {t('alert.minimize')}
            </button>
            <p className="text-white/70 text-xs font-medium -mt-1">
              {t('alert.minimizeHint')}
            </p>

            <div className="relative group">
              <button
                type="button"
                disabled={isResetting}
                onMouseDown={startPress}
                onMouseUp={cancelPress}
                onMouseLeave={cancelPress}
                onTouchStart={(e) => {
                  e.preventDefault()
                  startPress()
                }}
                onTouchEnd={cancelPress}
                className={`w-full bg-white text-[#d32f2f] text-base py-4 rounded-xl shadow-2xl active:scale-95 transition-transform duration-100 overflow-hidden relative select-none font-bold uppercase tracking-widest ${
                  isResetting ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <div
                  className="absolute left-0 top-0 h-full bg-[#d32f2f]/20 pointer-events-none transition-all duration-[2000ms] ease-linear"
                  style={{
                    width: holdingProgress ? '100%' : '0%',
                    transitionDuration: holdingProgress ? '2000ms' : '0ms',
                  }}
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span
                    className="material-symbols-outlined !text-[22px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified_user
                  </span>
                  {isResetting ? t('alert.resetting') : t('alert.dismiss')}
                </span>
              </button>
              <p className="mt-2 text-white/70 text-xs font-semibold uppercase tracking-wider">
                {t('alert.holdSafe')}
              </p>
            </div>

            <button
              type="button"
              onClick={handleEmergencyCall}
              className="w-full border-2 border-white text-white text-base py-3 rounded-xl hover:bg-white hover:text-[#d32f2f] transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <span className="material-symbols-outlined">call</span>
              {primaryContact
                ? `${t('alert.call')} (${primaryContact.name})`
                : t('alert.call')}
            </button>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-6 left-0 w-full flex justify-center px-6 opacity-60 z-10">
        <div className="flex items-center gap-6 text-xs font-bold tracking-wider uppercase">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined !text-[16px]">router</span>
            <span>DEVICE: {device?.hardware_id || '—'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined !text-[16px]">
              local_fire_department
            </span>
            <span>FLAME: {device?.flame_detected ? 'ON' : 'OFF'}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
