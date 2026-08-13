import { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Signin from './Auth/Signin'
import Signup from './Auth/Signup'
import AuthCallback from './Auth/AuthCallback'
import SetPassword from './Auth/SetPassword'
import SessionGuard from './Auth/SessionGuard'
import Terms from './Auth/Terms'
import Profile from './Components/Profile'
import Dashboard from './Components/Dashboard'
import Settings from './Components/Settings'
import Logs from './Components/Logs'
import Alert from './Components/Alert'
import SplashScreen from './Components/SplashScreen'
import EmergencyMonitor from './Components/EmergencyMonitor'
import PushBootstrap from './Components/PushBootstrap'
import { PreferencesProvider } from './lib/PreferencesContext'
import './styles'

function AppRoutes() {
  const [splashDone, setSplashDone] = useState(
    () => window.location.pathname === '/auth/callback'
  )
  const handleSplashDone = useCallback(() => setSplashDone(true), [])

  return (
    <>
      <SplashScreen onDone={handleSplashDone} />
      <div
        aria-hidden={!splashDone}
        style={
          splashDone
            ? undefined
            : { visibility: 'hidden', pointerEvents: 'none' }
        }
      >
        <SessionGuard />
        <PushBootstrap />
        <EmergencyMonitor />
        <Routes>
          <Route path="/" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/alert" element={<Alert />} />
        </Routes>
      </div>
    </>
  )
}

function App() {
  return (
    <PreferencesProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </PreferencesProvider>
  )
}

export default App
