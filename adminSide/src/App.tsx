import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Schedule from './pages/Schedule'
import Attendance from './pages/Attendance'
import Payroll from './pages/Payroll'
import LeaveRequests from './pages/LeaveRequests'
import Rewards from './pages/Rewards'
import Departments from './pages/Departments'
import Integrations from './pages/Integrations'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import HelpCenter from './pages/HelpCenter'
import Login from './pages/Login'
import Signup from './pages/Signup'

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/attendance" element={<Attendance />} />
                  <Route path="/payroll" element={<Payroll />} />
                  <Route path="/leave-requests" element={<LeaveRequests />} />
                  <Route path="/rewards" element={<Rewards />} />
                  <Route path="/departments" element={<Departments />} />
                  <Route path="/integrations" element={<Integrations />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/help" element={<HelpCenter />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </Router>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App
