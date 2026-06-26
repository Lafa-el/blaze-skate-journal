import { useState, useEffect, useCallback } from 'react'
import {
  Tent, Users, Calendar, Clock, Target,
  Flame, Trophy, ChevronRight,
  Dumbbell, Activity, Star,
} from 'lucide-react'
import { aggregateCampStats } from '../services/summerCampService'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../i18n'
import { isValidDateRange, isValidDateString } from '../utils/dateUtils'

function formatTime(totalSeconds) {
  if (!totalSeconds || totalSeconds === '--') return '--'
  const mins = Math.floor(totalSeconds / 60)
  const secs = (totalSeconds % 60).toFixed(2)
  return mins > 0 ? `${mins}:${secs.padStart(5, '0')}` : `${secs}s`
}

function formatDate(dateStr, locale) {
  if (!dateStr) return ''
  if (!isValidDateString(dateStr)) return dateStr
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
}

const STORAGE_KEY = 'summer_camp_dates'

function loadSavedDates() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const { start, end } = JSON.parse(saved)
      if (start && end) return { start, end }
    }
  } catch {
    // ignore
  }
  return null
}

export default function SummerCamp() {
  const { user } = useAuth()
  const { lang, t } = useLanguage()
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US'
  const uid = user?.uid
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [campData, setCampData] = useState(null)
  const [editDates, setEditDates] = useState(false)

  const savedDates = loadSavedDates()
  const [campStart, setCampStart] = useState(savedDates?.start || '2026-06-15')
  const [campEnd, setCampEnd] = useState(savedDates?.end || '2026-07-10')
  const [tempStart, setTempStart] = useState(savedDates?.start || '2026-06-15')
  const [tempEnd, setTempEnd] = useState(savedDates?.end || '2026-07-10')

  // Persist camp dates whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ start: campStart, end: campEnd }))
    } catch {
      // ignore storage errors
    }
  }, [campStart, campEnd])

  const loadStats = useCallback(async () => {
    setError('')
    if (!uid || !campStart || !campEnd) return
    setLoading(true)
    try {
      const stats = await aggregateCampStats(campStart, campEnd, uid)
      setCampData(stats)
    } catch (e) {
      setError(t('summerCamp.failedLoad'))
      console.error('[SummerCamp] Failed to load:', e)
    } finally {
      setLoading(false)
    }
  }, [campEnd, campStart, t, uid])

  // Load stats
  useEffect(() => {
    loadStats()
  }, [loadStats])

  const handleSaveDates = () => {
    if (!isValidDateString(tempStart) || !isValidDateString(tempEnd) || !isValidDateRange(tempStart, tempEnd)) {
      setError(t('summerCamp.invalidDateRange'))
      return
    }
    setError('')
    setCampStart(tempStart)
    setCampEnd(tempEnd)
    setEditDates(false)
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('summerCamp.title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {campStart && campEnd ? `${formatDate(campStart, locale)} — ${formatDate(campEnd, locale)}` : ''}
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Camp Date Range */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Tent className="w-6 h-6" />
          <div>
            <h2 className="text-lg font-bold">{t('summerCamp.campBanner')}</h2>
            <p className="text-sm text-indigo-200">{t('summerCamp.trackProgress')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          {editDates ? (
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={tempStart}
                onChange={(e) => setTempStart(e.target.value)}
                placeholder={t('common.datePlaceholder')}
                className="flex-1 px-3 py-2 rounded-lg bg-white/20 text-white text-sm border border-white/30 placeholder-white/60"
              />
              <span className="text-white/70">{t('summerCamp.to')}</span>
              <input
                type="text"
                inputMode="numeric"
                value={tempEnd}
                onChange={(e) => setTempEnd(e.target.value)}
                placeholder={t('common.datePlaceholder')}
                className="flex-1 px-3 py-2 rounded-lg bg-white/20 text-white text-sm border border-white/30 placeholder-white/60"
              />
              <button
                onClick={handleSaveDates}
                className="px-3 py-2 bg-white text-indigo-600 rounded-lg text-sm font-medium"
              >
                {t('common.save')}
              </button>
              <button
                onClick={() => {
                  setEditDates(false)
                  setTempStart(campStart)
                  setTempEnd(campEnd)
                }}
                className="px-3 py-2 bg-white/20 text-white rounded-lg text-sm"
              >
                {t('common.cancel')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setTempStart(campStart)
                setTempEnd(campEnd)
                setEditDates(true)
              }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              <Calendar className="w-4 h-4" />
              {campStart && campEnd ? `${formatDate(campStart, locale)} — ${formatDate(campEnd, locale)}` : t('summerCamp.subtitle')}
            </button>
          )}
        </div>

        {/* Day Progress */}
        {campStart && campEnd && (
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-indigo-200">{t('summerCamp.campProgress')}</span>
              <span className="text-xs font-medium">
                {campData ? `${campData.daysTrained} ${t('summerCamp.trainingDays')}` : t('common.loading')}
              </span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              {campData && (
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((campData.daysTrained / campData.totalCampDays) * 100, 100)}%`,
                  }}
                />
              )}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-indigo-200">{t('summerCamp.day')} 1</span>
              <span className="text-[10px] text-indigo-200">{t('summerCamp.day')} {campData?.totalCampDays || 0}</span>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8 text-gray-400">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm">{t('summerCamp.loading')}</p>
        </div>
      )}

      {!loading && campData && (
        <>
          {/* Session Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Target className="w-4 h-4 text-indigo-500" />
                <span className="text-[10px] text-gray-500 font-medium uppercase">{t('summerCamp.ice')}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{campData.iceSessions}</p>
              <p className="text-[10px] text-gray-400">{campData.daysWithRecords} {t('summerCamp.withRecords')}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Dumbbell className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] text-gray-500 font-medium uppercase">{t('summerCamp.dryland')}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{campData.drylandSessions}</p>
              <p className="text-[10px] text-gray-400">{campData.daysTrained} {t('summerCamp.daysTrained')}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Users className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] text-gray-500 font-medium uppercase">{t('summerCamp.private')}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{campData.privateLessons}</p>
              <p className="text-[10px] text-gray-400">{t('summerCamp.lessons')}</p>
            </div>
          </div>

          {/* Total Minutes */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-violet-500" />
              <span className="text-sm text-gray-500">{t('summerCamp.totalMinutes')}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {campData.totalTrainingMinutes.toLocaleString()}
            </p>
          </div>

          {/* PB Changes */}
          {campData.pbChanges.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h2 className="font-semibold text-gray-900">{t('summerCamp.pbChanges')}</h2>
              </div>
              <div className="space-y-2">
                {campData.pbChanges.map((pb) => (
                  <div
                    key={pb.event}
                    className={`flex items-center justify-between p-2.5 rounded-lg ${
                      pb.changed ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{pb.event}</span>
                      {pb.changed && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                          {t('summerCamp.newPb')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">{pb.before}</span>
                      <ChevronRight className="w-3 h-3 text-gray-300" />
                      <span className={`font-semibold ${pb.changed ? 'text-amber-600' : 'text-gray-700'}`}>
                        {formatTime(pb.after)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* High-Frequency Technical Issues */}
          {campData.highFreqTechIssues.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-red-500" />
                <h2 className="font-semibold text-gray-900">{t('summerCamp.highFreqIssues')}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {campData.highFreqTechIssues.map((item) => (
                  <span
                    key={item.tag}
                    className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-full font-medium"
                  >
                    #{item.tag} <span className="text-red-500">({item.count})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Milestones */}
          {campData.campMilestones.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-yellow-500" />
                <h2 className="font-semibold text-gray-900">{t('summerCamp.milestones')}</h2>
              </div>
              <div className="space-y-3">
                {campData.campMilestones.map((milestone) => (
                  <div key={milestone.docId} className="border-l-2 border-yellow-200 pl-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(milestone.data.date)}</span>
                      {milestone.data.category && (
                        <>
                          <span>·</span>
                          <span className="font-medium text-gray-600">{milestone.data.category}</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900">{milestone.data.title || milestone.data.name || milestone.data.description || t('common.untitled')}</p>
                    {milestone.data.description && milestone.data.title && (
                      <p className="text-xs text-gray-500 mt-0.5">{milestone.data.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!campData.iceSessions && !campData.drylandSessions && !campData.privateLessons &&
           !campData.pbChanges.length && !campData.highFreqTechIssues.length && !campData.campMilestones.length && (
            <div className="text-center py-8 text-gray-400">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('summerCamp.noCampData')}</p>
              <p className="text-xs text-gray-300 mt-1">{t('summerCamp.startLogging')}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
