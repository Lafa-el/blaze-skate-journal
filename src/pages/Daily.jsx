import { useState, useEffect } from 'react'
import { Calendar, Save, CheckCircle, Clock } from 'lucide-react'
import { journalService } from '../services/journalService'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../i18n'

export default function Daily() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadError, setLoadError] = useState(null)

  // Form state — matches journal_day schema
  const [form, setForm] = useState({
    location: '',
    dayType: 'training',
    overallFeeling: 3,
    parentNote: '',
    lindsayReflection: {
      bestThing: '',
      needsWork: '',
      tomorrowFocus: '',
    },
    isCompleted: false,
  })

  function resetForm() {
    setForm({
      location: '',
      dayType: 'training',
      overallFeeling: 3,
      parentNote: '',
      lindsayReflection: { bestThing: '', needsWork: '', tomorrowFocus: '' },
      isCompleted: false,
    })
  }

  // Load existing journal_day when date changes
  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoadError(null)
      try {
        const existing = await journalService.getByDate(date, user.uid)
        if (existing) {
          const d = existing.data
          setForm({
            location: d.location || '',
            dayType: d.dayType || 'training',
            overallFeeling: d.overallFeeling ?? 3,
            parentNote: d.parentNote || '',
            lindsayReflection: {
              bestThing: d.lindsayReflection?.bestThing || '',
              needsWork: d.lindsayReflection?.needsWork || '',
              tomorrowFocus: d.lindsayReflection?.tomorrowFocus || '',
            },
            isCompleted: d.isCompleted || false,
          })
        } else {
          resetForm()
        }
      } catch {
        setLoadError(t('daily.failedLoadJournal'))
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, date])

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const updateReflection = (field, value) =>
    setForm(prev => ({
      ...prev,
      lindsayReflection: { ...prev.lindsayReflection, [field]: value },
    }))

  const handleSave = async () => {
    if (!user) return
    setLoading(true)
    setSaved(false)
    try {
      await journalService.save({ ...form, date, updatedAt: new Date().toISOString() }, user.uid)
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
    setLoading(true)
    try {
      const existing = await journalService.getByDate(date, user.uid)
      const data = existing ? existing.data : {}
      await journalService.save({ ...form, isCompleted: !data.isCompleted, date }, user.uid)
      setForm(prev => ({ ...prev, isCompleted: !data.isCompleted }))
    } catch {
      setLoadError(t('daily.failedUpdateComplete'))
    } finally {
      setLoading(false)
    }
  }

  const feelingOptions = [1, 2, 3, 4, 5]
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
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2.5"
        />
      </div>

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
          {t('common.success')}
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
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? t('common.saving') : t('daily.saveDailyLog')}
        </button>

        <button
          onClick={handleComplete}
          disabled={loading}
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
