import { Link, useLocation } from 'react-router-dom'
import { usePreferences } from '../lib/PreferencesContext'

/**
 * Mobile bottom nav — highlights Home / Logs / Settings by current route.
 * Profile is not a tab, so nothing is highlighted there.
 */
export default function BottomNav({ className = '' }) {
  const location = useLocation()
  const { t } = usePreferences()
  const path = location.pathname

  const itemClass = (active) =>
    active
      ? 'flex flex-col items-center justify-center bg-[#d32f2f] text-[#fff2f0] rounded-full px-4 py-1 scale-90 transition-transform duration-200'
      : 'flex flex-col items-center justify-center text-[#5b403d] px-4 py-1 hover:bg-[#e2e2e2] transition-opacity'

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-[#eeeeee] shadow-lg rounded-t-xl ${className}`}
    >
      <Link to="/dashboard" className={itemClass(path === '/dashboard')}>
        <span
          className={`material-symbols-outlined${path === '/dashboard' ? ' filled' : ''}`}
        >
          dashboard
        </span>
        <span className="text-xs font-bold tracking-wider">{t('nav.home')}</span>
      </Link>
      <Link to="/logs" className={itemClass(path === '/logs')}>
        <span
          className={`material-symbols-outlined${path === '/logs' ? ' filled' : ''}`}
        >
          history
        </span>
        <span className="text-xs font-bold tracking-wider">{t('nav.logs')}</span>
      </Link>
      <Link to="/settings" className={itemClass(path === '/settings')}>
        <span
          className={`material-symbols-outlined${path === '/settings' ? ' filled' : ''}`}
        >
          settings
        </span>
        <span className="text-xs font-bold tracking-wider">
          {t('nav.settings')}
        </span>
      </Link>
    </nav>
  )
}
