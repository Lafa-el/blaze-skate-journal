import { useState, useEffect } from 'react'
import { User, Bell, Shield, Palette, LogOut, HelpCircle, Database, Globe, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n'
import { LANGUAGE_LABELS } from '../i18n/constants'

const NOTIFICATIONS_KEY = 'notification_preferences'

const notificationTypes = [
  { key: 'sessionReminders', labelKey: 'settings.notifTypes.sessionReminders', descKey: 'settings.notifTypes.sessionRemindersDesc', icon: '🏒' },
  { key: 'sessionConfirmations', labelKey: 'settings.notifTypes.sessionConfirmations', descKey: 'settings.notifTypes.sessionConfirmationsDesc', icon: '✅' },
  { key: 'performanceRecords', labelKey: 'settings.notifTypes.performanceRecords', descKey: 'settings.notifTypes.performanceRecordsDesc', icon: '🏆' },
  { key: 'coachNotes', labelKey: 'settings.notifTypes.coachNotes', descKey: 'settings.notifTypes.coachNotesDesc', icon: '📝' },
  { key: 'weeklyReviews', labelKey: 'settings.notifTypes.weeklyReviews', descKey: 'settings.notifTypes.weeklyReviewsDesc', icon: '📊' },
  { key: 'milestones', labelKey: 'settings.notifTypes.milestones', descKey: 'settings.notifTypes.milestonesDesc', icon: '⭐' },
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

function getNotifSummary(notifState, t) {
  if (!notifState.enabled) return t('settings.notifSummary.allOff')
  const enabledCount = notificationTypes
    .filter((type) => notifState[type.key])
    .length
  if (enabledCount === 0) return t('settings.notifSummary.noneEnabled')
  if (enabledCount === notificationTypes.length) return t('settings.notifSummary.allOn')
  return `${enabledCount} ${t('settings.notifSummary.of')} ${notificationTypes.length} ${t('settings.notifSummary.enabled')}`
}

export default function Settings() {
  const { signOutUser } = useAuth()
  const navigate = useNavigate()
  const { t, lang, setLang } = useLanguage()
  const [showConfirm, setShowConfirm] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [showLangPicker, setShowLangPicker] = useState(false)

  // Notifications state
  const [notifications, setNotifications] = useState(loadNotifications)
  const [showNotifPicker, setShowNotifPicker] = useState(false)

  const handleAction = (action, path) => {
    if (action === 'navigate') navigate(path)
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showNotifPicker && !e.target.closest('[data-notif-row]') && !e.target.closest('[data-notif-panel]')) {
        setShowNotifPicker(false)
      }
      if (showLangPicker && !e.target.closest('[data-lang-row]') && !e.target.closest('[data-lang-panel]')) {
        setShowLangPicker(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showNotifPicker, showLangPicker])

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
      <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
      <p className="text-sm text-gray-500 mt-0.5">{t('settings.subtitle')}</p>
      </div>

      {/* Settings Groups */}
      {settingsGroups.map((group, gi) => (
        <div key={gi}>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">{t(group.titleKey)}</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {group.items.map((item, ii) => {
              if (item.type === 'notifications') {
                return (
                  <div key={ii} className="relative">
                    <div
                      onClick={() => setShowNotifPicker(!showNotifPicker)}
                      className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors`}
                      data-notif-row
                    >
                      <item.icon className="w-5 h-5 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{t(item.labelKey)}</p>
                        <p className="text-xs text-gray-400">{getNotifSummary(notifications, t)}</p>
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
                            <span className="text-sm font-medium text-gray-700">{t('settings.notifications')}</span>
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
                                  <p className="text-sm text-gray-700">{t(type.labelKey)}</p>
                                  <p className="text-xs text-gray-400">{t(type.descKey)}</p>
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
                                <span className="text-xs">{notifications[type.key] ? t('common.on') : t('common.off')}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }

              if (item.type === 'appearance') {
                return (
                  <div key={ii}>
                    <div className="flex items-center gap-3 p-4">
                      <item.icon className="w-5 h-5 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{t(item.labelKey)}</p>
                        <p className="text-xs text-gray-500">Light Mode</p>
                      </div>
                    </div>
                  </div>
                )
              }

              if (item.type === 'language') {
                return (
                  <div key={ii} className="relative">
                    <div
                      onClick={() => setShowLangPicker(!showLangPicker)}
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      data-lang-row
                    >
                      <item.icon className="w-5 h-5 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{t(item.labelKey)}</p>
                        <p className="text-xs text-gray-400">{LANGUAGE_LABELS[lang]}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showLangPicker ? 'rotate-90' : ''}`} />
                    </div>

                    {/* Dropdown panel */}
                    {showLangPicker && (
                      <div className="bg-gray-50 border-t border-gray-100 p-4" data-lang-panel>
                        <div className="space-y-2">
                          {(['en', 'zh']).map((l) => (
                            <button
                              key={l}
                              onClick={(e) => { e.stopPropagation(); setLang(l); setShowLangPicker(false) }}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                lang === l
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <span className="text-base">{l === 'en' ? '🇺🇸' : '🇨🇳'}</span>
                              <div className="flex-1 text-left">
                                <p className="text-sm">{LANGUAGE_LABELS[l]}</p>
                              </div>
                              <span className="text-sm">{lang === l ? '✓' : ''}</span>
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
                    if (item.labelKey === 'settings.signOut') setShowConfirm(true)
                    if (item.labelKey === 'settings.exportData') handleExportData()
                  }}
                  className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${item.danger ? '' : ''}`}
                >
                  <item.icon className={`w-5 h-5 ${item.danger ? 'text-red-500' : 'text-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${item.danger ? 'text-red-600' : 'text-gray-900'}`}>
                      {t(item.labelKey)}
                    </p>
                    <p className="text-xs text-gray-400">{item.descKey ? t(item.descKey) : item.desc}</p>
                  </div>
                  {item.labelKey !== 'settings.signOut' && (
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
        <p className="text-xs text-gray-400">{t('settings.appVersion')}</p>
        <p className="text-xs text-gray-300 mt-1">{t('settings.appBuilt')}</p>
      </div>

      {/* Sign Out Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-900 mb-2">{t('settings.signOutConfirm')}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('settings.signOutMessage')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                {signingOut ? t('settings.signingOut') : t('settings.signOutYes')}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-colors"
              >
                {t('common.cancel')}
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
    titleKey: 'settings.profile',
    items: [
      { type: 'default', icon: User, labelKey: 'settings.editProfile', descKey: 'settings.editProfileDesc', action: 'navigate', actionPath: '/edit-profile' },
      { type: 'language', icon: Globe, labelKey: 'settings.language', descKey: 'settings.language' },
    ],
  },
  {
    titleKey: 'settings.preferences',
    items: [
      { type: 'appearance', icon: Palette, labelKey: 'settings.appearance', desc: 'Light Mode' },
      { type: 'notifications', icon: Bell, labelKey: 'settings.notifications', desc: getNotifSummaryLabel(defaultNotifications) },
    ],
  },
  {
    titleKey: 'settings.data',
    items: [
      { type: 'default', icon: Database, labelKey: 'settings.exportData', descKey: 'settings.exportDataDesc' },
      { type: 'default', icon: Shield, labelKey: 'settings.privacy', descKey: 'settings.privacyDesc', action: 'navigate', actionPath: '/privacy-security' },
    ],
  },
  {
    titleKey: 'settings.about',
    items: [
      { type: 'default', icon: HelpCircle, labelKey: 'settings.helpSupport', descKey: 'settings.helpSupportDesc', action: 'navigate', actionPath: '/help-support' },
      { type: 'default', icon: LogOut, labelKey: 'settings.signOut', descKey: 'settings.signOutDesc', danger: true },
    ],
  },
]

// Helper for static notif summary text at group level
function getNotifSummaryLabel(notifState) {
  if (!notifState.enabled) return 'All notifications off'
  const enabledCount = notificationTypes
    .filter((type) => notifState[type.key])
    .length
  if (enabledCount === 0) return 'No notifications enabled'
  if (enabledCount === notificationTypes.length) return 'All notifications on'
  return `${enabledCount} of ${notificationTypes.length} enabled`
}
