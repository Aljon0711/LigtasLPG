import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AppHeader, { HeaderIconLink } from './AppHeader';
import BottomNav from './BottomNav';
import SuccessToast from './SuccessToast';
import { getCurrentProfile } from '../lib/profile';
import { usePreferences } from '../lib/PreferencesContext';
import styles from '../styles';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = usePreferences();
  const [gaugeOffset, setGaugeOffset] = useState(180);
  const [isTestingAlarm, setIsTestingAlarm] = useState(false);
  const [isValveOpen, setIsValveOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [userName, setUserName] = useState('');

  // Load signed-in user name
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      const { user, profile, error } = await getCurrentProfile();
      if (cancelled) return;

      if (error || !user) {
        navigate('/', { replace: true });
        return;
      }

      setUserName(profile?.full_name || t('common.user'));
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, [navigate, t]);

  // Show toast after sign in / sign up
  useEffect(() => {
    const message = location.state?.toast;
    if (message) {
      setToastMessage(message);
      setShowToast(true);
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    // Google OAuth returns with tokens in the URL hash
    if (window.location.hash.includes('access_token')) {
      setToastMessage(t('signin.success'));
      setShowToast(true);
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.state, location.pathname, navigate, t]);

  // Simulate real-time gauge pressure variation
  useEffect(() => {
    const interval = setInterval(() => {
      const randomOffset = Math.floor(Math.random() * 20) + 160;
      setGaugeOffset(randomOffset);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Handle Test Alarm button click
  const handleTestAlarm = () => {
    if (isTestingAlarm) return;

    setIsTestingAlarm(true);

    setTimeout(() => {
      setIsTestingAlarm(false);
    }, 1500);
  };

  // Handle Toggle Valve button click
  const handleToggleValve = () => {
    setIsValveOpen((prev) => !prev);
  };

  // Handle Emergency Shut Off
  const handleEmergencyShutOff = () => {
    setIsValveOpen(false);
    navigate('/alert');
  };

  const firstName = userName.trim().split(/\s+/)[0] || t('common.user');
  const alarmText = isTestingAlarm
    ? t('dashboard.testingAlarm')
    : t('dashboard.testAlarm');

  return (
    <div className={styles.pageBody}>
      <SuccessToast
        message={toastMessage}
        visible={showToast}
        onHide={() => setShowToast(false)}
      />

      <AppHeader>
        <div className={`${styles.onlineBadge} flex items-center gap-2`}>
          <div className={styles.pulseDot}></div>
          <span className={styles.onlineText}>{t('dashboard.online')}</span>
        </div>
        {userName && (
          <span className="hidden sm:inline text-sm font-semibold text-[#5b403d] max-w-[140px] truncate">
            {firstName}
          </span>
        )}
        <HeaderIconLink to="/profile" icon="account_circle" label="Account" />
      </AppHeader>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <div className="mb-4 px-1">
          <h2 className="text-xl font-bold text-[#1a1c1c]">
            {t('dashboard.welcome')}
            {userName ? ` ${firstName}` : ''}
          </h2>
          <p className="text-sm text-[#5b403d] mt-0.5">
            {t('dashboard.statusDesc')}
          </p>
        </div>

        {/* Main Status Card */}
        <section className={styles.statusCard}>
          <div className={styles.statusCardBody}>
            <div className={styles.statusIconWrapper}>
              <span
                className={`${styles.materialIcon} ${styles.materialIconFilled} ${styles.statusIcon}`}
              >
                verified_user
              </span>
            </div>
            <div>
              <h2 className={styles.statusHeadline}>{t('dashboard.statusOk')}</h2>
              <p className={styles.statusDescription}>
                {t('dashboard.statusDesc')}
              </p>
            </div>
          </div>
        </section>

        {/* Indicators Bento Grid */}
        <div className={styles.gridBento}>
          {/* Pressure Gauge Card */}
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
                <span className={styles.gaugeNumber}>5.2</span>
                <span className={styles.gaugeUnit}>kPa</span>
              </div>
            </div>
            <div className={styles.infoFooter}>
              <span className={`${styles.materialIcon}`} style={{ fontSize: '14px' }}>
                info
              </span>
              <span className={styles.infoText}>{t('dashboard.statusTitle')}</span>
            </div>
          </div>

          {/* Flame Status Card */}
          <div className={styles.metricCard}>
            <h3 className={styles.cardTitle}>{t('dashboard.flameTitle')}</h3>
            <div className={styles.flameVisualWrapper}>
              <div className={styles.flameVisualBorder}></div>
              <span className={`${styles.materialIcon} ${styles.flameIcon}`}>
                mode_fan
              </span>
            </div>
            <div className={styles.flameTextGroup}>
              <p className={styles.flameTitle}>{t('dashboard.flameTitle')}</p>
              <p className={styles.statusDescription}>
                {t('dashboard.flameInactive')}
              </p>
            </div>
            <div className={styles.flameBadge}>
              <span className={styles.idleDot}></span>
              <span className={styles.cardTitle}>IDLE</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <section className={styles.controlsSection}>
          <h3 className={styles.cardTitle}>{t('dashboard.statusTitle')}</h3>
          <div className={styles.controlsGrid}>
            <button
              className={styles.btnAlarm}
              onClick={handleTestAlarm}
              type="button"
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
            >
              <span className={`${styles.materialIcon} ${styles.btnValveIcon}`}>
                settings_input_component
              </span>
              <span className={styles.cardTitle}>
                {isValveOpen
                  ? t('dashboard.closeValve')
                  : t('dashboard.openValve')}
              </span>
            </button>
          </div>
        </section>

        {/* Emergency Override Banner */}
        <div className={styles.emergencyBanner}>
          <div className={styles.emergencyLeft}>
            <span className={`${styles.materialIcon} ${styles.emergencyIcon}`}>
              emergency_home
            </span>
            <div>
              <h4 className={styles.emergencyTitle}>{t('dashboard.emergency')}</h4>
              <p className={styles.emergencyText}>
                {t('dashboard.emergencyDesc')}
              </p>
            </div>
          </div>
          <button
            className={styles.emergencyBtn}
            onClick={handleEmergencyShutOff}
            type="button"
          >
            {t('dashboard.callNow')}
          </button>
        </div>
      </main>

      <BottomNav />

      {/* Desktop Navigation Sidebar */}
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
  );
}
