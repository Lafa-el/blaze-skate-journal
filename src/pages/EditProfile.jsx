import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { athleteService } from '../services/athleteService'
import { auth } from '../firebase/auth'
import { storage } from '../firebase/storage'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { updateProfile as firebaseUpdateProfile } from 'firebase/auth'
import { ArrowLeft, Save, Loader2, User, Camera } from 'lucide-react'

const LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const MAX_BIO_LENGTH = 500

export default function EditProfile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [level, setLevel] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)

  // Load current profile
  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        if (user?.displayName) setDisplayName(user.displayName)
        if (user?.photoURL) setAvatarUrl(user.photoURL)

        const athlete = await athleteService.get(user?.uid || 'default')
        if (athlete) {
          const data = athlete.data
          setBio(data.bio || '')
          setLevel(data.level || '')
          if (data.avatarUrl) setAvatarUrl(data.avatarUrl)
        }
      } catch (e) {
        setError('Failed to load profile: ' + e.message)
        console.error('[EditProfile] Load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

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
      setError('Display name is required')
      return
    }
    if (bio.length > MAX_BIO_LENGTH) {
      setError(`Bio must be ${MAX_BIO_LENGTH} characters or less`)
      return
    }

    setSaving(true)
    setError('')
    try {
      let avatarUrlToSave = null
      const authUpdates = { displayName: displayName.trim() }

      if (avatarFile) {
        const compressed = await compressImage(avatarFile)
        const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}.jpg`)
        await uploadBytes(storageRef, compressed)
        avatarUrlToSave = await getDownloadURL(storageRef)
        authUpdates.photoURL = avatarUrlToSave
      }

      await firebaseUpdateProfile(auth.currentUser, authUpdates)

      const firestoreUpdates = {
        displayName: displayName.trim(),
        updatedAt: new Date().toISOString(),
      }
      if (bio) firestoreUpdates.bio = bio
      if (level) firestoreUpdates.level = level
      if (avatarUrlToSave) firestoreUpdates.avatarUrl = avatarUrlToSave

      await athleteService.update(user.uid, firestoreUpdates)

      navigate('/settings')
    } catch (e) {
      setError('Failed to save profile: ' + e.message)
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
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Edit Profile</h1>
          <div className="flex-1" />
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save
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
          <p className="text-xs text-gray-400">Click camera to change avatar</p>
        </div>

        {/* Display Name */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <label className="text-sm font-medium text-gray-700">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your name"
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Bio */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Bio</label>
            <span className={`text-xs ${bio.length > MAX_BIO_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
              {bio.length}/{MAX_BIO_LENGTH}
            </span>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            rows={4}
            maxLength={MAX_BIO_LENGTH}
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>

        {/* Level */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <label className="text-sm font-medium text-gray-700">Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
          >
            <option value="">Select level</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Email (read-only) */}
        {user?.email && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <label className="text-sm font-medium text-gray-500">Email</label>
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

async function compressImage(file, maxWidth = 512, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
    }
    img.src = URL.createObjectURL(file)
  })
}
