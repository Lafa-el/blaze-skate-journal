import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile as firebaseUpdateProfile, updatePassword, deleteUser, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
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
  updatePassword: async () => {},
  updateEmail: async () => {},
  deleteAccount: async () => {},
  isLoading: false,
  signInError: null,
  signUpError: null,
  resetError: null,
  passwordError: null,
  emailError: null,
  deleteError: null,
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [signInError, setSignInError] = useState(null)
  const [signUpError, setSignUpError] = useState(null)
  const [resetError, setResetError] = useState(null)
  const [passwordError, setPasswordError] = useState(null)
  const [emailError, setEmailError] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

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

  const updatePasswordFn = async (currentPassword, newPassword) => {
    setIsLoading(true)
    setPasswordError(null)
    try {
      const user = auth.currentUser
      if (!user || !user.email) throw new Error('No email found for current user')
      
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)
    } catch (e) {
      let message = 'Failed to update password.'
      if (e.code === 'auth/wrong-password') {
        message = 'Current password is incorrect.'
      } else if (e.code === 'auth/weak-password') {
        message = 'New password is too weak.'
      } else if (e.code === 'auth/requires-recent-login') {
        message = 'Please sign out and sign in again, then try again.'
      } else if (e.message) {
        message = e.message
      }
      setPasswordError(message)
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const updateEmailFn = async (newEmail) => {
    setIsLoading(true)
    setEmailError(null)
    try {
      const user = auth.currentUser
      if (!user || !user.email) throw new Error('No email found for current user')
      
      const credential = EmailAuthProvider.credential(user.email, newEmail)
      await reauthenticateWithCredential(user, credential)
      await updateEmail(user, newEmail)
    } catch (e) {
      let message = 'Failed to update email.'
      if (e.code === 'auth/wrong-password') {
        message = 'Password is incorrect.'
      } else if (e.code === 'auth/email-already-in-use') {
        message = 'This email is already in use.'
      } else if (e.code === 'auth/invalid-email') {
        message = 'Invalid email address.'
      } else if (e.code === 'auth/requires-recent-login') {
        message = 'Please sign out and sign in again, then try again.'
      } else if (e.message) {
        message = e.message
      }
      setEmailError(message)
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteAccountFn = async (currentPassword) => {
    setIsLoading(true)
    setDeleteError(null)
    try {
      const user = auth.currentUser
      if (!user || !user.email) throw new Error('No email found for current user')
      
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await deleteUser(user)
    } catch (e) {
      let message = 'Failed to delete account.'
      if (e.code === 'auth/wrong-password') {
        message = 'Password is incorrect.'
      } else if (e.code === 'auth/requires-recent-login') {
        message = 'Please sign out and sign in again, then try again.'
      } else if (e.message) {
        message = e.message
      }
      setDeleteError(message)
      throw new Error(message)
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
        updatePassword: updatePasswordFn,
        updateEmail: updateEmailFn,
        deleteAccount: deleteAccountFn,
        isLoading,
        signInError,
        signUpError,
        resetError,
        passwordError,
        emailError,
        deleteError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
