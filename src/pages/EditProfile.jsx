import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { athleteService } from '../services/athleteService'
import { auth } from '../firebase/auth'
import { updateProfile as firebaseUpdateProfile } from 'firebase/auth'
import { ArrowLeft, Save, Loader2, User, Camera } from 'lucide-react'
import { useLanguage } from '../i18n'
import { isValidDateString } from '../utils/dateUtils'

const MAX_BIO_LENGTH = 500
const PROFILE_MEANINGFUL_FIELDS = ['bio', 'level', 'avatarUrl', 'skatingFrom', 'birthday']

function hasDisplayName(profile, uid) {
  const displayName = profile.data?.displayName?.trim()
  return Boolean(displayName && displayName !== uid)
}

function meaningfulFieldCount(profile) {
  return PROFILE_MEANINGFUL_FIELDS.reduce((count, field) => (
    profile.data?.[field] ? count + 1 : count
  ), 0)
}

function updatedAtMs(profile) {
  const value = profile.data?.updatedAt || profile.data?.createdAt || ''
  const time = Date.parse(value)
  return Number.isNaN(time) ? 0 : time
}

function chooseBestLegacyProfile(profiles, uid) {
  return [...profiles].sort((a, b) => {
    const displayNameScore = Number(hasDisplayName(b, uid)) - Number(hasDisplayName(a, uid))
    if (displayNameScore !== 0) return displayNameScore

    const meaningfulScore = meaningfulFieldCount(b) - meaningfulFieldCount(a)
    if (meaningfulScore !== 0) return meaningfulScore

    return updatedAtMs(b) - updatedAtMs(a)
  })[0] || null
}

function profileDataForForm(profile) {
  return profile?.data || {}
}

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
        if (!user?.uid) {
          setLoading(false)
          return
        }

        if (user?.displayName) setDisplayName(user.displayName)
        if (user?.photoURL) setAvatarUrl(user.photoURL)

        let athlete = await athleteService.getAthleteProfile(user.uid)
        if (!athlete) {
          let legacyProfiles = []
          try {
            legacyProfiles = await athleteService.getLegacyAthleteProfilesByAthleteId(user.uid)
          } catch (legacyError) {
            console.warn('[EditProfile] Legacy profile lookup failed:', legacyError)
          }
          const bestLegacyProfile = chooseBestLegacyProfile(legacyProfiles, user.uid)
          const seedData = bestLegacyProfile?.data || {
            displayName: user.displayName || user.email?.split('@')[0] || user.uid,
          }
          await athleteService.upsertAthleteProfile(user.uid, seedData)
          athlete = await athleteService.getAthleteProfile(user.uid)
        }

        const data = profileDataForForm(athlete)
        setBio(data.bio || '')
        setLevel(data.level || '')
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl)
        if (data.skatingFrom) setSkatingFrom(data.skatingFrom)
        if (data.birthday) setBirthday(data.birthday)
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
    if (!user?.uid) {
      setError(t('editProfile.failedSave'))
      return
    }
    if (skatingFrom && !isValidDateString(skatingFrom)) {
      setError(t('editProfile.invalidSkatingFrom'))
      return
    }
    if (birthday && !isValidDateString(birthday)) {
      setError(t('editProfile.invalidBirthday'))
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

      await athleteService.upsertAthleteProfile(user.uid, firestoreUpdates)

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
                alt={t('editProfile.avatar')}
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
            type="text"
            inputMode="numeric"
            value={skatingFrom}
            onChange={(e) => setSkatingFrom(e.target.value)}
            placeholder={t('common.datePlaceholder')}
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
          />
          <p className="text-xs text-gray-400 mt-1">{t('editProfile.skatingFromPlaceholder')} · {t('common.dateHelp')}</p>
          {skatingFrom && !isValidDateString(skatingFrom) && (
            <p className="text-xs text-red-500 mt-1">{t('editProfile.invalidSkatingFrom')}</p>
          )}
        </div>

        {/* Birthday */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <label className="text-sm font-medium text-gray-700">{t('editProfile.birthday')}</label>
          <input
            type="text"
            inputMode="numeric"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            placeholder={t('common.datePlaceholder')}
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
          />
          <p className="text-xs text-gray-400 mt-1">{t('editProfile.birthdayPlaceholder')} · {t('common.dateHelp')}</p>
          {birthday && !isValidDateString(birthday) && (
            <p className="text-xs text-red-500 mt-1">{t('editProfile.invalidBirthday')}</p>
          )}
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
