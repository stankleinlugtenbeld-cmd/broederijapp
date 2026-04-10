import { useRef, useState, useEffect } from 'react'
import { Stage, Layer, Rect, Text, Transformer } from 'react-konva'
import type { Room } from '../types'
import Konva from 'konva'

const COLORS = ['#bfdbfe', '#bbf7d0', '#fef08a', '#fed7aa', '#e9d5ff', '#fecaca', '#a7f3d0', '#ddd6fe']

interface Props {
  rooms: Room[]
  editMode: boolean
  selectedRoomId: string | null
  onSelectRoom: (id: string) => void
  onSaveRoom: (room: Omit<Room, 'id'> & { id?: string }) => void
  onDeleteRoom: (id: string) => void
  farmId: string
}

interface DrawingState {
  active: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
}

export default function FloorPlanCanvas({ rooms, editMode, selectedRoomId, onSelectRoom, onSaveRoom, onDeleteRoom, farmId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [drawing, setDrawing] = useState<DrawingState | null>(null)
  const [showNameModal, setShowNameModal] = useState(false)
  const [pendingRect, setPendingRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [roomName, setRoomName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const transformerRef = useRef<Konva.Transformer>(null)
  const selectedNodeRef = useRef<Konva.Rect | null>(null)
  const colorIdx = useRef(0)

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        })
      }
    })
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (transformerRef.current) {
      if (selectedNodeRef.current && editMode) {
        transformerRef.current.nodes([selectedNodeRef.current])
      } else {
        transformerRef.current.nodes([])
      }
      transformerRef.current.getLayer()?.batchDraw()
    }
  }, [selectedRoomId, editMode])

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!editMode) return
    if (e.target !== e.target.getStage()) return // only draw on empty canvas
    const pos = e.target.getStage()!.getPointerPosition()!
    setDrawing({ active: true, startX: pos.x, startY: pos.y, currentX: pos.x, currentY: pos.y })
  }

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!drawing?.active) return
    const pos = e.target.getStage()!.getPointerPosition()!
    setDrawing(prev => prev ? { ...prev, currentX: pos.x, currentY: pos.y } : null)
  }

  const handleMouseUp = () => {
    if (!drawing?.active) return
    const w = Math.abs(drawing.currentX - drawing.startX)
    const h = Math.abs(drawing.currentY - drawing.startY)
    if (w > 20 && h > 20) {
      setPendingRect({
        x: Math.min(drawing.startX, drawing.currentX),
        y: Math.min(drawing.startY, drawing.currentY),
        width: w,
        height: h
      })
      setShowNameModal(true)
    }
    setDrawing(null)
  }

  const confirmRoom = () => {
    if (!pendingRect || !roomName) return
    const fill = COLORS[colorIdx.current % COLORS.length]
    colorIdx.current++
    onSaveRoom({ ...pendingRect, farmId, name: roomName, code: roomCode, fill })
    setPendingRect(null); setRoomName(''); setRoomCode(''); setShowNameModal(false)
  }

  const handleRoomDragEnd = (room: Room, e: Konva.KonvaEventObject<DragEvent>) => {
    onSaveRoom({ ...room, x: e.target.x(), y: e.target.y() })
  }

  const handleTransformEnd = (room: Room, node: Konva.Rect) => {
    const scaleX = node.scaleX(); const scaleY = node.scaleY()
    node.scaleX(1); node.scaleY(1)
    onSaveRoom({ ...room, x: node.x(), y: node.y(), width: Math.max(40, node.width() * scaleX), height: Math.max(40, node.height() * scaleY) })
  }

  return (
    <div ref={containerRef} style={{ flex: 1, position: 'relative', background: '#f8fafc', overflow: 'hidden' }}>
      {editMode && (
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, background: 'white', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#6b7280', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          Click &amp; drag on empty space to draw a room
        </div>
      )}
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: editMode ? 'crosshair' : 'default' }}
      >
        <Layer>
          {rooms.map(room => (
            <RoomShape
              key={room.id}
              room={room}
              isSelected={selectedRoomId === room.id}
              editMode={editMode}
              onSelect={(node) => {
                selectedNodeRef.current = node
                onSelectRoom(room.id)
              }}
              onDragEnd={(e) => handleRoomDragEnd(room, e)}
              onTransformEnd={(node) => handleTransformEnd(room, node)}
            />
          ))}
          {drawing?.active && (
            <Rect
              x={Math.min(drawing.startX, drawing.currentX)}
              y={Math.min(drawing.startY, drawing.currentY)}
              width={Math.abs(drawing.currentX - drawing.startX)}
              height={Math.abs(drawing.currentY - drawing.startY)}
              fill="rgba(37,99,235,0.15)"
              stroke="#2563eb"
              strokeWidth={2}
              dash={[6, 3]}
              listening={false}
            />
          )}
          <Transformer ref={transformerRef} boundBoxFunc={(_, newBox) => ({
            ...newBox, width: Math.max(40, newBox.width), height: Math.max(40, newBox.height)
          })} />
        </Layer>
      </Stage>

      {showNameModal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
          <div className="card" style={{ width: 320 }}>
            <h3 style={{ marginBottom: 16 }}>Name this room</h3>
            <div className="form-group">
              <label>Room Name</label>
              <input value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="e.g. House A" autoFocus
                onKeyDown={e => e.key === 'Enter' && confirmRoom()} />
            </div>
            <div className="form-group">
              <label>Code (optional)</label>
              <input value={roomCode} onChange={e => setRoomCode(e.target.value)} placeholder="e.g. H-A01" />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" onClick={confirmRoom}>Save Room</button>
              <button className="btn-secondary" onClick={() => { setShowNameModal(false); setPendingRect(null) }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RoomShape({ room, isSelected, editMode, onSelect, onDragEnd, onTransformEnd }: {
  room: Room
  isSelected: boolean
  editMode: boolean
  onSelect: (node: Konva.Rect) => void
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void
  onTransformEnd: (node: Konva.Rect) => void
}) {
  const rectRef = useRef<Konva.Rect>(null)

  return (
    <>
      <Rect
        ref={rectRef}
        x={room.x} y={room.y} width={room.width} height={room.height}
        fill={room.fill || '#bfdbfe'}
        stroke={isSelected ? '#2563eb' : '#94a3b8'}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={4}
        draggable={editMode}
        onClick={() => rectRef.current && onSelect(rectRef.current)}
        onTap={() => rectRef.current && onSelect(rectRef.current)}
        onDragEnd={onDragEnd}
        onTransformEnd={() => rectRef.current && onTransformEnd(rectRef.current)}
        shadowEnabled={isSelected}
        shadowColor="#2563eb"
        shadowBlur={8}
        shadowOpacity={0.3}
      />
      <Text
        x={room.x + 8} y={room.y + 8}
        width={room.width - 16}
        text={`${room.name}${room.code ? `\n${room.code}` : ''}`}
        fontSize={13} fontStyle="500"
        fill="#1e3a5f"
        listening={false}
        ellipsis
      />
    </>
  )
}
