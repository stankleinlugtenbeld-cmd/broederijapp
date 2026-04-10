import { useState } from 'react'
import { doc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import type { Farm } from '../types'

interface Props {
  farm: Farm
  onClose: () => void
  onFarmUpdated: (farm: Farm) => void
}

export default function AccessManager({ farm, onClose, onFarmUpdated }: Props) {
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const invitedEmails = farm.invitedEmails ?? []

  const addEmail = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return
    if (!trimmed.includes('@')) { setError('Enter a valid email address.'); return }
    if (invitedEmails.includes(trimmed)) { setError('This email already has access.'); return }
    setSaving(true); setError('')
    await updateDoc(doc(db, 'farms', farm.id), { invitedEmails: arrayUnion(trimmed) })
    const updated = { ...farm, invitedEmails: [...invitedEmails, trimmed] }
    onFarmUpdated(updated)
    setEmail(''); setSaving(false)
  }

  const removeEmail = async (emailToRemove: string) => {
    setSaving(true)
    // Remove from farm's invitedEmails
    await updateDoc(doc(db, 'farms', farm.id), { invitedEmails: arrayRemove(emailToRemove) })
    // Also remove this farm from the user's farmIds if they've signed in
    const userSnap = await getDocs(query(collection(db, 'users'), where('email', '==', emailToRemove)))
    for (const userDoc of userSnap.docs) {
      const farmIds: string[] = userDoc.data().farmIds ?? []
      if (farmIds.includes(farm.id)) {
        await updateDoc(doc(db, 'users', userDoc.id), {
          farmIds: farmIds.filter(id => id !== farm.id)
        })
      }
    }
    const updated = { ...farm, invitedEmails: invitedEmails.filter(e => e !== emailToRemove) }
    onFarmUpdated(updated)
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card" style={{ width: 460, maxWidth: '95vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700 }}>Manage access</h3>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{farm.name} · {farm.code}</div>
          </div>
          <button className="btn-secondary" style={{ padding: '4px 10px' }} onClick={onClose}>✕</button>
        </div>

        {/* Add email */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            placeholder="customer@gmail.com"
            onKeyDown={e => e.key === 'Enter' && addEmail()}
            style={{ flex: 1 }}
          />
          <button className="btn-primary" onClick={addEmail} disabled={saving} style={{ whiteSpace: 'nowrap' }}>
            Give access
          </button>
        </div>
        {error && <div style={{ fontSize: 13, color: '#ef4444', marginBottom: 8 }}>{error}</div>}

        <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
          The customer can sign in with this Gmail address and will automatically see this farm.
        </p>

        {/* Email list */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {invitedEmails.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14, padding: '24px 0' }}>
              No one has access yet
            </div>
          ) : (
            invitedEmails.map(e => (
              <div key={e} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>{e}</span>
                <button className="btn-danger" style={{ padding: '3px 10px', fontSize: 12 }} onClick={() => removeEmail(e)} disabled={saving}>
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
