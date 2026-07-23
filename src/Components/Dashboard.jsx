import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppHeader, { HeaderIconLink } from './AppHeader';
import styles from '../styles';

export default function Dashboard() {
  const navigate = useNavigate();
  const [gaugeOffset, setGaugeOffset] = useState(180);
  const [alarmText, setAlarmText] = useState('Test Alarm');
  const [isTestingAlarm, setIsTestingAlarm] = useState(false);
  const [isValveOpen, setIsValveOpen] = useState(false);

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
    setAlarmText('CHECKING...');

    setTimeout(() => {
      setAlarmText('Test Alarm');
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

  return (
    <div className={styles.pageBody}>
      <AppHeader>
        <div className={`${styles.onlineBadge} flex items-center gap-2`}>
          <div className={styles.pulseDot}></div>
          <span className={styles.onlineText}>ONLINE</span>
        </div>
        <HeaderIconLink to="/profile" icon="account_circle" label="Account" />
      </AppHeader>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
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
              <h2 className={styles.statusHeadline}>SYSTEM SAFE</h2>
              <p className={styles.statusDescription}>
                Continuous monitoring: All sensors within normal parameters.
              </p>
            </div>
          </div>
        </section>

        {/* Indicators Bento Grid */}
        <div className={styles.gridBento}>
          {/* Pressure Gauge Card */}
          <div className={styles.metricCard}>
            <h3 className={styles.cardTitle}>Current Pressure</h3>
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
              <span className={styles.infoText}>Optimal operating range</span>
            </div>
          </div>

          {/* Flame Status Card */}
          <div className={styles.metricCard}>
            <h3 className={styles.cardTitle}>Flame Detection</h3>
            <div className={styles.flameVisualWrapper}>
              <div className={styles.flameVisualBorder}></div>
              <span className={`${styles.materialIcon} ${styles.flameIcon}`}>
                mode_fan
              </span>
            </div>
            <div className={styles.flameTextGroup}>
              <p className={styles.flameTitle}>No Flame Detected</p>
              <p className={styles.statusDescription}>Burner is currently inactive</p>
            </div>
            <div className={styles.flameBadge}>
              <span className={styles.idleDot}></span>
              <span className={styles.cardTitle}>IDLE</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <section className={styles.controlsSection}>
          <h3 className={styles.cardTitle}>Quick Controls</h3>
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
                {isValveOpen ? 'Close Valve' : 'Open Valve'}
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
              <h4 className={styles.emergencyTitle}>Emergency Protocol</h4>
              <p className={styles.emergencyText}>
                In case of smell of gas, use the Emergency Shut Off below.
              </p>
            </div>
          </div>
          <button
            className={styles.emergencyBtn}
            onClick={handleEmergencyShutOff}
            type="button"
          >
            SHUT OFF
          </button>
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className={styles.bottomNav}>
        <Link className={styles.navItemActive} to="/dashboard">
          <span
            className={`${styles.materialIcon} ${styles.materialIconFilled}`}
          >
            dashboard
          </span>
          <span className={styles.cardTitle}>Home</span>
        </Link>
        <Link className={styles.navItem} to="/logs">
          <span className={styles.materialIcon}>history</span>
          <span className={styles.cardTitle}>Logs</span>
        </Link>
        <Link className={styles.navItem} to="/settings">
          <span className={styles.materialIcon}>settings</span>
          <span className={styles.cardTitle}>Settings</span>
        </Link>
      </nav>

      {/* Desktop Navigation Sidebar */}
      <aside className={styles.desktopSidebar}>
        <Link
          to="/dashboard"
          className={`${styles.materialIcon} ${styles.materialIconFilled} ${styles.sidebarIconActive}`}
          aria-label="Home"
        >
          dashboard
        </Link>
        <Link
          to="/logs"
          className={`${styles.materialIcon} ${styles.sidebarIcon}`}
          aria-label="Logs"
        >
          history
        </Link>
        <Link
          to="/settings"
          className={`${styles.materialIcon} ${styles.sidebarIcon}`}
          aria-label="Settings"
        >
          settings
        </Link>
      </aside>
    </div>
  );
}