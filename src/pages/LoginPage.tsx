import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { signInWithGoogle } = useAuth()

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)'
    }}>
      <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🐔</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>BroederijApp</h1>
        <p style={{ color: '#6b7280', marginBottom: 32, fontSize: 15 }}>
          Farm equipment management — see which products are installed in every room of your farm.
        </p>
        <button className="btn-primary" style={{ width: '100%', padding: '12px 0', fontSize: 15 }} onClick={signInWithGoogle}>
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
