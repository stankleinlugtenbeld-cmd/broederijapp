import { useRef, useState } from 'react'
import type { Room, Product, Note, RoomForm } from '../types'
import { uploadImage } from '../utils/uploadImage'

type Tab = 'products' | 'forms' | 'notes'

interface Props {
  room: Room
  products: Product[]
  notes: Note[]
  forms: RoomForm[]
  onAddProduct: (p: Omit<Product, 'id'>) => void
  onDeleteProduct: (id: string) => void
  onAddNote: (n: Omit<Note, 'id'>) => void
  onDeleteNote: (id: string) => void
  onAddForm: (f: Omit<RoomForm, 'id'>) => void
  onDeleteForm: (id: string) => void
  onClose: () => void
  farmId: string
}

const emptyProduct = { name: '', type: '', quantity: 1, unit: 'pcs', installDate: '', notes: '' }

export default function RoomPanel({ room, products, notes, forms, onAddProduct, onDeleteProduct, onAddNote, onDeleteNote, onAddForm, onDeleteForm, onClose, farmId }: Props) {
  const [tab, setTab] = useState<Tab>('products')

  return (
    <div style={{ width: 360, background: 'white', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{room.name}</div>
          {room.code && <div style={{ fontSize: 13, color: '#9ca3af' }}>{room.code}</div>}
        </div>
        <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 13 }} onClick={onClose}>✕</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
        {(['products', 'forms', 'notes'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '10px 0', fontSize: 13, fontWeight: tab === t ? 600 : 400,
              background: 'none', borderRadius: 0,
              color: tab === t ? '#2563eb' : '#6b7280',
              borderBottom: tab === t ? '2px solid #2563eb' : '2px solid transparent',
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            <span style={{ marginLeft: 6, fontSize: 12, color: '#9ca3af' }}>
              ({t === 'products' ? products.length : t === 'forms' ? forms.length : notes.length})
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'products' && (
          <ProductsTab products={products} onAdd={onAddProduct} onDelete={onDeleteProduct} farmId={farmId} roomId={room.id} />
        )}
        {tab === 'forms' && (
          <FormsTab forms={forms} onAdd={onAddForm} onDelete={onDeleteForm} farmId={farmId} roomId={room.id} />
        )}
        {tab === 'notes' && (
          <NotesTab notes={notes} onAdd={onAddNote} onDelete={onDeleteNote} farmId={farmId} roomId={room.id} />
        )}
      </div>
    </div>
  )
}

// ── Products Tab ──────────────────────────────────────────────────────────────

function ProductsTab({ products, onAdd, onDelete, farmId, roomId }: {
  products: Product[]
  onAdd: (p: Omit<Product, 'id'>) => void
  onDelete: (id: string) => void
  farmId: string
  roomId: string
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ ...emptyProduct })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const submit = async () => {
    if (!form.name) return
    setUploading(true)
    let imageUrl: string | undefined
    if (imageFile) {
      imageUrl = await uploadImage(imageFile, `farms/${farmId}/rooms/${roomId}/products/${Date.now()}-${imageFile.name}`)
    }
    onAdd({ ...form, farmId, roomId, addedAt: Date.now(), ...(imageUrl ? { imageUrl } : {}) })
    setForm({ ...emptyProduct }); setImageFile(null); setShowAdd(false); setUploading(false)
  }

  return (
    <div style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="btn-primary" style={{ padding: '5px 12px', fontSize: 13 }} onClick={() => setShowAdd(!showAdd)}>+ Add</button>
      </div>

      {showAdd && (
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, marginBottom: 16 }}>
          <div className="form-group">
            <label>Product Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Ventilator Type A" />
          </div>
          <div className="form-group">
            <label>Type / Category</label>
            <input value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} placeholder="e.g. Ventilation" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="form-group">
              <label>Quantity</label>
              <input type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: +e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="pcs" />
            </div>
          </div>
          <div className="form-group">
            <label>Install Date</label>
            <input type="date" value={form.installDate} onChange={e => setForm(f => ({ ...f, installDate: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." style={{ resize: 'none' }} />
          </div>
          <div className="form-group">
            <label>Photo (optional)</label>
            <input ref={fileRef} type="file" accept="image/*" style={{ padding: '4px 0', border: 'none' }}
              onChange={e => setImageFile(e.target.files?.[0] ?? null)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={submit} disabled={uploading}>{uploading ? 'Uploading...' : 'Save'}</button>
            <button className="btn-secondary" onClick={() => { setShowAdd(false); setImageFile(null) }}>Cancel</button>
          </div>
        </div>
      )}

      {products.length === 0 && !showAdd
        ? <Empty text="No products yet" />
        : products.map(p => (
          <div key={p.id} style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', marginBottom: 10, position: 'relative' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, paddingRight: 28 }}>{p.name}</div>
            {p.type && <div style={{ fontSize: 12, color: '#6b7280' }}>{p.type}</div>}
            <div style={{ fontSize: 13, marginTop: 6, display: 'flex', gap: 12 }}>
              <span><strong>{p.quantity}</strong> {p.unit}</span>
              {p.installDate && <span style={{ color: '#6b7280' }}>{p.installDate}</span>}
            </div>
            {p.notes && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{p.notes}</div>}
            {p.imageUrl && (
              <img src={p.imageUrl} alt={p.name}
                style={{ marginTop: 8, width: '100%', borderRadius: 6, maxHeight: 160, objectFit: 'cover', cursor: 'pointer' }}
                onClick={() => window.open(p.imageUrl, '_blank')} />
            )}
            <DeleteBtn onClick={() => onDelete(p.id)} />
          </div>
        ))
      }
    </div>
  )
}

// ── Forms Tab ─────────────────────────────────────────────────────────────────

function FormsTab({ forms, onAdd, onDelete, farmId, roomId }: {
  forms: RoomForm[]
  onAdd: (f: Omit<RoomForm, 'id'>) => void
  onDelete: (id: string) => void
  farmId: string
  roomId: string
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')

  const submit = () => {
    if (!name || !url) return
    onAdd({ name, url, farmId, roomId, addedAt: Date.now() })
    setName(''); setUrl(''); setShowAdd(false)
  }

  return (
    <div style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="btn-primary" style={{ padding: '5px 12px', fontSize: 13 }} onClick={() => setShowAdd(!showAdd)}>+ Add</button>
      </div>

      {showAdd && (
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, marginBottom: 16 }}>
          <div className="form-group">
            <label>Form Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Inspection Form" />
          </div>
          <div className="form-group">
            <label>Google Form URL *</label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://forms.gle/..." />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={submit}>Save</button>
            <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {forms.length === 0 && !showAdd
        ? <Empty text="No forms linked yet" />
        : forms.map(f => (
          <div key={f.id} style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', marginBottom: 10, position: 'relative' }}>
            <div style={{ fontWeight: 600, fontSize: 14, paddingRight: 28 }}>{f.name}</div>
            <a href={f.url} target="_blank" rel="noreferrer"
              style={{ fontSize: 13, color: '#2563eb', display: 'inline-block', marginTop: 6, wordBreak: 'break-all' }}>
              Open form →
            </a>
            <DeleteBtn onClick={() => onDelete(f.id)} />
          </div>
        ))
      }
    </div>
  )
}

// ── Notes Tab ─────────────────────────────────────────────────────────────────

function NotesTab({ notes, onAdd, onDelete, farmId, roomId }: {
  notes: Note[]
  onAdd: (n: Omit<Note, 'id'>) => void
  onDelete: (id: string) => void
  farmId: string
  roomId: string
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [text, setText] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const submit = async () => {
    if (!text) return
    setUploading(true)
    let imageUrl: string | undefined
    if (imageFile) {
      imageUrl = await uploadImage(imageFile, `farms/${farmId}/rooms/${roomId}/notes/${Date.now()}-${imageFile.name}`)
    }
    onAdd({ text, farmId, roomId, addedAt: Date.now(), ...(imageUrl ? { imageUrl } : {}) })
    setText(''); setImageFile(null); setShowAdd(false); setUploading(false)
  }

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="btn-primary" style={{ padding: '5px 12px', fontSize: 13 }} onClick={() => setShowAdd(!showAdd)}>+ Add</button>
      </div>

      {showAdd && (
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, marginBottom: 16 }}>
          <div className="form-group">
            <label>Note *</label>
            <textarea rows={3} value={text} onChange={e => setText(e.target.value)}
              placeholder="Write a note..." style={{ resize: 'vertical' }} autoFocus />
          </div>
          <div className="form-group">
            <label>Photo (optional)</label>
            <input ref={fileRef} type="file" accept="image/*" style={{ padding: '4px 0', border: 'none' }}
              onChange={e => setImageFile(e.target.files?.[0] ?? null)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={submit} disabled={uploading}>{uploading ? 'Uploading...' : 'Save'}</button>
            <button className="btn-secondary" onClick={() => { setShowAdd(false); setImageFile(null) }}>Cancel</button>
          </div>
        </div>
      )}

      {notes.length === 0 && !showAdd
        ? <Empty text="No notes yet" />
        : [...notes].sort((a, b) => b.addedAt - a.addedAt).map(n => (
          <div key={n.id} style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', marginBottom: 10, position: 'relative' }}>
            <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', paddingRight: 28 }}>{n.text}</div>
            {n.imageUrl && (
              <img src={n.imageUrl} alt="note"
                style={{ marginTop: 8, width: '100%', borderRadius: 6, maxHeight: 200, objectFit: 'cover', cursor: 'pointer' }}
                onClick={() => window.open(n.imageUrl, '_blank')} />
            )}
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>{formatDate(n.addedAt)}</div>
            <DeleteBtn onClick={() => onDelete(n.id)} />
          </div>
        ))
      }
    </div>
  )
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button className="btn-danger" onClick={onClick}
      style={{ position: 'absolute', top: 10, right: 10, padding: '2px 8px', fontSize: 12 }}>
      ✕
    </button>
  )
}

function Empty({ text }: { text: string }) {
  return <div style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', marginTop: 32 }}>{text}</div>
}
