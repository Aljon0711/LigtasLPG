import { Link, useNavigate } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import { usePreferences } from '../lib/PreferencesContext'

/**
 * Shared top app bar — matches Settings header sizing.
 * Logo icon: 24px · Title: text-xl (20px) · Height: h-16 (64px)
 */
export default function AppHeader({
  children,
  showBack = false,
  backTo = '/dashboard',
  variant = 'default',
}) {
  const navigate = useNavigate()
  const { t } = usePreferences()
  const isAlert = variant === 'alert'
  const iconColor = isAlert ? 'text-white' : 'text-[#af101a]'
  const titleColor = isAlert ? 'text-white' : 'text-[#af101a]'

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16 box-border app-header ${
        isAlert
          ? 'bg-transparent'
          : 'bg-[#f9f9f9]/95 backdrop-blur-sm shadow-sm'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {showBack ? (
          <button
            type="button"
            onClick={() => navigate(backTo)}
            aria-label={t('nav.back')}
            className="hover:opacity-80 transition-opacity active:scale-95 duration-100 flex items-center p-1 shrink-0"
          >
            <span className={`material-symbols-outlined ${iconColor} !text-[24px]`}>
              arrow_back
            </span>
          </button>
        ) : (
          <BrandLogo size={24} onDark={isAlert} />
        )}
        <h1 className={`text-xl font-bold ${titleColor} truncate leading-7`}>
          LigtasLPG
        </h1>
      </div>

      <div className="flex items-center gap-3 shrink-0">{children}</div>
    </header>
  )
}

export function HeaderIconLink({ to, icon, label, className = '' }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className={`hover:opacity-80 transition-opacity active:scale-95 duration-100 flex items-center p-1 ${className}`}
    >
      <span className="material-symbols-outlined text-[#af101a] !text-[24px]">
        {icon}
      </span>
    </Link>
  )
}

export function HeaderIconButton({ icon, label, onClick, className = '' }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`hover:opacity-80 transition-opacity active:scale-95 duration-100 flex items-center p-1 ${className}`}
    >
      <span className="material-symbols-outlined text-[#5b403d] !text-[24px]">
        {icon}
      </span>
    </button>
  )
}
