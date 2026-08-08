import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader, { HeaderIconLink } from './AppHeader'
import BottomNav from './BottomNav'
import { usePreferences } from '../lib/PreferencesContext'
import { getActivityLogs } from '../lib/devices'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../lib/profile'
import styles from '../styles'

export default function Logs() {
  const navigate = useNavigate()
  const { t } = usePreferences()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let channel

    async function load() {
      const { user, error: userError } = await getCurrentUser()
      if (userError || !user) {
        navigate('/', { replace: true })
        return
      }

      const { data, error } = await getActivityLogs(80)
      if (cancelled) return
      if (error) {
        setLogs([])
      } else {
        setLogs(data)
      }
      setLoading(false)

      channel = supabase
        .channel(`logs-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activity_logs',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setLogs((prev) => [payload.new, ...prev].slice(0, 80))
          }
        )
        .subscribe()
    }

    load()
    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [navigate])

  const getCardBorderStyle = (type) => {
    switch (type) {
      case 'safe':
        return styles.borderGreen
      case 'info':
        return styles.borderBlue
      case 'neutral':
        return styles.borderGray
      case 'warning':
      case 'critical':
        return styles.borderRed
      default:
        return styles.borderGray
    }
  }

  const getPillStyle = (type) => {
    switch (type) {
      case 'safe':
        return styles.statusPillGreen
      case 'info':
        return styles.statusPillBlue
      case 'neutral':
        return styles.statusPillGray
      case 'warning':
      case 'critical':
        return styles.statusPillRed
      default:
        return styles.statusPillGray
    }
  }

  const formatTime = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleString()
  }

  return (
    <div className={styles.pageBody}>
      <AppHeader>
        <HeaderIconLink
          to="/profile"
          icon="account_circle"
          label="Account Settings"
        />
      </AppHeader>

      <main className={styles.mainContent}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.headline}>{t('logs.title')}</h2>
          <p className={styles.subheadline}>{t('logs.subtitle')}</p>
        </div>

        <div className={styles.feedList}>
          {loading ? (
            <p className={styles.subheadline}>{t('common.loading')}</p>
          ) : logs.length === 0 ? (
            <p className={styles.subheadline}>{t('logs.empty')}</p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`${styles.logCard} ${getCardBorderStyle(log.log_type)}`}
              >
                <div className={getPillStyle(log.log_type)}>
                  <span
                    className={`${styles.materialIcon} ${styles.materialIconFilled}`}
                    style={{ fontSize: '28px', opacity: 1 }}
                  >
                    {log.icon || 'info'}
                  </span>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardHeader}>
                    <span
                      className={`${styles.cardTitle} ${
                        log.log_type === 'warning' || log.log_type === 'critical'
                          ? styles.titleRed
                          : ''
                      }`}
                    >
                      {log.title}
                    </span>
                    <span className={styles.cardTime}>
                      {formatTime(log.created_at)}
                    </span>
                  </div>
                  <p className={styles.cardDescription}>
                    {log.description || ''}
                    {log.pressure_kpa != null
                      ? ` · ${Number(log.pressure_kpa).toFixed(1)} kPa`
                      : ''}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
