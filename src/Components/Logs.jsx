import React, { useState } from 'react';
import AppHeader, { HeaderIconLink } from './AppHeader';
import BottomNav from './BottomNav';
import { usePreferences } from '../lib/PreferencesContext';
import styles from '../styles';

export default function Logs() {
  const { t } = usePreferences();

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
          <h2 className={styles.headline}>{t('logs.title')}</h2>
          <p className={styles.subheadline}>{t('logs.subtitle')}</p>
        </div>

        {/* Dynamic Activity Feed */}
        <div className={styles.feedList}>
          {logs.length === 0 ? (
            <p className={styles.subheadline}>{t('logs.empty')}</p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`${styles.logCard} ${getCardBorderStyle(log.type)}`}
                onClick={() => handleCardClick(log.title)}
              >
                <div className={getPillStyle(log.type)}>
                  <span
                    className={`${styles.materialIcon} ${styles.materialIconFilled}`}
                    style={{ fontSize: '28px', opacity: 1 }}
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
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
