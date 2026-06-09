import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile as firebaseUpdateProfile } from 'firebase/auth'
import { auth } from '../firebase/auth'

const AuthContext = createContext({
  user: null,
  loading: true,
  isAnonymous: true,
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  resetPasswordEmail: async () => {},
  updateProfile: async () => {},
  signOutUser: async () => {},
  isLoading: false,
  signInError: null,
  signUpError: null,
  resetError: null,
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [signInError, setSignInError] = useState(null)
  const [signUpError, setSignUpError] = useState(null)
  const [resetError, setResetError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const signInWithEmailFn = async (email, password) => {
    setIsLoading(true)
    setSignInError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (e) {
      let message = 'Failed to sign in.'
      if (e.code === 'auth/user-not-found') {
        message = 'No account found with this email.'
      } else if (e.code === 'auth/wrong-password') {
        message = 'Incorrect password.'
      } else if (e.code === 'auth/invalid-email') {
        message = 'Invalid email address.'
      } else if (e.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.'
      } else if (e.message) {
        message = e.message
      }
      setSignInError(message)
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const signUpWithEmailFn = async (email, password, displayName) => {
    setIsLoading(true)
    setSignUpError(null)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      if (displayName) await firebaseUpdateProfile(userCredential.user, { displayName })
    } catch (e) {
      let message = 'Failed to create account.'
      if (e.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists.'
      } else if (e.code === 'auth/weak-password') {
        message = 'Password must be at least 6 characters.'
      } else if (e.code === 'auth/invalid-email') {
        message = 'Invalid email address.'
      } else if (e.message) {
        message = e.message
      }
      setSignUpError(message)
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const resetPasswordEmailFn = async (email) => {
    setIsLoading(true)
    setResetError(null)
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (e) {
      let message = 'Failed to send reset email.'
      if (e.code === 'auth/invalid-email') {
        message = 'Invalid email address.'
      } else if (e.code === 'auth/user-not-found') {
        message = 'No account found with this email.'
      } else if (e.message) {
        message = e.message
      }
      setResetError(message)
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfileFn = async ({ displayName, photoURL }) => {
    setIsLoading(true)
    try {
      if (auth.currentUser) await firebaseUpdateProfile(auth.currentUser, { displayName, photoURL: photoURL || undefined })
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false)
    }
  }

  const signOutUserFn = async () => {
    setIsLoading(true)
    try {
      await signOut(auth)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAnonymous: !!user?.isAnonymous,
        signInWithEmail: signInWithEmailFn,
        signUpWithEmail: signUpWithEmailFn,
        resetPasswordEmail: resetPasswordEmailFn,
        updateProfile: updateProfileFn,
        signOutUser: signOutUserFn,
        isLoading,
        signInError,
        signUpError,
        resetError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
