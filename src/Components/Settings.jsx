import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader, { HeaderIconButton, HeaderIconLink } from './AppHeader'
import BottomNav from './BottomNav'
import SuccessToast from './SuccessToast'
import { usePreferences } from '../lib/PreferencesContext'
import {
  ensureUserDevice,
  updateDeviceSettings,
  updateDeviceMeta,
  formatUptime,
  isDeviceOnline,
  subscribeToDevice,
  sendDeviceCommand,
  connectDeviceWifi,
  parseWifiNetworks,
  wifiRssiLabel,
  getSchemaSetupMessage,
  DEFAULT_HARDWARE_ID,
} from '../lib/devices'
import { getSmsAccount, isSmsConfigured } from '../lib/sms'
import {
  isPushNative,
  registerPushNotifications,
  unregisterPushNotifications,
} from '../lib/pushNotifications'
import '../styles'

export default function Settings() {
  const navigate = useNavigate()
  const { t } = usePreferences()

  const [device, setDevice] = useState(null)
  const [settings, setSettings] = useState(null)
  const [hardwareId, setHardwareId] = useState(DEFAULT_HARDWARE_ID)
  const [sensitivity, setSensitivity] = useState(45)
  const [notifications, setNotifications] = useState({
    push: true,
    sms: false,
    email: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [setupError, setSetupError] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [scanningWifi, setScanningWifi] = useState(false)
  const [showWifiList, setShowWifiList] = useState(false)
  const [selectedWifi, setSelectedWifi] = useState(null)
  const [wifiPassword, setWifiPassword] = useState('')
  const [connectingWifi, setConnectingWifi] = useState(false)
  const [smsConfigured] = useState(() => isSmsConfigured())
  const [smsAccount, setSmsAccount] = useState(null)
  const [smsBalanceLoading, setSmsBalanceLoading] = useState(false)
  const [smsBalanceError, setSmsBalanceError] = useState('')

  const showToastMsg = (msg) => {
    setToastMessage(msg)
    setShowToast(true)
  }

  const loadSmsBalance = async () => {
    if (!isSmsConfigured()) {
      setSmsAccount(null)
      setSmsBalanceError(t('settings.smsNotConfigured'))
      return
    }

    setSmsBalanceLoading(true)
    setSmsBalanceError('')
    const { data, error } = await getSmsAccount()
    setSmsBalanceLoading(false)

    if (error) {
      setSmsAccount(null)
      setSmsBalanceError(error.message)
      return
    }

    setSmsAccount(data)
  }

  useEffect(() => {
    let cancelled = false
    let unsubscribe = () => {}

    async function load() {
      const { device: d, settings: s, error, code } = await ensureUserDevice()
      if (cancelled) return

      if (code === 'auth') {
        navigate('/', { replace: true })
        return
      }

      if (error || !d) {
        setSetupError(getSchemaSetupMessage(error))
        setLoading(false)
        return
      }

      setSetupError('')
      setDevice(d)
      setSettings(s)
      setHardwareId(d.hardware_id || DEFAULT_HARDWARE_ID)
      setSensitivity(s?.leak_sensitivity ?? 45)
      setNotifications({
        push: s?.notify_push ?? true,
        sms: s?.notify_sms ?? false,
        email: s?.notify_email ?? true,
      })
      setLoading(false)

      unsubscribe = subscribeToDevice(d.id, setDevice)
      if (!cancelled) loadSmsBalance()
    }

    load()
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [navigate])

  const handleRetry = () => {
    setLoading(true)
    setSetupError('')
    ensureUserDevice().then(({ device: d, settings: s, error, code }) => {
      if (code === 'auth') {
        navigate('/', { replace: true })
        return
      }
      if (error || !d) {
        setSetupError(getSchemaSetupMessage(error))
        setLoading(false)
        return
      }
      setDevice(d)
      setSettings(s)
      setHardwareId(d.hardware_id || DEFAULT_HARDWARE_ID)
      setSensitivity(s?.leak_sensitivity ?? 45)
      setNotifications({
        push: s?.notify_push ?? true,
        sms: s?.notify_sms ?? false,
        email: s?.notify_email ?? true,
      })
      setLoading(false)
    })
  }

  const handleToggleChange = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    if (!device || !settings) return
    setSaving(true)

    const { data: updatedDevice, error: deviceError } = await updateDeviceMeta(
      device.id,
      { hardware_id: hardwareId.trim() || DEFAULT_HARDWARE_ID }
    )

    const { data: updatedSettings, error: settingsError } =
      await updateDeviceSettings(settings.id, {
        leak_sensitivity: sensitivity,
        notify_push: notifications.push,
        notify_sms: notifications.sms,
        notify_email: notifications.email,
      })

    setSaving(false)

    if (deviceError || settingsError) {
      showToastMsg(deviceError?.message || settingsError?.message || 'Save failed')
      return
    }

    if (updatedDevice) setDevice(updatedDevice)
    if (updatedSettings) setSettings(updatedSettings)

    if (isPushNative()) {
      if (notifications.push) await registerPushNotifications()
      else await unregisterPushNotifications()
    }

    showToastMsg('Settings saved')
  }

  const handleReset = () => {
    setSensitivity(45)
    setNotifications({ push: true, sms: false, email: true })
    showToastMsg('Defaults restored — tap Save Changes to apply')
  }

  const handleScanWifi = async () => {
    if (!device?.id) return
    if (!isDeviceOnline(device)) {
      showToastMsg(t('settings.wifiScanOffline'))
      setShowWifiList(true)
      return
    }

    setShowWifiList(true)
    setScanningWifi(true)
    const { data, error } = await sendDeviceCommand(device.id, 'scan_wifi')
    if (error) {
      setScanningWifi(false)
      showToastMsg(error.message || 'Wi-Fi scan failed')
      return
    }
    if (data) setDevice(data)
    showToastMsg(t('settings.wifiScanWaiting'))
  }

  useEffect(() => {
    if (!scanningWifi || !device) return
    const networks = parseWifiNetworks(device)
    if (networks.length > 0 || device.wifi_scan_at) {
      // Fresh scan result arrived (or empty result with timestamp)
      const scannedAt = device.wifi_scan_at
        ? new Date(device.wifi_scan_at).getTime()
        : 0
      const commandedAt = device.command_updated_at
        ? new Date(device.command_updated_at).getTime()
        : 0
      if (scannedAt >= commandedAt - 2000) {
        setScanningWifi(false)
      }
    }
  }, [device, scanningWifi])

  useEffect(() => {
    if (!scanningWifi) return undefined
    const timer = setTimeout(() => setScanningWifi(false), 45000)
    return () => clearTimeout(timer)
  }, [scanningWifi])

  const handleSelectWifi = (net) => {
    setSelectedWifi(net)
    setWifiPassword('')
  }

  const handleConnectWifi = async () => {
    if (!device?.id || !selectedWifi?.ssid) return
    if (!isDeviceOnline(device)) {
      showToastMsg(t('settings.wifiScanOffline'))
      return
    }
    if (selectedWifi.secure && !wifiPassword.trim()) {
      showToastMsg(t('settings.wifiPassword'))
      return
    }

    setConnectingWifi(true)
    const { data, error } = await connectDeviceWifi(
      device.id,
      selectedWifi.ssid,
      selectedWifi.secure ? wifiPassword : ''
    )
    if (error) {
      setConnectingWifi(false)
      showToastMsg(error.message || t('settings.wifiConnectFailed'))
      return
    }
    if (data) setDevice(data)
    showToastMsg(t('settings.wifiConnecting'))
  }

  useEffect(() => {
    if (!connectingWifi || !device) return
    const status = device.wifi_connect_status
    if (status === 'connected') {
      setConnectingWifi(false)
      setWifiPassword('')
      showToastMsg(
        device.wifi_connect_message ||
          `${t('settings.wifiConnected')}: ${device.wifi_ssid || selectedWifi?.ssid || ''}`
      )
    } else if (status === 'failed') {
      setConnectingWifi(false)
      showToastMsg(device.wifi_connect_message || t('settings.wifiConnectFailed'))
    }
  }, [device, connectingWifi, selectedWifi, t])

  useEffect(() => {
    if (!connectingWifi) return undefined
    const timer = setTimeout(() => {
      setConnectingWifi(false)
      showToastMsg(t('settings.wifiConnectFailed'))
    }, 60000)
    return () => clearTimeout(timer)
  }, [connectingWifi, t])

  const isHighSensitivity = sensitivity > 70
  const online = isDeviceOnline(device)
  const wifiNetworks = parseWifiNetworks(device)
  const wifiStatus = device?.wifi_connect_status

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center">
        <p className="text-sm text-[#5b403d]">{t('common.loading')}</p>
      </div>
    )
  }

  if (setupError) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c] pb-28 font-sans">
        <AppHeader>
          <HeaderIconLink
            to="/profile"
            icon="account_circle"
            label="Account Settings"
          />
        </AppHeader>
        <main className="pt-24 px-4 max-w-xl mx-auto">
          <div className="rounded-xl border border-[#e4beba] bg-[#ffdad6] p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[#af101a] !text-[28px]">
                database
              </span>
              <div>
                <h2 className="text-lg font-bold text-[#93000a]">
                  Settings needs a database update
                </h2>
                <p className="text-sm text-[#5b403d] mt-2 leading-relaxed">
                  {setupError}
                </p>
              </div>
            </div>
            <ol className="list-decimal pl-5 text-sm text-[#5b403d] space-y-1">
              <li>Open Supabase Dashboard → SQL Editor</li>
              <li>
                Paste and Run <code className="text-xs">supabase/monitoring.sql</code>
              </li>
              <li>Come back here and tap Retry</li>
            </ol>
            <button
              type="button"
              onClick={handleRetry}
              className="w-full bg-[#af101a] text-white font-bold py-3 rounded-xl"
            >
              Retry
            </button>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c] pb-28 font-sans">
      <SuccessToast
        message={toastMessage}
        visible={showToast}
        onHide={() => setShowToast(false)}
      />

      <AppHeader>
        <HeaderIconButton icon="help_outline" label="Help" />
        <HeaderIconLink
          to="/profile"
          icon="account_circle"
          label="Account Settings"
        />
      </AppHeader>

      <main className="pt-20 px-4 max-w-[1200px] mx-auto space-y-6">
        <div className="py-4">
          <h2 className="text-2xl md:text-3xl font-bold">{t('settings.title')}</h2>
          <p className="text-sm text-[#5b403d] mt-1">{t('settings.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-white p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border-t-2 border-[#af101a]">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-[#af101a]">
                  memory
                </span>
                <h3 className="text-xl font-semibold">{t('settings.deviceInfo')}</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-[#e2e2e2]">
                  <span className="text-xs font-bold text-[#5b403d] uppercase tracking-wider">
                    Hardware ID
                  </span>
                  <span className="text-base font-semibold truncate max-w-[55%]">
                    {device?.hardware_id}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#e2e2e2]">
                  <span className="text-xs font-bold text-[#5b403d] uppercase tracking-wider">
                    Firmware Version
                  </span>
                  <span className="text-base font-semibold">
                    {device?.firmware_version || '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs font-bold text-[#5b403d] uppercase tracking-wider">
                    Uptime
                  </span>
                  <span className="text-base font-semibold">
                    {formatUptime(device?.uptime_seconds)}
                  </span>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border-t-2 border-[#005faf]">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-[#005faf]">
                  wifi
                </span>
                <h3 className="text-xl font-semibold">{t('settings.signal')}</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs font-bold text-[#5b403d] uppercase tracking-wider">
                    Wi-Fi SSID
                  </span>
                  <span className="text-base font-semibold">
                    {device?.wifi_ssid || '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs font-bold text-[#5b403d] uppercase tracking-wider">
                    {t('settings.signal')}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-base text-[#11651d] font-bold">
                      {device?.signal_strength || 'unknown'}
                    </span>
                    <span className="material-symbols-outlined text-[#11651d] !text-[18px]">
                      signal_wifi_4_bar
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleScanWifi}
                disabled={scanningWifi}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border-2 border-[#005faf] bg-[#e8f1fb] text-[#005faf] font-bold py-3 active:scale-[0.98] transition-transform disabled:opacity-60"
              >
                <span className="material-symbols-outlined !text-[20px]">
                  {scanningWifi ? 'hourglass_top' : 'wifi_find'}
                </span>
                {scanningWifi ? t('settings.scanningWifi') : t('settings.scanWifi')}
              </button>
              <p className="mt-2 text-xs text-[#5b403d] leading-relaxed">
                {t('settings.wifiScanHint')}
              </p>
              <p className="mt-1 text-xs text-[#5b403d] leading-relaxed">
                {t('settings.wifiConnectHint')}
              </p>

              {showWifiList && (
                <div className="mt-4 border-t border-[#e2e2e2] pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-[#5b403d] uppercase tracking-wider">
                      {t('settings.wifiNetworks')}
                    </h4>
                    {device?.wifi_scan_at && (
                      <span className="text-[11px] text-[#8f6f6c]">
                        {new Date(device.wifi_scan_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  {!online && (
                    <p className="text-sm text-[#af101a] mb-2">
                      {t('settings.wifiScanOffline')}
                    </p>
                  )}

                  {scanningWifi && wifiNetworks.length === 0 && (
                    <p className="text-sm text-[#5b403d]">
                      {t('settings.wifiScanWaiting')}
                    </p>
                  )}

                  {!scanningWifi && wifiNetworks.length === 0 && (
                    <p className="text-sm text-[#5b403d]">
                      {t('settings.wifiScanEmpty')}
                    </p>
                  )}

                  {wifiNetworks.length > 0 && (
                    <ul className="max-h-56 overflow-y-auto divide-y divide-[#e2e2e2]">
                      {wifiNetworks.map((net, idx) => {
                        const active = selectedWifi?.ssid === net.ssid
                        return (
                          <li key={`${net.ssid || 'net'}-${idx}`}>
                            <button
                              type="button"
                              onClick={() => handleSelectWifi(net)}
                              disabled={connectingWifi}
                              className={`w-full flex items-center justify-between gap-3 py-2.5 text-left rounded-lg px-1 transition-colors disabled:opacity-60 ${
                                active ? 'bg-[#e8f1fb]' : 'hover:bg-[#f3f3f3]'
                              }`}
                            >
                              <div className="min-w-0 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#005faf] !text-[20px]">
                                  {net.secure ? 'wifi_lock' : 'wifi'}
                                </span>
                                <span className="text-sm font-semibold text-[#1a1c1c] truncate">
                                  {net.ssid || '(hidden)'}
                                </span>
                                {device?.wifi_ssid &&
                                  device.wifi_ssid === net.ssid && (
                                    <span className="text-[10px] font-bold uppercase text-[#11651d]">
                                      current
                                    </span>
                                  )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-xs font-bold text-[#11651d]">
                                  {wifiRssiLabel(net.rssi)}
                                </span>
                                <span className="text-[11px] text-[#8f6f6c]">
                                  {Number.isFinite(Number(net.rssi))
                                    ? `${net.rssi} dBm`
                                    : ''}
                                </span>
                              </div>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}

                  {selectedWifi && (
                    <div className="mt-4 space-y-3 rounded-xl border border-[#c5d8ef] bg-[#f5f9fd] p-3">
                      <p className="text-sm font-semibold text-[#1a1c1c] truncate">
                        {selectedWifi.ssid}
                      </p>
                      {selectedWifi.secure ? (
                        <div>
                          <label className="text-xs font-bold text-[#5b403d] uppercase tracking-wider">
                            {t('settings.wifiPassword')}
                          </label>
                          <input
                            type="password"
                            autoComplete="off"
                            value={wifiPassword}
                            onChange={(e) => setWifiPassword(e.target.value)}
                            disabled={connectingWifi}
                            className="mt-1 w-full rounded-lg border border-[#8f6f6c] bg-white p-3 text-sm outline-none focus:border-[#005faf] disabled:opacity-60"
                            placeholder="••••••••"
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-[#5b403d]">
                          {t('settings.wifiOpenNetwork')}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={handleConnectWifi}
                        disabled={
                          connectingWifi ||
                          !online ||
                          (selectedWifi.secure && !wifiPassword.trim())
                        }
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#005faf] text-white font-bold py-3 active:scale-[0.98] transition-transform disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined !text-[20px]">
                          {connectingWifi ? 'hourglass_top' : 'link'}
                        </span>
                        {connectingWifi
                          ? t('settings.wifiConnecting')
                          : t('settings.wifiConnect')}
                      </button>
                      {(wifiStatus === 'connecting' ||
                        wifiStatus === 'failed' ||
                        wifiStatus === 'connected') &&
                        device?.wifi_connect_message && (
                          <p
                            className={`text-xs ${
                              wifiStatus === 'failed'
                                ? 'text-[#af101a]'
                                : wifiStatus === 'connected'
                                  ? 'text-[#11651d]'
                                  : 'text-[#5b403d]'
                            }`}
                          >
                            {device.wifi_connect_message}
                          </p>
                        )}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <section className="bg-white p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border-t-2 border-[#d32f2f]">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-[#d32f2f]">
                  tune
                </span>
                <h3 className="text-xl font-semibold">
                  {t('settings.sensitivity')}
                </h3>
              </div>
              <div className="space-y-6 py-4">
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <h4 className="text-base font-bold">
                        {t('settings.sensitivity')}
                      </h4>
                      <p className="text-sm text-[#5b403d]">
                        Adjust how quickly leak detection confirms a shutoff.
                      </p>
                    </div>
                    <span
                      className={`font-semibold text-xl px-3 py-1 rounded-lg ${
                        isHighSensitivity
                          ? 'text-[#ba1a1a] bg-[#ffdad6]'
                          : 'text-[#af101a] bg-[#ffdad6]'
                      }`}
                    >
                      {sensitivity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sensitivity}
                    onChange={(e) => setSensitivity(Number(e.target.value))}
                    className="custom-slider w-full cursor-pointer"
                  />
                  <div className="flex justify-between mt-1 text-xs font-bold text-[#5b403d] tracking-wider">
                    <span>CONSERVATIVE</span>
                    <span>AGGRESSIVE</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border-t-2 border-[#11651d]">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-[#11651d]">
                  notifications_active
                </span>
                <h3 className="text-xl font-semibold">
                  {t('settings.notifications')}
                </h3>
              </div>

              <div className="divide-y divide-[#e2e2e2]">
                <div className="flex items-center justify-between py-4 gap-4">
                  <div className="min-w-0">
                    <h4 className="text-base font-semibold text-[#1a1c1c]">
                      {t('settings.push')}
                    </h4>
                    <p className="text-sm text-[#5b403d] mt-1">
                      {t('settings.pushDesc')}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifications.push}
                    onClick={() => handleToggleChange('push')}
                    className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors ${
                      notifications.push
                        ? 'border-[#af101a] bg-[#af101a]'
                        : 'border-[#8f6f6c] bg-[#8f6f6c]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                        notifications.push ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="py-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="text-base font-semibold text-[#1a1c1c]">
                      {t('settings.sms')}
                    </h4>
                    <button
                      type="button"
                      role="switch"
                      aria-label={t('settings.sms')}
                      aria-checked={notifications.sms}
                      onClick={() => handleToggleChange('sms')}
                      className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors ${
                        notifications.sms
                          ? 'border-[#af101a] bg-[#af101a]'
                          : 'border-[#8f6f6c] bg-[#8f6f6c]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                          notifications.sms ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-sm text-[#5b403d]">{t('settings.smsDesc')}</p>

                  <div className="rounded-xl border border-[#e2e2e2] bg-[#f3f3f3] p-3 space-y-3">
                    {!smsConfigured ? (
                      <p className="text-sm text-[#af101a]">
                        {t('settings.smsNotConfigured')}
                      </p>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#5b403d]">
                              {t('settings.smsBalance')}
                            </p>
                            {smsBalanceLoading ? (
                              <p className="text-sm text-[#5b403d] mt-1">
                                {t('settings.smsBalanceLoading')}
                              </p>
                            ) : smsBalanceError ? (
                              <p className="text-sm text-[#af101a] mt-1">
                                {smsBalanceError}
                              </p>
                            ) : (
                              <>
                                <p className="text-lg font-bold text-[#1a1c1c] mt-1">
                                  {smsAccount?.credit_balance ??
                                    smsAccount?.balance ??
                                    '—'}
                                </p>
                                {smsAccount?.label ? (
                                  <p className="text-xs text-[#5b403d] truncate">
                                    {smsAccount.label}
                                    {smsAccount.last_seen_label
                                      ? ` · last seen ${smsAccount.last_seen_label}`
                                      : ''}
                                  </p>
                                ) : null}
                              </>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={loadSmsBalance}
                            disabled={smsBalanceLoading}
                            className="shrink-0 rounded-lg border border-[#005faf] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#005faf] disabled:opacity-60"
                          >
                            {t('settings.smsRefreshBalance')}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 pt-6">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#af101a] text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <span className="material-symbols-outlined filled">save</span>
            {saving ? t('common.saving') : t('settings.save')}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 bg-[#ffdad6] text-[#93000a] font-bold py-4 rounded-xl border-2 border-[#ba1a1a] active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">delete_forever</span>
            {t('settings.reset')}
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
