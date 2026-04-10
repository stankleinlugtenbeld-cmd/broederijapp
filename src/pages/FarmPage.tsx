import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import type { Farm, Room, Product, Note, RoomForm } from '../types'
import FloorPlanCanvas from '../components/FloorPlanCanvas'
import RoomPanel from '../components/RoomPanel'

export default function FarmPage() {
  const { farmId } = useParams<{ farmId: string }>()
  const { profile } = useAuth()
  const [farm, setFarm] = useState<Farm | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [forms, setForms] = useState<RoomForm[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    if (!farmId) return
    const load = async () => {
      const farmSnap = await getDoc(doc(db, 'farms', farmId))
      if (farmSnap.exists()) setFarm({ id: farmSnap.id, ...farmSnap.data() } as Farm)

      const [roomsSnap, productsSnap, notesSnap, formsSnap] = await Promise.all([
        getDocs(collection(db, 'farms', farmId, 'rooms')),
        getDocs(collection(db, 'farms', farmId, 'products')),
        getDocs(collection(db, 'farms', farmId, 'notes')),
        getDocs(collection(db, 'farms', farmId, 'forms')),
      ])
      setRooms(roomsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Room)))
      setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)))
      setNotes(notesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Note)))
      setForms(formsSnap.docs.map(d => ({ id: d.id, ...d.data() } as RoomForm)))
    }
    load()
  }, [farmId])

  const saveRoom = async (room: Omit<Room, 'id'> & { id?: string }) => {
    if (!farmId) return
    if (room.id) {
      await updateDoc(doc(db, 'farms', farmId, 'rooms', room.id), { ...room })
      setRooms(prev => prev.map(r => r.id === room.id ? room as Room : r))
    } else {
      const ref = await addDoc(collection(db, 'farms', farmId, 'rooms'), room)
      setRooms(prev => [...prev, { ...room, id: ref.id } as Room])
    }
  }

  const deleteRoom = async (roomId: string) => {
    if (!farmId) return
    await deleteDoc(doc(db, 'farms', farmId, 'rooms', roomId))
    setRooms(prev => prev.filter(r => r.id !== roomId))
    if (selectedRoom?.id === roomId) setSelectedRoom(null)
  }

  const addProduct = async (product: Omit<Product, 'id'>) => {
    if (!farmId) return
    const ref = await addDoc(collection(db, 'farms', farmId, 'products'), product)
    setProducts(prev => [...prev, { ...product, id: ref.id }])
  }

  const deleteProduct = async (productId: string) => {
    if (!farmId) return
    await deleteDoc(doc(db, 'farms', farmId, 'products', productId))
    setProducts(prev => prev.filter(p => p.id !== productId))
  }

  const addNote = async (note: Omit<Note, 'id'>) => {
    if (!farmId) return
    const ref = await addDoc(collection(db, 'farms', farmId, 'notes'), note)
    setNotes(prev => [...prev, { ...note, id: ref.id }])
  }

  const deleteNote = async (noteId: string) => {
    if (!farmId) return
    await deleteDoc(doc(db, 'farms', farmId, 'notes', noteId))
    setNotes(prev => prev.filter(n => n.id !== noteId))
  }

  const addForm = async (form: Omit<RoomForm, 'id'>) => {
    if (!farmId) return
    const ref = await addDoc(collection(db, 'farms', farmId, 'forms'), form)
    setForms(prev => [...prev, { ...form, id: ref.id }])
  }

  const deleteForm = async (formId: string) => {
    if (!farmId) return
    await deleteDoc(doc(db, 'farms', farmId, 'forms', formId))
    setForms(prev => prev.filter(f => f.id !== formId))
  }

  const isSupplier = profile?.role === 'supplier'

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          padding: '12px 20px',
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div>
            <span style={{ fontWeight: 600 }}>{farm?.name}</span>
            <span style={{ color: '#9ca3af', marginLeft: 8 }}>{farm?.code}</span>
          </div>
          {isSupplier && (
            <button
              className={editMode ? 'btn-danger' : 'btn-primary'}
              style={{ marginLeft: 'auto' }}
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? 'Done editing' : 'Edit floor plan'}
            </button>
          )}
        </div>
        <FloorPlanCanvas
          rooms={rooms}
          editMode={editMode}
          selectedRoomId={selectedRoom?.id ?? null}
          onSelectRoom={id => setSelectedRoom(rooms.find(r => r.id === id) ?? null)}
          onSaveRoom={saveRoom}
          onDeleteRoom={deleteRoom}
          farmId={farmId!}
        />
      </div>

      {selectedRoom && (
        <RoomPanel
          room={selectedRoom}
          products={products.filter(p => p.roomId === selectedRoom.id)}
          notes={notes.filter(n => n.roomId === selectedRoom.id)}
          forms={forms.filter(f => f.roomId === selectedRoom.id)}
          onAddProduct={addProduct}
          onDeleteProduct={deleteProduct}
          onAddNote={addNote}
          onDeleteNote={deleteNote}
          onAddForm={addForm}
          onDeleteForm={deleteForm}
          onClose={() => setSelectedRoom(null)}
          farmId={farmId!}
        />
      )}
    </div>
  )
}
