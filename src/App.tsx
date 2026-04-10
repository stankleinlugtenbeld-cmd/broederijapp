import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import FarmPage from './pages/FarmPage'
import Navbar from './components/Navbar'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>

  if (!user) return (
    <Routes>
      <Route path="*" element={<LoginPage />} />
    </Routes>
  )

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/farm/:farmId" element={<FarmPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
