import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { athleteService } from '../services/athleteService'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/firestore'
import { auth } from '../firebase/auth'
import { updateProfile as firebaseUpdateProfile } from 'firebase/auth'
import { ArrowLeft, Save, Loader2, User, Camera } from 'lucide-react'
import { useLanguage } from '../i18n'

const MAX_BIO_LENGTH = 500

export default function EditProfile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [level, setLevel] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [skatingFrom, setSkatingFrom] = useState('')
  const [birthday, setBirthday] = useState('')

  // Load current profile
  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        if (user?.displayName) setDisplayName(user.displayName)
        if (user?.photoURL) setAvatarUrl(user.photoURL)

        // Use athleteService.get to find the athlete doc by UID (stored as athleteId)
        const athlete = await athleteService.get(user?.uid || 'default')
        if (athlete) {
          const data = athlete.data
          setBio(data.bio || '')
          setLevel(data.level || '')
          if (data.avatarUrl) setAvatarUrl(data.avatarUrl)
          if (data.skatingFrom) setSkatingFrom(data.skatingFrom)
          if (data.birthday) setBirthday(data.birthday)
          // Store the Firestore doc ID so we can update it later
          window.__athleteDocId = athlete.docId
        } else {
          // Create an athlete record if it doesn't exist
          const result = await athleteService.createOrUpdate(user?.uid || 'default')
          window.__athleteDocId = result
        }
      } catch (e) {
        setError(t('editProfile.failedLoad') + ': ' + e.message)
        console.error('[EditProfile] Load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, t])

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => setAvatarUrl(ev.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError(t('editProfile.displayNameRequired'))
      return
    }
    if (bio.length > MAX_BIO_LENGTH) {
      setError(t('editProfile.bioMaxLength'))
      return
    }

    setSaving(true)
    setError('')
    try {
      const authUpdates = { displayName: displayName.trim() }

      // If a new avatar file was selected, store the base64 data URL
      // Avatar URL is stored ONLY in Firestore (Firebase Auth photoURL has 512 char limit)
      let avatarUrlToSave = avatarUrl || null
      if (avatarFile) {
        const reader = new FileReader()
        avatarUrlToSave = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(avatarFile)
        })
      }

      // Update Firebase Auth (only display name)
      if (auth.currentUser) {
        await firebaseUpdateProfile(auth.currentUser, authUpdates)
      }

      // Update Firestore
      const firestoreUpdates = {
        displayName: displayName.trim(),
        updatedAt: new Date().toISOString(),
      }
      if (bio) firestoreUpdates.bio = bio
      if (level) firestoreUpdates.level = level
      if (avatarUrlToSave) firestoreUpdates.avatarUrl = avatarUrlToSave
      if (skatingFrom) firestoreUpdates.skatingFrom = skatingFrom
      if (birthday) firestoreUpdates.birthday = birthday

      // Use the stored doc ID, fallback to user.uid
      const docId = window.__athleteDocId || user.uid
      await updateDoc(doc(db, 'athletes', docId), firestoreUpdates)

      navigate('/settings')
    } catch (e) {
      setError(t('editProfile.failedSave') + ': ' + e.message)
      console.error('[EditProfile] Save error:', e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{t('editProfile.title')}</h1>
          <div className="flex-1" />
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {t('editProfile.save')}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="p-4 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-24 h-24">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <label className="absolute bottom-0 right-0 bg-primary rounded-full p-1 cursor-pointer shadow-lg hover:bg-[#4f46e5] transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <Camera className="w-4 h-4 text-white" />
            </label>
          </div>
          <p className="text-xs text-gray-400">{t('editProfile.clickCamera')}</p>
        </div>

        {/* Display Name */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <label className="text-sm font-medium text-gray-700">{t('editProfile.displayName')}</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t('editProfile.displayNamePlaceholder')}
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Bio */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">{t('editProfile.bio')}</label>
            <span className={`text-xs ${bio.length > MAX_BIO_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
              {bio.length}/{MAX_BIO_LENGTH}
            </span>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t('editProfile.bioPlaceholder')}
            rows={4}
            maxLength={MAX_BIO_LENGTH}
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>

        {/* Skating From */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <label className="text-sm font-medium text-gray-700">{t('editProfile.skatingFrom')}</label>
          <input
            type="date"
            value={skatingFrom}
            onChange={(e) => setSkatingFrom(e.target.value)}
            placeholder="MM/DD/YYYY"
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
          />
          <p className="text-xs text-gray-400 mt-1">{t('editProfile.skatingFromPlaceholder')}</p>
        </div>

        {/* Birthday */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <label className="text-sm font-medium text-gray-700">{t('editProfile.birthday')}</label>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            placeholder="MM/DD/YYYY"
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
          />
          <p className="text-xs text-gray-400 mt-1">{t('editProfile.birthdayPlaceholder')}</p>
        </div>

        {/* Email (read-only) */}
        {user?.email && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <label className="text-sm font-medium text-gray-500">{t('editProfile.email')}</label>
            <p className="mt-1 text-sm text-gray-700">{user.email}</p>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
