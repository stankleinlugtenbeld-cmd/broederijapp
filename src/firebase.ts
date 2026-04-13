import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Replace with your Firebase project config
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAL85e7gh7J9jVhaxe4c4hIgoPXrhwCkxE",
  authDomain: "broederijapp.vercel.app",
  projectId: "broederijapp",
  storageBucket: "broederijapp.firebasestorage.app",
  messagingSenderId: "902487958907",
  appId: "1:902487958907:web:775b10f773f828e6d849de",
  measurementId: "G-BB59XGHY0C"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()
