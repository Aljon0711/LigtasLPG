import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Signin from './Auth/Signin'
import Signup from './Auth/Signup'
import Profile from './Components/Profile'
import Dashboard from './Components/Dashboard'
import Settings from './Components/Settings'
import Logs from './Components/Logs'
import Alert from './Components/Alert'
import './styles'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/alert" element={<Alert />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
