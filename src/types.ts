export interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: 'supplier' | 'client'
  farmIds: string[]  // for clients: which farms they can access
}

export interface Farm {
  id: string
  name: string
  code: string
  clientUids: string[]
  invitedEmails: string[]
  createdAt: number
}

export interface Room {
  id: string
  farmId: string
  name: string
  code: string
  // Konva shape data
  x: number
  y: number
  width: number
  height: number
  fill: string
}

export interface Product {
  id: string
  farmId: string
  roomId: string
  name: string
  type: string
  quantity: number
  unit: string
  installDate: string
  notes: string
  imageUrl?: string
  addedAt: number
}

export interface Note {
  id: string
  farmId: string
  roomId: string
  text: string
  imageUrl?: string
  addedAt: number
}

export interface RoomForm {
  id: string
  farmId: string
  roomId: string
  name: string
  url: string
  addedAt: number
}
