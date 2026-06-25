import { useState, useEffect, useCallback, useMemo } from 'react'
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { sessionService } from '../services/sessionService'
import { journalService } from '../services/journalService'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../i18n'
import {
  buildCalendarDaySummary,
  summarizeDailyLogsByDate,
  summarizeSessionsByDate,
} from '../utils/journalAggregations'

export default function Calendar() {
  const { user } = useAuth()
  const { lang, t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessions, setSessions] = useState([])
  const [journalDays, setJournalDays] = useState([])
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() } // month is 0-indexed
  })
  const [selectedDate, setSelectedDate] = useState(null)

  const monthNames = t('calendar.monthNames')
  const dayNames = t('calendar.dayNames')

  // Load sessions for the current month
  const loadMonthData = useCallback(async () => {
    setError('')
    if (!user) return
    setLoading(true)
    try {
      const [allSessions, allJournalDays] = await Promise.all([
        sessionService.list(user.uid, 'date', 100),
        journalService.list(user.uid, 'date', 100),
      ])
      // Filter to sessions within the displayed month
      const { year, month } = currentMonth
      const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const nextMonth = month === 11 ? `${year + 1}-01-01` : `${year}-${String(month + 2).padStart(2, '0')}-01`

      const monthSessions = allSessions.filter(s => {
        const d = s.data.date || s.data.createdAt?.slice(0, 10)
        return d >= monthStart && d < nextMonth
      })
      const monthJournalDays = allJournalDays.filter(day => {
        const d = day.data.date || day.data.createdAt?.slice(0, 10)
        return d >= monthStart && d < nextMonth
      })
      // Sort by date ascending for display
      monthSessions.sort((a, b) => (a.data.date || '').localeCompare(b.data.date || ''))
      monthJournalDays.sort((a, b) => (a.data.date || '').localeCompare(b.data.date || ''))
      setSessions(monthSessions)
      setJournalDays(monthJournalDays)
    } catch (e) {
      setError(t('calendar.failedLoad'))
      console.error('[Calendar] Failed to load:', e)
    } finally {
      setLoading(false)
    }
  }, [currentMonth, t, user])

  useEffect(() => {
    loadMonthData()
  }, [loadMonthData])

  const goToPrevMonth = () => {
    const { year, month } = currentMonth
    if (month === 0) {
      setCurrentMonth({ year: year - 1, month: 11 })
    } else {
      setCurrentMonth(prev => ({ ...prev, month: prev.month - 1 }))
    }
    setSelectedDate(null)
  }

  const goToNextMonth = () => {
    const { year, month } = currentMonth
    if (month === 11) {
      setCurrentMonth({ year: year + 1, month: 0 })
    } else {
      setCurrentMonth(prev => ({ ...prev, month: prev.month + 1 }))
    }
    setSelectedDate(null)
  }

  // Build calendar grid for the month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay()
  }

  const daysInMonth = getDaysInMonth(currentMonth.year, currentMonth.month)
  const firstDay = getFirstDayOfMonth(currentMonth.year, currentMonth.month)

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  const sessionsByDate = useMemo(() => summarizeSessionsByDate(sessions), [sessions])
  const journalDaysByDate = useMemo(() => summarizeDailyLogsByDate(journalDays), [journalDays])

  // Sessions for selected date
  const selectedDateSessions = selectedDate ? (sessionsByDate[selectedDate] || []) : []
  const selectedDateSummary = selectedDate
    ? buildCalendarDaySummary({ date: selectedDate, days: journalDays, sessions })
    : null

  // Session type colors
  const sessionTypeColor = (type) => {
    const colors = {
      ice: 'bg-indigo-100 text-indigo-700',
      dryland: 'bg-emerald-100 text-emerald-700',
      private_lesson: 'bg-amber-100 text-amber-700',
      competition: 'bg-red-100 text-red-700',
      recovery: 'bg-cyan-100 text-cyan-700',
      rest: 'bg-gray-100 text-gray-700',
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('calendar.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {monthNames[currentMonth.month]} {currentMonth.year}
          </p>
        </div>
        {/* Error Banner */}
        {error && (
          <div className="col-span-2 mt-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={goToPrevMonth}
            className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Mini Calendar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {dayNames.map(d => (
            <span key={d} className="text-xs font-medium text-gray-400 py-1">{d}</span>
          ))}
        </div>
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Empty cells for days before the 1st */}
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} className="text-sm py-2" />
          ))}
          {/* Day cells */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dateStr = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const isToday = dateStr === todayStr
            const hasSession = sessionsByDate[dateStr] && sessionsByDate[dateStr].length > 0
            const hasDaily = Boolean(journalDaysByDate[dateStr])
            const isSelected = dateStr === selectedDate
            return (
              <button
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={`text-sm py-2 rounded-lg transition-colors ${
                  isToday
                    ? 'bg-primary text-white font-bold'
                    : isSelected
                      ? 'bg-indigo-100 text-indigo-700 font-bold ring-2 ring-indigo-300'
                      : hasSession || hasDaily
                        ? 'bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100'
                        : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {day}
                {(hasSession || hasDaily) && !isToday && (
                  <span className="mt-0.5 flex justify-center gap-0.5">
                    {hasDaily && <span className="block w-1 h-1 bg-emerald-400 rounded-full" />}
                    {hasSession && <span className="block w-1 h-1 bg-indigo-400 rounded-full" />}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Date Detail */}
      {selectedDate && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">{formatDateLabel(selectedDate)}</h2>
          {selectedDateSummary && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">{t('calendar.dailyStatus')}</p>
                  <p className="font-semibold text-gray-900">
                    {selectedDateSummary.hasDaily
                      ? selectedDateSummary.dailyCompleted
                        ? t('calendar.dailyCompleted')
                        : t('calendar.dailyStarted')
                      : t('calendar.noDaily')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t('calendar.sessions')}</p>
                  <p className="font-semibold text-gray-900">
                    {selectedDateSummary.sessionCount} · {selectedDateSummary.totalTrainingMinutes} {t('common.minutes')}
                  </p>
                </div>
              </div>
              {selectedDateSummary.sessionTypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {selectedDateSummary.sessionTypes.map((type) => (
                    <span key={type} className={`text-xs font-medium px-2.5 py-1 rounded-full ${sessionTypeColor(type)}`}>
                      {t(`sessions.sessionTypeOptions.${type}`)}
                    </span>
                  ))}
                </div>
              )}
              {selectedDateSummary.focusSummary.length > 0 && (
                <p className="text-xs text-gray-500 mt-3">
                  {t('calendar.focusSummary')}: {selectedDateSummary.focusSummary.join(' · ')}
                </p>
              )}
            </div>
          )}
          {selectedDateSessions.length > 0 ? (
            <div className="space-y-3">
              {selectedDateSessions.map((session) => {
                const s = session.data
                return (
                  <div
                    key={session.docId}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {s.sessionLabel || `${t(`sessions.sessionTypeOptions.${s.sessionType}`)} ${t('calendar.session')}`}
                        </p>
                        {s.coachName && (
                          <p className="text-sm text-gray-500">{s.coachName}</p>
                        )}
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sessionTypeColor(s.sessionType)}`}>
                        {t(`sessions.sessionTypeOptions.${s.sessionType}`)}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-sm text-gray-600">
                      {s.durationMinutes && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>{s.durationMinutes} {t('common.minutes')}</span>
                        </div>
                      )}
                      {s.focusTags && s.focusTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {s.focusTags.map((tag) => (
                            <span key={tag} className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {s.notes && (
                        <p className="text-xs text-gray-500 mt-1">{s.notes}</p>
                      )}
                    </div>

                    {s.intensity && (
                      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1">
                        <span className="text-xs text-gray-400">{t('common.intensity')}:</span>
                        {Array.from({ length: 5 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < s.intensity ? 'bg-primary' : 'bg-gray-200'
                            }`}
                          />
                        ))}
                        <span className="text-xs text-gray-400 ml-1">{s.intensity}/5</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('calendar.noSessionsForDay')}</p>
            </div>
          )}
        </div>
      )}

      {/* All Sessions List for the Month */}
      {!selectedDate && sessions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {t('calendar.sessionsThisMonth')} ({sessions.length})
          </h2>
          <div className="space-y-3">
            {sessions.map((session) => {
              const s = session.data
              return (
                <div
                  key={session.docId}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{s.date}</p>
                      <p className="text-sm text-gray-500">
                        {s.sessionLabel || t(`sessions.sessionTypeOptions.${s.sessionType}`)}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sessionTypeColor(s.sessionType)}`}>
                      {t(`sessions.sessionTypeOptions.${s.sessionType}`)}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-sm text-gray-600">
                    {s.durationMinutes && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{s.durationMinutes} {t('common.minutes')}</span>
                      </div>
                    )}
                    {s.coachName && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{s.coachName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8 text-gray-400">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm">{t('calendar.loading')}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && sessions.length === 0 && journalDays.length === 0 && !selectedDate && (
        <div className="text-center py-8 text-gray-400">
          <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('calendar.noSessionsForMonth')} {monthNames[currentMonth.month]} {currentMonth.year}</p>
          <p className="text-xs text-gray-300 mt-1">{t('calendar.startLogging')}</p>
        </div>
      )}
    </div>
  )
}
