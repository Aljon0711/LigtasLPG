import React, { useState } from 'react';
import AppHeader, { HeaderIconButton, HeaderIconLink } from './AppHeader';
import BottomNav from './BottomNav';
import { usePreferences } from '../lib/PreferencesContext';
import '../styles';

export default function Settings() {
  const { t } = usePreferences();
  // --- State Management ---
  const [sensitivity, setSensitivity] = useState(45);
  const [notifications, setNotifications] = useState({
    push: true,
    sms: false,
    email: true,
  });

  // --- Handlers ---
  const handleSliderChange = (e) => {
    setSensitivity(Number(e.target.value));
  };

  const handleToggleChange = (key) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      console.log(`Notification setting '${key}': ${updated[key]}`);
      return updated;
    });
  };

  const isHighSensitivity = sensitivity > 70;

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c] pb-28 font-sans">
      <AppHeader>
        <HeaderIconButton icon="help_outline" label="Help" />
        <HeaderIconLink
          to="/profile"
          icon="account_circle"
          label="Account Settings"
        />
      </AppHeader>

      {/* Main Content Area */}
      <main className="pt-20 px-4 max-w-[1200px] mx-auto space-y-6">
        {/* Page Headline */}
        <div className="py-4">
          <h2 className="text-2xl md:text-3xl font-bold">
            {t('settings.title')}
          </h2>
          <p className="text-sm text-[#5b403d] mt-1">
            {t('settings.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Device Info & Connectivity Column */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Device Info Card */}
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
                  <span className="text-base font-semibold">LPG-MAX-9928-X</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#e2e2e2]">
                  <span className="text-xs font-bold text-[#5b403d] uppercase tracking-wider">
                    Firmware Version
                  </span>
                  <span className="text-base font-semibold">v1.0.4</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs font-bold text-[#5b403d] uppercase tracking-wider">
                    Uptime
                  </span>
                  <span className="text-base font-semibold">14d 06h 22m</span>
                </div>
              </div>
            </section>

            {/* Connectivity Card */}
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
                  <span className="text-base font-semibold">Home_Safety_Net</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs font-bold text-[#5b403d] uppercase tracking-wider">
                    {t('settings.signal')}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-base text-[#11651d] font-bold">
                      {t('settings.strong')}
                    </span>
                    <span className="material-symbols-outlined text-[#11651d] !text-[18px]">
                      signal_wifi_4_bar
                    </span>
                  </div>
                </div>
              </div>
              <button 
                type="button"
                className="mt-6 w-full py-3 bg-[#eeeeee] text-[#1a1c1c] font-semibold rounded-lg hover:bg-[#e2e2e2] transition-colors text-sm flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined !text-[18px]">
                  settings_ethernet
                </span>
                Reconfigure Network
              </button>
            </section>
          </div>

          {/* Thresholds & Notifications Column */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Thresholds Card */}
            <section className="bg-white p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border-t-2 border-[#d32f2f]">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-[#d32f2f]">
                  tune
                </span>
                <h3 className="text-xl font-semibold">{t('settings.sensitivity')}</h3>
              </div>
              <div className="space-y-6 py-4">
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <h4 className="text-base font-bold">{t('settings.sensitivity')}</h4>
                      <p className="text-sm text-[#5b403d]">
                        Adjust how quickly the alarm triggers.
                      </p>
                    </div>
                    <span 
                      className={`font-semibold text-xl px-3 py-1 rounded-lg transition-colors ${
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
                    onChange={handleSliderChange}
                    className="custom-slider w-full cursor-pointer"
                  />
                  <div className="flex justify-between mt-1 text-xs font-bold text-[#5b403d] tracking-wider">
                    <span>CONSERVATIVE</span>
                    <span>AGGRESSIVE</span>
                  </div>
                </div>

                <div className="p-4 bg-[#ffdad6] rounded-lg flex gap-3">
                  <span className="material-symbols-outlined text-[#ba1a1a]">
                    warning
                  </span>
                  <p className="text-sm text-[#93000a] italic">
                    Note: Aggressive settings may result in false positives from cooking fumes.
                  </p>
                </div>
              </div>
            </section>

            {/* Notifications Card */}
            <section className="bg-white p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border-t-2 border-[#11651d]">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-[#11651d]">
                  notifications_active
                </span>
                <h3 className="text-xl font-semibold">{t('settings.notifications')}</h3>
              </div>
              
              <div className="divide-y divide-[#e2e2e2]">
                {/* Push Toggle */}
                <div className="flex items-center justify-between py-4 gap-4">
                  <div className="min-w-0">
                    <h4 className="text-base font-semibold">{t('settings.push')}</h4>
                    <p className="text-sm text-[#5b403d]">
                      Immediate notifications on your device.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifications.push}
                    aria-label={t('settings.push')}
                    onClick={() => handleToggleChange('push')}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifications.push ? 'bg-[#af101a]' : 'bg-[#e2e2e2]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        notifications.push ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* SMS Toggle */}
                <div className="flex items-center justify-between py-4 gap-4">
                  <div className="min-w-0">
                    <h4 className="text-base font-semibold">{t('settings.sms')}</h4>
                    <p className="text-sm text-[#5b403d]">
                      Emergency text messages for critical leaks.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifications.sms}
                    aria-label={t('settings.sms')}
                    onClick={() => handleToggleChange('sms')}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifications.sms ? 'bg-[#af101a]' : 'bg-[#e2e2e2]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        notifications.sms ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Emergency Actions */}
        <div className="flex flex-col md:flex-row gap-4 pt-6">
          <button 
            type="button"
            className="flex-1 bg-[#af101a] text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined filled">
              save
            </span>
            {t('settings.save')}
          </button>
          <button 
            type="button"
            className="flex-1 bg-[#ffdad6] text-[#93000a] font-bold py-4 rounded-xl border-2 border-[#ba1a1a] active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">
              delete_forever
            </span>
            {t('settings.reset')}
          </button>
        </div>

        {/* Decorative Background Symbol */}
        <div className="fixed top-0 right-0 -z-10 opacity-5 pointer-events-none">
          <span className="material-symbols-outlined text-[400px]">
            settings
          </span>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
