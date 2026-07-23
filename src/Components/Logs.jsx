import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader, { HeaderIconLink } from './AppHeader';
import styles from '../styles';

export default function Logs() {
  // Activity logs dynamic state data
  const [logs] = useState([
    {
      id: 1,
      title: 'System Safe',
      time: '10:30 AM',
      description: 'Sensors calibrated. No gas leak detected. Ambient air quality within safety parameters.',
      type: 'safe',
      icon: 'check_circle',
      filled: true,
    },
    {
      id: 2,
      title: 'Normal Cooking Detected',
      time: '08:15 AM',
      description: 'Controlled gas usage detected. Thermal signature consistent with stove activation.',
      type: 'info',
      icon: 'cooking',
      filled: false,
    },
    {
      id: 3,
      title: 'Valve Manually Opened',
      time: 'Yesterday',
      description: 'The master valve was engaged via physical override on the tank regulator.',
      type: 'neutral',
      icon: 'settings_input_component',
      filled: false,
    },
    {
      id: 4,
      title: 'Leak Detected - Auto Shutoff',
      time: '2 Days ago',
      description: 'High concentration of LPG detected (2500ppm). Smart valve closed automatically to prevent ignition.',
      type: 'warning',
      icon: 'warning',
      filled: true,
      hasReport: true,
    },
  ]);

  const handleCardClick = (title) => {
    console.log(`Log details requested for: ${title}`);
  };

  const handleIncidentReport = (e) => {
    e.stopPropagation(); // Prevents bubbling to parent card click
    alert('Opening incident report details...');
  };

  // Helper functions to dynamically map styles based on log type
  const getCardBorderStyle = (type) => {
    switch (type) {
      case 'safe': return styles.borderGreen;
      case 'info': return styles.borderBlue;
      case 'neutral': return styles.borderGray;
      case 'warning': return styles.borderRed;
      default: return styles.borderGray;
    }
  };

  const getPillStyle = (type) => {
    switch (type) {
      case 'safe': return styles.statusPillGreen;
      case 'info': return styles.statusPillBlue;
      case 'neutral': return styles.statusPillGray;
      case 'warning': return styles.statusPillRed;
      default: return styles.statusPillGray;
    }
  };

  return (
    <div className={styles.pageBody}>
      <AppHeader>
        <HeaderIconLink
          to="/profile"
          icon="account_circle"
          label="Account Settings"
        />
      </AppHeader>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Section Header */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.headline}>Safety Activity</h2>
          <p className={styles.subheadline}>
            Real-time surveillance and incident history.
          </p>
        </div>

        {/* Dynamic Activity Feed */}
        <div className={styles.feedList}>
          {logs.map((log) => (
            <div
              key={log.id}
              className={`${styles.logCard} ${getCardBorderStyle(log.type)}`}
              onClick={() => handleCardClick(log.title)}
            >
              <div className={getPillStyle(log.type)}>
                <span
                  className={`${styles.materialIcon} ${log.filled ? styles.materialIconFilled : ''}`}
                >
                  {log.icon}
                </span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardHeader}>
                  <span
                    className={`${styles.cardTitle} ${log.type === 'warning' ? styles.titleRed : ''}`}
                  >
                    {log.title}
                  </span>
                  <span
                    className={`${styles.cardTime} ${log.type === 'warning' ? styles.timeRed : ''}`}
                  >
                    {log.time}
                  </span>
                </div>
                <p className={styles.cardDescription}>{log.description}</p>

                {log.hasReport && (
                  <button
                    className={styles.reportBtn}
                    onClick={handleIncidentReport}
                    type="button"
                  >
                    VIEW INCIDENT REPORT
                    <span
                      className={styles.materialIcon}
                      style={{ fontSize: '16px' }}
                    >
                      chevron_right
                    </span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Atmospheric Visualization Banner */}
        <div className={styles.visualBanner}>
          <div className={styles.bannerOverlay}></div>
          <div className={styles.bannerContent}>
            <span className={styles.bannerBadge}>SYSTEM VIGILANT</span>
            <p className={styles.bannerText}>Continuous Monitoring Active</p>
          </div>
          <img
            alt="Clean, modern kitchen with smart safety monitoring"
            className={styles.bannerImage}
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrX10tiVRPNSVAaJxKGOeN3Nxrm6gEOVeWrJMHsqUpw6xlYZgXq_yq5w3Amlc7_lN-xXJ0YmnJpSp0N5WLCbTxowbjRTOXxtWx3eBsiOS9wsyMJCntA6blVpvwpBW2WY5u2D27v-3xjd9wjZyRd2Pf-O6zI8vrcBFRgGbKpW1P96V0lP9XWgEfaje0cQlgiDwO8LyXM0A5bCmm84AmZjDr_3LDTZFwWF9lwTGxyHkEZEKTRbT2jh6MsjFMHE2yI0J7E-tRgDIDV1E"
          />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className={styles.bottomNav}>
        <Link className={styles.navItem} to="/dashboard">
          <span className={styles.materialIcon}>dashboard</span>
          <span className={styles.navLabel}>Home</span>
        </Link>
        <Link className={styles.navItemActive} to="/logs">
          <span
            className={`${styles.materialIcon} ${styles.materialIconFilled}`}
          >
            history
          </span>
          <span className={styles.navLabel}>Logs</span>
        </Link>
        <Link className={styles.navItem} to="/settings">
          <span className={styles.materialIcon}>settings</span>
          <span className={styles.navLabel}>Settings</span>
        </Link>
      </nav>
    </div>
  );
}