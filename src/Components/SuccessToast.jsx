import { useEffect } from 'react'

/**
 * Small success toast fixed at the top of the screen.
 */
export default function SuccessToast({ message, visible, onHide, duration = 1800 }) {
  useEffect(() => {
    if (!visible) return undefined

    const timer = setTimeout(() => {
      onHide?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [visible, duration, onHide])

  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 inset-x-0 z-[100] flex justify-center px-4 pointer-events-none"
    >
      <div className="toast-slide-in pointer-events-auto flex w-full max-w-[360px] items-center gap-3 rounded-xl bg-[#11651d] px-4 py-3 text-white shadow-lg shadow-black/15">
        <span
          className="material-symbols-outlined !text-[22px] shrink-0"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          check_circle
        </span>
        <p className="text-sm font-semibold leading-snug">{message}</p>
      </div>

      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .toast-slide-in {
          animation: toastSlideIn 0.28s ease-out;
        }
      `}</style>
    </div>
  )
}
