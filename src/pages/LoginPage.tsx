import { useAuth } from '../contexts/AuthContext'

// Detect WhatsApp, Instagram, Facebook and other in-app browsers
// that block Google OAuth
function isInAppBrowser() {
  const ua = navigator.userAgent
  if (/FBAN|FBAV|Instagram|WhatsApp/i.test(ua)) return true
  // iOS in-app browsers (WKWebView) don't include "Safari" in the UA
  if (/iPhone|iPad|iPod/i.test(ua) && !/Safari/i.test(ua) && !/CriOS/i.test(ua)) return true
  return false
}

export default function LoginPage() {
  const { signInWithGoogle } = useAuth()
  const inApp = isInAppBrowser()

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

        {inApp ? (
          <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 10, padding: '16px 20px', textAlign: 'left' }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>⚠️ Open in Safari or Chrome</div>
            <p style={{ fontSize: 14, color: '#92400e', marginBottom: 12 }}>
              Google sign-in doesn't work inside WhatsApp or other apps. Please open this page in Safari or Chrome.
            </p>
            <p style={{ fontSize: 13, color: '#78350f' }}>
              Tap the <strong>···</strong> or <strong>⋮</strong> menu → <strong>"Open in Safari"</strong>
            </p>
          </div>
        ) : (
          <button
            className="btn-primary"
            style={{ width: '100%', padding: '12px 0', fontSize: 15 }}
            onClick={signInWithGoogle}
          >
            Sign in with Google
          </button>
        )}
      </div>
    </div>
  )
}
