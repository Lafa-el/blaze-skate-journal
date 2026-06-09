import { useState, useEffect } from 'react'
import { User, Bell, Shield, Palette, LogOut, HelpCircle, Database, Globe, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { athleteService } from '../services/athleteService'

const THEME_KEY = 'blaze_theme'

function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved && ['auto', 'light', 'dark'].includes(saved)) return saved
  } catch {
    // ignore
  }
  return 'auto'
}

const NOTIFICATIONS_KEY = 'notification_preferences'

const notificationTypes = [
  { key: 'sessionReminders', label: 'Session Reminders', desc: 'Get notified before scheduled sessions', icon: '🏒' },
  { key: 'sessionConfirmations', label: 'Session Confirmations', desc: 'Confirm when a session is logged', icon: '✅' },
  { key: 'performanceRecords', label: 'Performance Records', desc: 'Alerts on new PBs or achievements', icon: '🏆' },
  { key: 'coachNotes', label: 'Coach Notes', desc: 'Notified when coach adds feedback', icon: '📝' },
  { key: 'weeklyReviews', label: 'Weekly Reviews', desc: 'Ready to review your weekly summary', icon: '📊' },
  { key: 'milestones', label: 'Milestones', desc: 'Unlocked a new skating milestone', icon: '⭐' },
]

function loadNotifications() {
  try {
    const saved = localStorage.getItem(NOTIFICATIONS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (typeof parsed === 'object' && parsed !== null) return parsed
    }
  } catch {
    // ignore
  }
  return {
    enabled: true,
    sessionReminders: true,
    sessionConfirmations: true,
    performanceRecords: false,
    coachNotes: true,
    weeklyReviews: false,
    milestones: true,
  }
}

function saveNotifications(notif) {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notif))
  } catch {
    // ignore
  }
}

const defaultNotifications = loadNotifications()

function getNotifSummary(notifState) {
  if (!notifState.enabled) return 'All notifications off'
  const enabledCount = notificationTypes
    .filter((t) => notifState[t.key])
    .length
  if (enabledCount === 0) return 'No notifications enabled'
  if (enabledCount === notificationTypes.length) return 'All notifications on'
  return `${enabledCount} of ${notificationTypes.length} enabled`
}

export default function Settings() {
  const { user, signOutUser } = useAuth()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(loadTheme)
  const [showConfirm, setShowConfirm] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [showLevelPicker, setShowLevelPicker] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [skatingFrom, setSkatingFrom] = useState('')
  const [birthday, setBirthday] = useState('')

  // Apply theme to document
  useEffect(() => {
    if (theme === 'auto') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', theme)
    }
  }, [theme])

  // Notifications state
  const [notifications, setNotifications] = useState(loadNotifications)
  const [showNotifPicker, setShowNotifPicker] = useState(false)

  // Appearance state
  const [showAppearancePicker, setShowAppearancePicker] = useState(false)

  const handleAction = (action, path) => {
    if (action === 'navigate') navigate(path)
  }

  // Helper functions
  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User'
  const email = user?.email || ''
  const isAnonymous = !!user?.isAnonymous
  const creationTime = user?.metadata?.creationTime || ''

  const formatDate = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  // Load avatar URL from Firestore
  useEffect(() => {
    async function loadAvatar() {
      try {
        const athlete = await athleteService.get(user?.uid || 'default')
        if (athlete?.data?.avatarUrl) {
          setAvatarUrl(athlete.data.avatarUrl)
        }
      } catch (e) {
        console.error('[Settings] Failed to load avatar:', e)
      }
    }
    if (user?.uid) loadAvatar()
  }, [user])

  // Load skatingFrom from Firestore
  useEffect(() => {
    async function loadSkatingFrom() {
      try {
        const athlete = await athleteService.get(user?.uid || 'default')
        if (athlete?.data?.skatingFrom) {
          setSkatingFrom(athlete.data.skatingFrom)
        }
      } catch (e) {
        console.error('[Settings] Failed to load skatingFrom:', e)
      }
    }
    if (user?.uid) loadSkatingFrom()
  }, [user])

  // Load birthday from Firestore
  useEffect(() => {
    async function loadBirthday() {
      try {
        const athlete = await athleteService.get(user?.uid || 'default')
        if (athlete?.data?.birthday) {
          setBirthday(athlete.data.birthday)
        }
      } catch (e) {
        console.error('[Settings] Failed to load birthday:', e)
      }
    }
    if (user?.uid) loadBirthday()
  }, [user])

  // Calculate skating duration
  const getSkatingDuration = () => {
    if (!skatingFrom) return null
    const start = new Date(skatingFrom)
    const now = new Date()
    
    let years = now.getFullYear() - start.getFullYear()
    let months = now.getMonth() - start.getMonth()
    let days = now.getDate() - start.getDate()
    
    if (days < 0) {
      days += new Date(now.getFullYear(), now.getMonth(), 0).getDate()
      months--
    }
    if (months < 0) {
      months += 12
      years--
    }
    
    return { years, months, days }
  }

  const skatingDuration = getSkatingDuration()

  // Calculate skating age based on ISU rule (July 1st cutoff)
  // Every July 1, the skating age group is determined by birth date.
  // - Born Jan 1 - Jun 30: age = seasonStartYear - birthYear
  // - Born Jul 1 - Dec 31: age = seasonStartYear - birthYear - 1
  const getSkatingAge = () => {
    if (!birthday) return null
    const birthDate = new Date(birthday)
    const now = new Date()
    
    const currentYear = now.getFullYear()
    const julyFirstThisYear = new Date(currentYear, 6, 1) // July 1
    const birthMonth = birthDate.getMonth() // 0-11
    const birthDay = birthDate.getDate()
    
    // Determine which skating season we're in
    // Season: July 1 this year to June 30 next year
    let seasonStartYear = currentYear
    if (now < julyFirstThisYear) {
      // We're before July 1, so we're in the previous season (Jul 1 last year to Jun 30 this year)
      seasonStartYear = currentYear - 1
    }
    
    // Check if born before or on July 1
    const bornBeforeJuly1 = (birthMonth < 6) || (birthMonth === 6 && birthDay < 1)
    
    if (bornBeforeJuly1) {
      return seasonStartYear - birthDate.getFullYear()
    } else {
      return seasonStartYear - birthDate.getFullYear() - 1
    }
  }

  const skatingAge = getSkatingAge()

  // Get age category based on skating age
  const getAgeCategory = () => {
    if (skatingAge === null) return null
    if (skatingAge <= 6) return 'Pre-Novice'
    if (skatingAge <= 8) return 'Junior F (7/8)'
    if (skatingAge <= 10) return 'Junior E (9/10)'
    if (skatingAge <= 12) return 'Junior D (11/12)'
    if (skatingAge <= 14) return 'Junior C (13/14)'
    if (skatingAge <= 16) return 'Junior B (15/16)'
    if (skatingAge <= 18) return 'Junior A (17/18)'
    return 'Senior (18+)'
  }

  const ageCategory = getAgeCategory()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showNotifPicker && !e.target.closest('[data-notif-row]') && !e.target.closest('[data-notif-panel]')) {
        setShowNotifPicker(false)
      }
      if (showAppearancePicker && !e.target.closest('[data-appearance-row]') && !e.target.closest('[data-appearance-panel]')) {
        setShowAppearancePicker(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showNotifPicker, showAppearancePicker])

  const handleToggleNotif = (type, enabled = null) => {
    setNotifications((prev) => {
      const updated = {
        ...prev,
        enabled: type === '__global__' ? !prev.enabled : prev.enabled,
        [type]: enabled !== null ? enabled : !prev[type],
      }
      saveNotifications(updated)
      return updated
    })
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOutUser()
      navigate('/login')
    } catch (e) {
      console.error('[Settings] Sign out failed:', e)
    } finally {
      setSigningOut(false)
      setShowConfirm(false)
    }
  }

  const handleExportData = () => {
    navigate('/export')
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account & preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
              {getInitials(displayName)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">{displayName}</h2>
            {email && (
              <p className="text-sm text-gray-500 truncate">{email}</p>
            )}
            {skatingAge !== null && (
              <p className="text-xs text-purple-600 font-medium mt-1">
                Skating Age: {skatingAge}
              </p>
            )}
            {ageCategory !== null && (
              <p className="text-xs text-purple-600 font-medium mt-0.5">
                Age Category: {ageCategory}
              </p>
            )}
            {skatingDuration && (
              <p className="text-xs text-purple-600 font-medium mt-1">
                Skating for {skatingDuration.years} year{skatingDuration.years > 1 ? 's' : ''} {skatingDuration.months} month{skatingDuration.months !== 1 ? 's' : ''} {skatingDuration.days} day{skatingDuration.days !== 1 ? 's' : ''}
              </p>
            )}

            {isAnonymous && (
              <p className="text-xs text-yellow-500 mt-1">Anonymous account</p>
            )}
          </div>
        </div>
      </div>

      {/* Settings Groups */}
      {settingsGroups.map((group, gi) => (
        <div key={gi}>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">{group.title}</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {group.items.map((item, ii) => {
              if (item.label === 'Notifications') {
                return (
                  <div key={ii} className="relative">
                    <div
                      onClick={() => setShowNotifPicker(!showNotifPicker)}
                      className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors`}
                      data-notif-row
                    >
                      <item.icon className="w-5 h-5 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-400">{getNotifSummary(notifications)}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showNotifPicker ? 'rotate-90' : ''}`} />
                    </div>

                    {/* Dropdown panel */}
                    {showNotifPicker && (
                      <div className="bg-gray-50 border-t border-gray-100 p-4" data-notif-panel>
                        {/* Global toggle */}
                        <div className="flex items-center justify-between py-2 mb-3">
                          <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Notifications</span>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleNotif('__global__') }}
                            className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                              notifications.enabled
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            <span className="text-sm">{notifications.enabled ? '☑' : '☐'}</span>
                          </button>
                        </div>

                        {/* Individual notification types with checkbox style */}
                        <div className="space-y-3">
                          {notificationTypes.map((type) => (
                            <div key={type.key} className="flex items-center justify-between">
                              <div className="flex items-center gap-2 mr-3">
                                <span className="text-base">{type.icon}</span>
                                <div>
                                  <p className="text-sm text-gray-700">{type.label}</p>
                                  <p className="text-xs text-gray-400">{type.desc}</p>
                                </div>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleNotif(type.key) }}
                                disabled={!notifications.enabled}
                                className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                                  notifications[type.key]
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'bg-gray-200 text-gray-400'
                                } ${!notifications.enabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                              >
                                <span className="text-sm">{notifications[type.key] ? '☑' : '☐'}</span>
                                <span className="text-xs">{notifications[type.key] ? 'On' : 'Off'}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }

              if (item.label === 'Appearance') {
                const themeLabels = { auto: 'Auto', light: 'Light', dark: 'Dark' }
                const themeIcons = { auto: '🔄', light: '☀️', dark: '🌙' }
                return (
                  <div key={ii} className="relative">
                    <div
                      onClick={() => setShowAppearancePicker(!showAppearancePicker)}
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      data-appearance-row
                    >
                      <item.icon className="w-5 h-5 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-400">{themeLabels[theme]} mode</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showAppearancePicker ? 'rotate-90' : ''}`} />
                    </div>

                    {/* Dropdown panel */}
                    {showAppearancePicker && (
                      <div className="bg-gray-50 border-t border-gray-100 p-4" data-appearance-panel>
                        <div className="space-y-2">
                          {(['auto', 'light', 'dark']).map((mode) => (
                            <button
                              key={mode}
                              onClick={(e) => { e.stopPropagation(); setTheme(mode); localStorage.setItem(THEME_KEY, mode) }}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                theme === mode
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <span className="text-base">{themeIcons[mode]}</span>
                              <div className="flex-1 text-left">
                                <p className="text-sm">{themeLabels[mode]}</p>
                                <p className="text-xs text-gray-400">
                                  {mode === 'auto' ? 'Follows system settings' : mode === 'light' ? 'Always light mode' : 'Always dark mode'}
                                </p>
                              </div>
                              <span className="text-sm">{theme === mode ? '✓' : ''}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <div
                  key={ii}
                  onClick={() => {
                    if (item.action) handleAction(item.action, item.actionPath)
                    if (item.label === 'Sign Out') setShowConfirm(true)
                    if (item.label === 'Export Data') handleExportData()
                  }}
                  className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${item.danger ? '' : ''}`}
                >
                  <item.icon className={`w-5 h-5 ${item.danger ? 'text-red-500' : 'text-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${item.danger ? 'text-red-600' : 'text-gray-900'}`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  {item.label !== 'Sign Out' && (
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* App Version */}
      <div className="text-center pt-4">
        <p className="text-xs text-gray-400">Blaze Skate Journal v1.0.0</p>
        <p className="text-xs text-gray-300 mt-1">Built with ❤️ for skaters</p>
      </div>

      {/* Sign Out Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-900 mb-2">Sign Out?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to sign out? Your data will be saved.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                {signingOut ? 'Signing out...' : 'Yes, Sign Out'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const settingsGroups = [
  {
    title: 'Profile',
    items: [
      { icon: User, label: 'Edit Profile', desc: 'Name, avatar, bio', action: 'navigate', actionPath: '/edit-profile' },
      { icon: Globe, label: 'Language', desc: 'English' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: Palette, label: 'Appearance', desc: 'Light / Dark mode' },
      { icon: Bell, label: 'Notifications', desc: getNotifSummary(defaultNotifications) },
    ],
  },
  {
    title: 'Data',
    items: [
      { icon: Database, label: 'Export Data', desc: 'Download your journal data' },
      { icon: Shield, label: 'Privacy & Security', desc: 'Password, email, delete account', action: 'navigate', actionPath: '/privacy-security' },
    ],
  },
  {
    title: 'About',
    items: [
      { icon: HelpCircle, label: 'Help & Support', desc: 'FAQs, contact us', action: 'navigate', actionPath: '/help-support' },
      { icon: LogOut, label: 'Sign Out', desc: 'Log out of your account', danger: true },
    ],
  },
]
