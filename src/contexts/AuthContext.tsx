import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, onAuthStateChanged, signInWithRedirect, getRedirectResult, setPersistence, indexedDBLocalPersistence, signOut } from 'firebase/auth'
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

async function applyInvitations(uid: string, email: string, currentFarmIds: string[]) {
  const snap = await getDocs(query(collection(db, 'farms'), where('invitedEmails', 'array-contains', email)))
  const newIds = snap.docs.map(d => d.id).filter(id => !currentFarmIds.includes(id))
  if (newIds.length === 0) return currentFarmIds
  const updated = [...currentFarmIds, ...newIds]
  await updateDoc(doc(db, 'users', uid), { farmIds: updated })
  return updated
}

async function resolveProfile(firebaseUser: User): Promise<UserProfile> {
  const ref = doc(db, 'users', firebaseUser.uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    const base: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName || firebaseUser.email!,
      role: 'client',
      farmIds: []
    }
    await setDoc(ref, base)
    const farmIds = await applyInvitations(base.uid, base.email, [])
    return { ...base, farmIds }
  }

  let p = snap.data() as UserProfile
  if (p.role === 'client') {
    const updatedFarmIds = await applyInvitations(p.uid, p.email, p.farmIds)
    p = { ...p, farmIds: updatedFarmIds }
  }
  return p
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Process redirect result — must be awaited before onAuthStateChanged
    // to avoid a race where the user appears logged out on return from Google
    const init = async () => {
      try {
        await getRedirectResult(auth)
      } catch (e) {
        console.error('Redirect sign-in error:', e)
      }
    }
    init()

    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const p = await resolveProfile(firebaseUser)
        setProfile(p)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
  }, [])

  const signInWithGoogle = async () => {
    // Use IndexedDB persistence so Safari ITP doesn't clear the session
    // during the cross-origin redirect to Google
    await setPersistence(auth, indexedDBLocalPersistence)
    await signInWithRedirect(auth, googleProvider)
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
