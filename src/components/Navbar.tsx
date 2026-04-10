import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <nav style={{
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      padding: '0 24px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <span
        onClick={() => navigate('/')}
        style={{ fontWeight: 700, fontSize: 18, cursor: 'pointer', color: '#2563eb' }}
      >
        BroederijApp
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 14, color: '#6b7280' }}>
          {profile?.displayName} · <em>{profile?.role}</em>
        </span>
        <button className="btn-secondary" onClick={logout}>Sign out</button>
      </div>
    </nav>
  )
}
