import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarDays, Clock, TrendingUp, Target, Video, PenLine, HeartPulse, BarChart3, Tent, Settings } from 'lucide-react'
import { sessionService } from '../services/sessionService'
import { athleteService } from '../services/athleteService'
import { useAuth } from '../contexts/AuthContext'

const quickLinks = [
  { path: '/daily', label: 'Daily Log', desc: "Today's skating session", icon: CalendarDays, color: 'bg-indigo-500' },
  { path: '/sessions', label: 'Sessions', desc: 'Training sessions history', icon: Clock, color: 'bg-emerald-500' },
  { path: '/coach-notes', label: 'Coach Notes', desc: 'Latest coaching feedback', icon: PenLine, color: 'bg-amber-500' },
  { path: '/performance', label: 'Performance', desc: 'Stats & progress tracking', icon: BarChart3, color: 'bg-rose-500' },
  { path: '/body', label: 'Body Metrics', desc: 'Weight, height & fitness', icon: HeartPulse, color: 'bg-teal-500' },
  { path: '/videos', label: 'Videos', desc: 'Technique review clips', icon: Video, color: 'bg-violet-500' },
  { path: '/weekly-review', label: 'Weekly Review', desc: "This week's summary", icon: TrendingUp, color: 'bg-blue-500' },
  { path: '/summer-camp', label: 'Summer Camp', desc: 'Camp schedule & notes', icon: Tent, color: 'bg-orange-500' },
]

/** Get Monday of the week for a given YYYY-MM-DD string */
function getWeekStart(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  return monday.toISOString().slice(0, 10)
}

/** Check if date string falls within Monday-Sunday week starting from weekStart */
function isDateInWeek(dateStr, weekStartStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const ws = new Date(weekStartStr + 'T00:00:00')
  const we = new Date(ws)
  we.setDate(we.getDate() + 6)
  d.setHours(0, 0, 0, 0)
  ws.setHours(0, 0, 0, 0)
  we.setHours(0, 0, 0, 0)
  return d >= ws && d <= we
}

/** Calculate consecutive training day streak ending today */
function calcStreak(sessionDates) {
  if (sessionDates.length === 0) return 0
  const unique = [...new Set(sessionDates)]
  const sorted = [...unique].sort().reverse()
  const todayStr = new Date().toISOString().slice(0, 10)
  // If no session today, check if yesterday has one (streak could still be active)
  let streak = 0
  let checkDate = new Date(todayStr + 'T00:00:00')
  // Allow checking from today or yesterday as start
  if (!sorted.includes(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1)
  }
  while (true) {
    const d = checkDate.toISOString().slice(0, 10)
    if (sorted.includes(d)) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [birthday, setBirthday] = useState('')
  const [skatingFrom, setSkatingFrom] = useState('')

  useEffect(() => {
    if (!user) return
    loadSessions()
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    try {
      const athlete = await athleteService.get(user?.uid || 'default')
      if (athlete) {
        if (athlete.data?.avatarUrl) setAvatarUrl(athlete.data.avatarUrl)
        if (athlete.data?.birthday) setBirthday(athlete.data.birthday)
        if (athlete.data?.skatingFrom) setSkatingFrom(athlete.data.skatingFrom)
      }
    } catch (e) {
      console.error('[Dashboard] Failed to load profile:', e)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User'

  const getSkatingAge = () => {
    if (!birthday) return null
    const birthDate = new Date(birthday)
    const now = new Date()
    const currentYear = now.getFullYear()
    const julyFirstThisYear = new Date(currentYear, 6, 1)
    const birthMonth = birthDate.getMonth()
    const birthDay = birthDate.getDate()
    let seasonStartYear = currentYear
    if (now < julyFirstThisYear) {
      seasonStartYear = currentYear - 1
    }
    const bornBeforeJuly1 = (birthMonth < 6) || (birthMonth === 6 && birthDay < 1)
    if (bornBeforeJuly1) {
      return seasonStartYear - birthDate.getFullYear()
    } else {
      return seasonStartYear - birthDate.getFullYear() - 1
    }
  }

  const skatingAge = getSkatingAge()

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

  useEffect(() => {
    if (!user) return
    loadSessions()
  }, [user])

  const loadSessions = async () => {
    setError('')
    if (!user) return
    setLoading(true)
    try {
      const all = await sessionService.list(user.uid, 'date')
      setSessions(all)
    } catch (e) {
      setError('Failed to load dashboard data. Check your connection or Firebase config.')
      console.error('[Dashboard] Failed to load:', e)
    } finally {
      setLoading(false)
    }
  }

  const weekStart = useMemo(() => getWeekStart(new Date().toISOString().slice(0, 10)), [])

  const weekSessions = useMemo(
    () => sessions.filter(s => isDateInWeek(s.data.date || s.data.createdAt?.slice(0, 10), weekStart)),
    [sessions, weekStart],
  )

  const totalTrainingMinutes = useMemo(
    () => weekSessions.reduce((sum, s) => sum + (s.data.durationMinutes || 0), 0),
    [weekSessions],
  )

  const recentSessions = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => {
      const da = (b.data.date || b.data.createdAt || '').slice(0, 10)
      const db2 = (a.data.date || a.data.createdAt || '').slice(0, 10)
      return db2.localeCompare(da)
    })
    return sorted.slice(0, 5)
  }, [sessions])

  const sessionDates = useMemo(
    () => sessions.map(s => (s.data.date || s.data.createdAt || '').slice(0, 10)),
    [sessions],
  )

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T00:00:00')
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return dayNames[d.getDay()]
  }

  const getRelativeDay = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diff = Math.round((today - d) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="p-4 space-y-6">
      {/* User Card */}
      <div
        onClick={() => navigate('/settings')}
        className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:border-indigo-200 transition-colors"
      >
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
          </div>
          <Settings className="w-5 h-5 text-gray-400 shrink-0" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-indigo-500" />
            <span className="text-xs text-gray-500 font-medium">This Week</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{weekSessions.length}</p>
          <p className="text-xs text-gray-400">sessions</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-gray-500 font-medium">Hours</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{(totalTrainingMinutes / 60).toFixed(1)}</p>
          <p className="text-xs text-gray-400">total time</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-gray-500 font-medium">Streak</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{calcStreak(sessionDates)}</p>
          <p className="text-xs text-gray-400">day streak</p>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map(({ path, label, desc, icon: Icon, color }) => (
            <Link
              key={path}
              to={path}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`${color} p-2 rounded-lg`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">{label}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h2>
        {loading ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-gray-400">Loading...</p>
          </div>
        ) : recentSessions.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {recentSessions.map((session) => {
              const s = session.data
              const dateStr = s.date || s.createdAt?.slice(0, 10)
              return (
                <div key={session.docId} className="p-4 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {s.sessionLabel || `${s.sessionType.charAt(0).toUpperCase() + s.sessionType.slice(1)} Session`}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {s.focusTags && s.focusTags.length > 0
                        ? s.focusTags.map(t => `#${t}`).join(', ')
                        : s.notes || 'No details'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">{getRelativeDay(dateStr)}</p>
                    <p className="text-xs text-gray-400">{formatDateLabel(dateStr)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-400">No sessions logged yet. Start your journey!</p>
          </div>
        )}
      </div>
    </div>
  )
}
