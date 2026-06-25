import { useState, useEffect, useCallback } from 'react'
import { Plus, Clock, Calendar, ChevronLeft, ChevronRight, Trash2, Edit3 } from 'lucide-react'
import { sessionService } from '../services/sessionService'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../i18n'
import { isValidDateString } from '../utils/dateUtils'

const sessionTypeKeys = ['ice', 'dryland', 'private_lesson', 'competition', 'recovery', 'rest']

const intensityLevels = [1, 2, 3, 4, 5]
const defaultFocusTags = [
  'start', '500m', '1000m', '1500m', 'corner_entry',
  'corner_drift', 'follow_skating', 'footwork', 'edges',
  'jumps', 'spins', 'program', 'speed_work', 'endurance',
]

const shortTrackBooleanFields = [
  'startsPractice',
  'cornerFocus',
  'straightawayFocus',
  'relayPractice',
  'raceSimulation',
]

function createDefaultSessionForm(date) {
  return {
    date,
    sessionType: 'ice',
    sessionLabel: '',
    location: '',
    durationMinutes: '',
    intensity: 3,
    focusTags: [],
    coachName: '',
    notes: '',
    iceTimeMinutes: '',
    drylandMinutes: '',
    technicalFocus: '',
    mainSet: '',
    startsPractice: false,
    cornerFocus: false,
    straightawayFocus: false,
    relayPractice: false,
    raceSimulation: false,
    lapTimesNote: '',
    equipmentNote: '',
    recoveryNote: '',
  }
}

function sessionFormFromData(data = {}, selectedDate) {
  return {
    ...createDefaultSessionForm(data.date || selectedDate),
    date: data.date || selectedDate,
    sessionType: data.sessionType || 'ice',
    sessionLabel: data.sessionLabel || '',
    location: data.location || '',
    durationMinutes: data.durationMinutes ?? '',
    intensity: data.intensity ?? 3,
    focusTags: data.focusTags || [],
    coachName: data.coachName || '',
    notes: data.notes || '',
    iceTimeMinutes: data.iceTimeMinutes ?? '',
    drylandMinutes: data.drylandMinutes ?? '',
    technicalFocus: data.technicalFocus || '',
    mainSet: data.mainSet || '',
    startsPractice: Boolean(data.startsPractice),
    cornerFocus: Boolean(data.cornerFocus),
    straightawayFocus: Boolean(data.straightawayFocus),
    relayPractice: Boolean(data.relayPractice),
    raceSimulation: Boolean(data.raceSimulation),
    lapTimesNote: data.lapTimesNote || '',
    equipmentNote: data.equipmentNote || '',
    recoveryNote: data.recoveryNote || '',
  }
}

export default function Sessions() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [sessions, setSessions] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const selectedDateIsValid = isValidDateString(selectedDate)

  // Form state
  const [form, setForm] = useState(() => createDefaultSessionForm(new Date().toISOString().slice(0, 10)))
  const formDateIsValid = isValidDateString(form.date)

  const getSessionTypeLabel = (sessionType) => {
    const key = sessionType || 'ice'
    const label = t(`sessions.sessionTypeOptions.${key}`)
    return label === `sessions.sessionTypeOptions.${key}` ? key.replace(/_/g, ' ') : label
  }

  const loadSessions = useCallback(async (dateOverride = selectedDate) => {
    if (!user || !isValidDateString(dateOverride)) {
      setSessions([])
      return
    }
    setError('')
    setLoadingSessions(true)
    try {
      const all = await sessionService.list(user.uid, 'date')
      const filtered = all.filter(s => s.data.date === dateOverride)
      setSessions(filtered)
    } catch (e) {
      setError(t('sessions.failedLoadSessions'))
      console.error('[Sessions] Failed to load:', e)
    } finally {
      setLoadingSessions(false)
    }
  }, [selectedDate, t, user])

  // Load sessions for selected date
  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const resetForm = (date = selectedDate) => {
    setForm(createDefaultSessionForm(date))
    setEditId(null)
    setShowForm(false)
  }

  const startEdit = (session) => {
    setError('')
    setStatus('')
    setForm(sessionFormFromData(session.data, selectedDate))
    setEditId(session.docId)
    setShowForm(true)
  }

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const toggleFocusTag = (tag) => {
    setForm(prev => ({
      ...prev,
      focusTags: prev.focusTags.includes(tag)
        ? prev.focusTags.filter(t => t !== tag)
        : [...prev.focusTags, tag],
    }))
  }

  const toggleBooleanField = (field) => {
    setForm(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handleSave = async () => {
    if (!user) return
    if (!formDateIsValid) {
      setError(t('sessions.invalidDate'))
      return
    }
    setSaving(true)
    setError('')
    setStatus('')
    try {
      const data = {
        ...form,
      }
      if (editId) {
        await sessionService.update(editId, data, user.uid)
      } else {
        await sessionService.create(data, user.uid)
      }
      setStatus(editId ? t('sessions.sessionUpdated') : t('sessions.sessionSaved'))
      setSelectedDate(form.date)
      resetForm(form.date)
      await loadSessions(form.date)
    } catch (e) {
      setError(t('sessions.failedSaveSession'))
      console.error('[Sessions] Failed to save:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (docId) => {
    if (!user) return
    setDeleting(true)
    setError('')
    setStatus('')
    try {
      await sessionService.delete(docId, user.uid)
      setDeleteConfirm(null)
      setStatus(t('sessions.sessionDeleted'))
      await loadSessions()
    } catch (e) {
      setError(t('sessions.failedDeleteSession'))
      console.error('[Sessions] Failed to delete:', e)
    } finally {
      setDeleting(false)
    }
  }

  const goToPrevDay = () => {
    if (!selectedDateIsValid) {
      setError(t('sessions.invalidDate'))
      return
    }
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() - 1)
    setSelectedDate(d.toISOString().slice(0, 10))
  }

  const goToNextDay = () => {
    if (!selectedDateIsValid) {
      setError(t('sessions.invalidDate'))
      return
    }
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() + 1)
    setSelectedDate(d.toISOString().slice(0, 10))
  }

  const formatDate = (dateStr) => {
    if (!isValidDateString(dateStr)) return dateStr
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.data.durationMinutes || 0), 0)

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('sessions.title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('sessions.subtitle')}</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {status && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
          {status}
        </div>
      )}

      {/* Date Navigator */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <button onClick={goToPrevDay} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="font-semibold text-gray-900">{formatDate(selectedDate)}</h2>
          <button onClick={goToNextDay} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="mb-3">
          <label className="text-xs font-medium text-gray-500 mb-1 block">{t('sessions.date')}</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={10}
            pattern="\d{4}-\d{2}-\d{2}"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            placeholder={t('sessions.datePlaceholder')}
            className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
          />
          <p className={`text-xs mt-1 ${selectedDateIsValid ? 'text-gray-400' : 'text-red-500'}`}>
            {selectedDateIsValid ? t('sessions.dateHelp') : t('sessions.invalidDate')}
          </p>
        </div>

        {/* Day Summary */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {totalMinutes} {t('common.minutes')}
          </span>
          <span>{sessions.length} {t('common.sessions')}</span>
        </div>
      </div>

      {loadingSessions && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
          {t('sessions.loadingSessions')}
        </div>
      )}

      {/* Session List */}
      {!loadingSessions && sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map((session) => {
            const s = session.data
            return (
              <div key={session.docId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {s.sessionLabel || `${getSessionTypeLabel(s.sessionType)} ${t('common.session')}`}
                      </h3>
                      {s.coachName && (
                        <p className="text-sm text-gray-500 mt-0.5">{s.coachName}</p>
                      )}
                      {s.location && (
                        <p className="text-xs text-gray-400 mt-0.5">{s.location}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(session)}
                        className="p-1.5 rounded-lg hover:bg-gray-100"
                      >
                        <Edit3 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(session.docId)}
                        className="p-1.5 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
                      {getSessionTypeLabel(s.sessionType)}
                    </span>
                    {s.intensity && (
                      <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium">
                        {t('common.intensity')}: {s.intensity}/5
                      </span>
                    )}
                    {s.durationMinutes && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                        {s.durationMinutes} {t('common.minutes')}
                      </span>
                    )}
                    {s.iceTimeMinutes > 0 && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                        {t('sessions.iceTimeMinutes')}: {s.iceTimeMinutes}
                      </span>
                    )}
                    {s.drylandMinutes > 0 && (
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                        {t('sessions.drylandMinutes')}: {s.drylandMinutes}
                      </span>
                    )}
                  </div>

                  {(s.focusTags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(s.focusTags || []).map((tag) => (
                        <span key={tag} className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {(s.technicalFocus || s.mainSet) && (
                    <div className="text-sm text-gray-600 mb-2 space-y-1">
                      {s.technicalFocus && <p>{t('sessions.technicalFocus')}: {s.technicalFocus}</p>}
                      {s.mainSet && <p>{t('sessions.mainSet')}: {s.mainSet}</p>}
                    </div>
                  )}

                  {s.notes && (
                    <p className="text-sm text-gray-600">{s.notes}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loadingSessions && sessions.length === 0 && !showForm && selectedDateIsValid && (
        <div className="text-center py-8 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('sessions.noSessionsForDay')}</p>
        </div>
      )}

      {/* Add Session Button / Form */}
      {showForm ? (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-semibold text-gray-900">
            {editId ? t('sessions.editSession') : t('sessions.addSession')}
          </h3>

          {editId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              {t('sessions.editingSession')}
            </div>
          )}

          {/* Session Date */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('sessions.date')}</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              pattern="\d{4}-\d{2}-\d{2}"
              value={form.date}
              onChange={(e) => updateField('date', e.target.value)}
              placeholder={t('sessions.datePlaceholder')}
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
            />
            {!formDateIsValid && (
              <p className="text-xs text-red-500 mt-1">{t('sessions.invalidDate')}</p>
            )}
          </div>

          {/* Session Type */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('sessions.sessionType')}</label>
            <div className="grid grid-cols-3 gap-1.5">
              {sessionTypeKeys.map((key) => (
                <button
                  key={key}
                  onClick={() => updateField('sessionType', key)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    form.sessionType === key
                      ? 'bg-primary text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {t(`sessions.sessionTypeOptions.${key}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Session Label */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('sessions.sessionLabel')}</label>
            <input
              type="text"
              value={form.sessionLabel}
              onChange={(e) => updateField('sessionLabel', e.target.value)}
              placeholder={t('sessions.sessionLabelPlaceholder')}
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('sessions.location')}</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder={t('sessions.locationPlaceholder')}
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('sessions.duration')}</label>
            <input
              type="number"
              value={form.durationMinutes}
              onChange={(e) => updateField('durationMinutes', e.target.value)}
              placeholder={t('sessions.durationPlaceholder')}
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
            />
          </div>

          {/* Short Track Minutes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">{t('sessions.iceTimeMinutes')}</label>
              <input
                type="number"
                value={form.iceTimeMinutes}
                onChange={(e) => updateField('iceTimeMinutes', e.target.value)}
                placeholder={t('sessions.minutesPlaceholder')}
                className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">{t('sessions.drylandMinutes')}</label>
              <input
                type="number"
                value={form.drylandMinutes}
                onChange={(e) => updateField('drylandMinutes', e.target.value)}
                placeholder={t('sessions.minutesPlaceholder')}
                className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
              />
            </div>
          </div>

          {/* Intensity */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('sessions.intensity')}</label>
            <div className="flex gap-1.5">
              {intensityLevels.map((n) => (
                <button
                  key={n}
                  onClick={() => updateField('intensity', n)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    form.intensity === n
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Short Track Details */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('sessions.technicalFocus')}</label>
            <input
              type="text"
              value={form.technicalFocus}
              onChange={(e) => updateField('technicalFocus', e.target.value)}
              placeholder={t('sessions.technicalFocusPlaceholder')}
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('sessions.mainSet')}</label>
            <input
              type="text"
              value={form.mainSet}
              onChange={(e) => updateField('mainSet', e.target.value)}
              placeholder={t('sessions.mainSetPlaceholder')}
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">{t('sessions.shortTrackDetails')}</label>
            <div className="grid grid-cols-2 gap-2">
              {shortTrackBooleanFields.map((field) => (
                <label
                  key={field}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
                    form[field]
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(form[field])}
                    onChange={() => toggleBooleanField(field)}
                    className="accent-indigo-600"
                  />
                  {t(`sessions.booleanFields.${field}`)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('sessions.lapTimesNote')}</label>
            <textarea
              value={form.lapTimesNote}
              onChange={(e) => updateField('lapTimesNote', e.target.value)}
              placeholder={t('sessions.lapTimesNotePlaceholder')}
              rows={2}
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('sessions.equipmentNote')}</label>
            <textarea
              value={form.equipmentNote}
              onChange={(e) => updateField('equipmentNote', e.target.value)}
              placeholder={t('sessions.equipmentNotePlaceholder')}
              rows={2}
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('sessions.recoveryNote')}</label>
            <textarea
              value={form.recoveryNote}
              onChange={(e) => updateField('recoveryNote', e.target.value)}
              placeholder={t('sessions.recoveryNotePlaceholder')}
              rows={2}
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2 resize-none"
            />
          </div>

          {/* Focus Tags */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('sessions.focusTags')}</label>
            <div className="flex flex-wrap gap-1.5">
              {defaultFocusTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleFocusTag(tag)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    form.focusTags.includes(tag)
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Coach Name */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('sessions.coachName')}</label>
            <input
              type="text"
              value={form.coachName}
              onChange={(e) => updateField('coachName', e.target.value)}
              placeholder={t('sessions.coachNamePlaceholder')}
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('sessions.notes')}</label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder={t('sessions.notesPlaceholder')}
              rows={3}
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !formDateIsValid}
              className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {saving ? t('common.saving') : (editId ? t('common.update') : t('sessions.saveSession'))}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            if (!selectedDateIsValid) {
              setError(t('sessions.invalidDate'))
              return
            }
            setError('')
            setStatus('')
            setForm(createDefaultSessionForm(selectedDate))
            setEditId(null)
            setShowForm(true)
          }}
          disabled={!selectedDateIsValid}
          className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('sessions.addSession')}
        </button>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-900 mb-2">{t('sessions.deleteSession')}</h3>
            <p className="text-sm text-gray-600 mb-4">{t('sessions.deleteSessionConfirm')}</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-lg"
              >
                {deleting ? t('sessions.deletingSession') : t('common.delete')}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg"
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
