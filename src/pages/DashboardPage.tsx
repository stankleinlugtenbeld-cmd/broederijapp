import { useEffect, useState } from 'react'
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import type { Farm } from '../types'
import AccessManager from '../components/AccessManager'

export default function DashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')
  const [managingFarm, setManagingFarm] = useState<Farm | null>(null)

  const isSupplier = profile?.role === 'supplier'

  useEffect(() => {
    if (!profile) { setLoading(false); return }
    const load = async () => {
      let q
      if (isSupplier) {
        q = query(collection(db, 'farms'))
      } else {
        if (!profile.farmIds.length) { setLoading(false); return }
        q = query(collection(db, 'farms'), where('__name__', 'in', profile.farmIds))
      }
      const snap = await getDocs(q)
      setFarms(snap.docs.map(d => ({ id: d.id, ...d.data() } as Farm)))
      setLoading(false)
    }
    load()
  }, [profile])

  const createFarm = async () => {
    if (!newName || !newCode) return
    const ref = await addDoc(collection(db, 'farms'), {
      name: newName,
      code: newCode,
      clientUids: [],
      invitedEmails: [],
      createdAt: Date.now()
    })
    setFarms(prev => [...prev, { id: ref.id, name: newName, code: newCode, clientUids: [], invitedEmails: [], createdAt: Date.now() }])
    setNewName(''); setNewCode(''); setShowAdd(false)
  }

  if (loading) return <div style={{ padding: 40 }}>Loading farms...</div>

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Farms</h2>
        {isSupplier && (
          <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>+ Add Farm</button>
        )}
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>New Farm</h3>
          <div className="form-group">
            <label>Farm Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. De Groot Farm" />
          </div>
          <div className="form-group">
            <label>Code</label>
            <input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="e.g. DG-001" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={createFarm}>Create</button>
            <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {farms.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#6b7280' }}>
          No farms yet. {isSupplier ? 'Add one above.' : 'Contact your supplier to get access.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {farms.map(farm => (
            <div
              key={farm.id}
              className="card"
              style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)')}
            >
              <div
                onClick={() => navigate(`/farm/${farm.id}`)}
              >
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{farm.code}</div>
                <div style={{ fontWeight: 600, fontSize: 17 }}>{farm.name}</div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#9ca3af' }}>
                  {(farm.invitedEmails ?? []).length} user{(farm.invitedEmails ?? []).length !== 1 ? 's' : ''} with access
                </div>
              </div>
              {isSupplier && (
                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <button
                    className="btn-primary"
                    style={{ flex: 1, fontSize: 12, padding: '6px 0' }}
                    onClick={e => { e.stopPropagation(); navigate(`/farm/${farm.id}`) }}
                  >
                    Open
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, fontSize: 12, padding: '6px 0' }}
                    onClick={e => { e.stopPropagation(); setManagingFarm(farm) }}
                  >
                    Manage access
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {managingFarm && (
        <AccessManager
          farm={managingFarm}
          onClose={() => setManagingFarm(null)}
          onFarmUpdated={updated => {
            setFarms(prev => prev.map(f => f.id === updated.id ? updated : f))
            setManagingFarm(updated)
          }}
        />
      )}
    </div>
  )
}
