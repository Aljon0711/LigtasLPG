import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyDarkClass, readStoredPrefs } from './lib/i18n'

// Apply saved theme before first paint to avoid flash
applyDarkClass(readStoredPrefs().darkMode)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
