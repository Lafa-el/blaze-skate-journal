import { useState, useEffect, useCallback } from 'react'
import { Calendar, Save, CheckCircle, Clock, Battery, Activity, Target, MessageSquare } from 'lucide-react'
import { journalService } from '../services/journalService'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../i18n'
import { isValidDateString } from '../utils/dateUtils'

function createDefaultForm() {
  return {
    location: '',
    dayType: 'training',
    overallFeeling: 3,
    energy: 3,
    soreness: '',
    trainingFocus: '',
    coachFeedback: '',
    parentNote: '',
    lindsayReflection: {
      bestThing: '',
      needsWork: '',
      tomorrowFocus: '',
    },
    isCompleted: false,
  }
}

function formFromJournalData(data = {}) {
  return {
    location: data.location || '',
    dayType: data.dayType || 'training',
    overallFeeling: data.overallFeeling ?? 3,
    energy: data.energy ?? 3,
    soreness: data.soreness || '',
    trainingFocus: data.trainingFocus || '',
    coachFeedback: data.coachFeedback || '',
    parentNote: data.parentNote || '',
    lindsayReflection: {
      bestThing: data.lindsayReflection?.bestThing || '',
      needsWork: data.lindsayReflection?.needsWork || '',
      tomorrowFocus: data.lindsayReflection?.tomorrowFocus || '',
    },
    isCompleted: data.isCompleted || false,
  }
}

export default function Daily() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [entryStatus, setEntryStatus] = useState('idle')

  // Form state — matches journal_day schema
  const [form, setForm] = useState(() => createDefaultForm())

  const dateIsValid = isValidDateString(date)

  const loadEntry = useCallback(async () => {
    if (!user || !dateIsValid) {
      setEntryStatus('idle')
      return
    }

    setLoadError(null)
    setSaved(false)
    setEntryStatus('loading')
    try {
      const existing = await journalService.getByDate(date, user.uid)
      if (existing) {
        setForm(formFromJournalData(existing.data))
        setEntryStatus('loaded')
      } else {
        setForm(createDefaultForm())
        setEntryStatus('empty')
      }
    } catch {
      setEntryStatus('idle')
      setLoadError(t('daily.failedLoadJournal'))
    }
  }, [date, dateIsValid, t, user])

  // Load existing journal_day when date changes
  useEffect(() => {
    loadEntry()
  }, [loadEntry])

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const updateReflection = (field, value) =>
    setForm(prev => ({
      ...prev,
      lindsayReflection: { ...prev.lindsayReflection, [field]: value },
    }))

  const handleSave = async () => {
    if (!user) return
    if (!dateIsValid) {
      setLoadError(t('daily.invalidDate'))
      return
    }
    setLoading(true)
    setSaved(false)
    setLoadError(null)
    try {
      await journalService.save({ ...form, date }, user.uid)
      setEntryStatus('loaded')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setLoadError(t('daily.failedSaveJournal'))
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!user) return
    if (!dateIsValid) {
      setLoadError(t('daily.invalidDate'))
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const existing = await journalService.getByDate(date, user.uid)
      const data = existing ? existing.data : {}
      await journalService.save({ ...form, isCompleted: !data.isCompleted, date }, user.uid)
      setForm(prev => ({ ...prev, isCompleted: !data.isCompleted }))
      setEntryStatus('loaded')
    } catch {
      setLoadError(t('daily.failedUpdateComplete'))
    } finally {
      setLoading(false)
    }
  }

  const feelingOptions = [1, 2, 3, 4, 5]
  const energyOptions = [1, 2, 3, 4, 5]
  const dayTypeOptions = [
    { value: 'training', label: t('daily.training') },
    { value: 'competition', label: t('daily.competition') },
    { value: 'rest', label: t('daily.rest') },
    { value: 'recovery', label: t('daily.recovery') },
  ]

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('daily.title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('daily.subtitle')}</p>
      </div>

      {/* Date Picker */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-indigo-500" />
          <label className="text-sm font-medium text-gray-700">{t('daily.date')}</label>
        </div>
        <input
          type="text"
          inputMode="numeric"
          maxLength={10}
          pattern="\d{4}-\d{2}-\d{2}"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder={t('daily.datePlaceholder')}
          className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2.5"
        />
        <p className={`text-xs mt-2 ${dateIsValid ? 'text-gray-400' : 'text-red-500'}`}>
          {dateIsValid ? t('daily.dateHelp') : t('daily.invalidDate')}
        </p>
      </div>

      {/* Entry Status */}
      {entryStatus === 'loading' && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          {t('daily.loadingEntry')}
        </div>
      )}

      {entryStatus === 'empty' && dateIsValid && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
          {t('daily.noEntryFound')}
        </div>
      )}

      {/* Load Error */}
      {loadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {loadError}
        </div>
      )}

      {/* Save Feedback */}
      {saved && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {t('daily.saved')}
        </div>
      )}

      {/* Day Type */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-3">{t('daily.dayType')}</h2>
        <div className="grid grid-cols-2 gap-2">
          {dayTypeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateField('dayType', opt.value)}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                form.dayType === opt.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-3">{t('daily.location')}</h2>
        <input
          type="text"
          value={form.location}
          onChange={(e) => updateField('location', e.target.value)}
          placeholder={t('daily.locationPlaceholder')}
          className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2.5"
        />
      </div>

      {/* Overall Feeling */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-indigo-500" />
          <h2 className="font-semibold text-gray-900">{t('daily.overallFeeling')}</h2>
        </div>
        <div className="flex gap-2">
          {feelingOptions.map((n) => (
            <button
              key={n}
              onClick={() => updateField('overallFeeling', n)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                form.overallFeeling === n
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">{t('daily.feelingScale')}</p>
      </div>

      {/* Energy */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Battery className="w-4 h-4 text-emerald-500" />
          <h2 className="font-semibold text-gray-900">{t('daily.energy')}</h2>
        </div>
        <div className="flex gap-2">
          {energyOptions.map((n) => (
            <button
              key={n}
              onClick={() => updateField('energy', n)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                form.energy === n
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">{t('daily.energyScale')}</p>
      </div>

      {/* Soreness */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-rose-500" />
          <h2 className="font-semibold text-gray-900">{t('daily.soreness')}</h2>
        </div>
        <textarea
          value={form.soreness}
          onChange={(e) => updateField('soreness', e.target.value)}
          placeholder={t('daily.sorenessPlaceholder')}
          rows={2}
          className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2.5 resize-none"
        />
      </div>

      {/* Training Focus */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-amber-500" />
          <h2 className="font-semibold text-gray-900">{t('daily.trainingFocus')}</h2>
        </div>
        <input
          type="text"
          value={form.trainingFocus}
          onChange={(e) => updateField('trainingFocus', e.target.value)}
          placeholder={t('daily.trainingFocusPlaceholder')}
          className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2.5"
        />
      </div>

      {/* Coach Feedback */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-violet-500" />
          <h2 className="font-semibold text-gray-900">{t('daily.coachFeedback')}</h2>
        </div>
        <textarea
          value={form.coachFeedback}
          onChange={(e) => updateField('coachFeedback', e.target.value)}
          placeholder={t('daily.coachFeedbackPlaceholder')}
          rows={3}
          className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2.5 resize-none"
        />
      </div>

      {/* Parent Note */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-3">{t('daily.parentNote')}</h2>
        <textarea
          value={form.parentNote}
          onChange={(e) => updateField('parentNote', e.target.value)}
          placeholder={t('daily.parentNotePlaceholder')}
          rows={3}
          className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2.5 resize-none"
        />
      </div>

      {/* Lindsay Reflection */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-3">{t('daily.lindsayReflection')}</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('daily.bestThing')}</label>
            <textarea
              value={form.lindsayReflection.bestThing}
              onChange={(e) => updateReflection('bestThing', e.target.value)}
              placeholder={t('daily.bestThingPlaceholder')}
              rows={2}
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2.5 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('daily.needsWork')}</label>
            <textarea
              value={form.lindsayReflection.needsWork}
              onChange={(e) => updateReflection('needsWork', e.target.value)}
              placeholder={t('daily.needsWorkPlaceholder')}
              rows={2}
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2.5 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('daily.tomorrowFocus')}</label>
            <textarea
              value={form.lindsayReflection.tomorrowFocus}
              onChange={(e) => updateReflection('tomorrowFocus', e.target.value)}
              placeholder={t('daily.tomorrowFocusPlaceholder')}
              rows={2}
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2.5 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Complete & Save */}
      <div className="space-y-3">
        <button
          onClick={handleSave}
          disabled={loading || !dateIsValid}
          className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? t('common.saving') : t('daily.saveDailyLog')}
        </button>

        <button
          onClick={handleComplete}
          disabled={loading || !dateIsValid}
          className={`w-full font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 ${
            form.isCompleted
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          {form.isCompleted ? t('common.completed') : t('daily.markCompleted')}
        </button>
      </div>
    </div>
  )
}
