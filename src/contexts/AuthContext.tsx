import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'
import type { UserProfile } from '../types'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

// Check if this email has been invited to any farms and grant access
async function applyInvitations(uid: string, email: string, currentFarmIds: string[]) {
  const snap = await getDocs(query(collection(db, 'farms'), where('invitedEmails', 'array-contains', email)))
  const newIds = snap.docs.map(d => d.id).filter(id => !currentFarmIds.includes(id))
  if (newIds.length === 0) return currentFarmIds
  const updated = [...currentFarmIds, ...newIds]
  await updateDoc(doc(db, 'users', uid), { farmIds: updated })
  return updated
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const ref = doc(db, 'users', firebaseUser.uid)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          let p = snap.data() as UserProfile
          if (p.role === 'client') {
            const updatedFarmIds = await applyInvitations(p.uid, p.email, p.farmIds)
            p = { ...p, farmIds: updatedFarmIds }
          }
          setProfile(p)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
  }, [])

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider)
    const u = result.user
    const ref = doc(db, 'users', u.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      const newProfile: UserProfile = {
        uid: u.uid,
        email: u.email!,
        displayName: u.displayName || u.email!,
        role: 'client',
        farmIds: []
      }
      // Write the doc first, then check invitations (updateDoc needs the doc to exist)
      await setDoc(ref, newProfile)
      const farmIds = await applyInvitations(u.uid, u.email!, [])
      const profileWithFarms = { ...newProfile, farmIds }
      setProfile(profileWithFarms)
    } else {
      setProfile(snap.data() as UserProfile)
    }
  }

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
