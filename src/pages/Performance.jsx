import { useState, useEffect, useCallback } from 'react'
import { Trophy, Plus, Trash2, ChevronLeft, Target } from 'lucide-react'
import { performanceService } from '../services/performanceService'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../i18n'

const eventTypes = [
  { value: 'single_lap', labelKey: 'performance.eventTypes.singleLap' },
  { value: 'first_lap', labelKey: 'performance.eventTypes.firstLap' },
  { value: '500m', labelKey: 'performance.eventTypes.lap500' },
  { value: '777m', labelKey: 'performance.eventTypes.lap777' },
  { value: '1000m', labelKey: 'performance.eventTypes.lap1000' },
  { value: '1500m', labelKey: 'performance.eventTypes.lap1500' },
  { value: 'relay', labelKey: 'performance.eventTypes.relay' },
]

export default function Performance() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const uid = user?.uid
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [records, setRecords] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Filter by event type
  const [selectedEvent, setSelectedEvent] = useState('all')

  // Form state
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    event: '500m',
    timeSeconds: '',
    context: 'training_test',
    notes: '',
  })

  const loadRecords = useCallback(async () => {
    if (!uid) return
    setError('')
    try {
      const all = await performanceService.list({ metric: selectedEvent !== 'all' ? selectedEvent : undefined }, uid)
      setRecords(all)
    } catch (e) {
      setError(t('performance.failedLoad'))
      console.error('[Performance] Failed to load:', e)
    }
  }, [selectedEvent, t, uid])

  // Load records
  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  const resetForm = () => {
    setForm({
      date: new Date().toISOString().slice(0, 10),
      event: '500m',
      timeSeconds: '',
      context: 'training_test',
      notes: '',
    })
    setEditId(null)
    setShowForm(false)
  }

  const startEdit = (record) => {
    const d = record.data
    setForm({
      date: d.date || new Date().toISOString().slice(0, 10),
      event: d.event || d.metric || '500m',
      timeSeconds: d.timeSeconds ?? d.value ?? '',
      context: d.context || 'training_test',
      notes: d.notes || '',
    })
    setEditId(record.docId)
    setShowForm(true)
  }

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  // Auto-calculate PB: for each event type, find the best (lowest) time
  const calculatePBs = () => {
    const best = {}
    records.forEach(r => {
      const event = r.data.event || r.data.metric
      const time = r.data.timeSeconds ?? r.data.value
      if (!event || !time) return
      if (!best[event] || time < best[event]) {
        best[event] = time
      }
    })
    return best
  }

  const formatTime = (totalSeconds) => {
    if (!totalSeconds) return '--'
    const mins = Math.floor(totalSeconds / 60)
    const secs = (totalSeconds % 60).toFixed(2)
    return mins > 0 ? `${mins}:${secs.padStart(5, '0')}` : `${secs}s`
  }

  const handleSave = async () => {
    if (!uid) return
    setLoading(true)
    try {
      const timeNum = form.timeSeconds ? Number(form.timeSeconds) : 0
      const allRecords = await performanceService.list({}, uid)
      const currentEvent = form.event
      const isPB = timeNum > 0 && allRecords.every(r => {
        const event = r.data.event || r.data.metric
        const time = r.data.timeSeconds ?? r.data.value
        return event !== currentEvent || time >= timeNum
      })

      const data = {
        date: form.date,
        event: form.event,
        timeSeconds: timeNum,
        metric: form.event, // for backward compat
        value: timeNum, // for backward compat
        isPB,
        context: form.context,
        notes: form.notes,
      }

      if (editId) {
        await performanceService.update(editId, data, uid)
      } else {
        await performanceService.create(data, uid)
      }
      resetForm()
      await loadRecords()
    } catch {
      // Error handled silently
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (docId) => {
    if (!uid) return
    try {
      await performanceService.delete(docId, uid)
      setDeleteConfirm(null)
      await loadRecords()
    } catch {
      // Error handled silently
    }
  }

  const pbList = calculatePBs()
  const pbEvents = eventTypes.filter(et => pbList[et.value] !== undefined)

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('performance.title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('performance.subtitle')}</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* PB Highlight */}
      {pbEvents.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5" />
            <h2 className="font-bold text-lg">{t('performance.pb')}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {pbEvents.map((et) => (
              <div key={et.value} className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-indigo-200 font-medium">{t(et.labelKey)}</p>
                <p className="text-xl font-bold">{formatTime(pbList[et.value])}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Type Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedEvent('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedEvent === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('common.all')}
            </button>
        {eventTypes.map((et) => (
          <button
            key={et.value}
            onClick={() => setSelectedEvent(et.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedEvent === et.value
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t(et.labelKey)}
          </button>
        ))}
      </div>

      {/* Records List */}
      {records.length > 0 && (
        <div className="space-y-3">
          {records.map((record) => {
            const r = record.data
            const event = r.event || r.metric
            const time = r.timeSeconds ?? r.value
            const isPB = r.isPB
            return (
              <div key={record.docId} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${isPB ? 'border-amber-300' : 'border-gray-100'}`}>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{event ? event.replace(/_/g, ' ') : t('common.unknown')}</h3>
                        {isPB && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            PB
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{r.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{formatTime(time)}</p>
                      <p className="text-xs text-gray-400">{r.context ? r.context.replace(/_/g, ' ') : ''}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => startEdit(record)}
                        className="p-1.5 rounded-lg hover:bg-gray-100"
                        title={t('common.edit')}
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(record.docId)}
                        className="p-1.5 rounded-lg hover:bg-red-50"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>

                  {r.notes && (
                    <p className="text-sm text-gray-600">{r.notes}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {records.length === 0 && !showForm && (
        <div className="text-center py-8 text-gray-400">
          <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('performance.noRecords')}</p>
        </div>
      )}

      {/* Add Record Button / Form */}
      {showForm ? (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-semibold text-gray-900">
            {editId ? t('performance.editRecord') : t('performance.addRecord')}
          </h3>

          {/* Event Type */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('performance.eventType')}</label>
            <div className="grid grid-cols-2 gap-1.5">
              {eventTypes.map((et) => (
                <button
                  key={et.value}
                  onClick={() => updateField('event', et.value)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    form.event === et.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {t(et.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('performance.time')}</label>
            <input
              type="number"
              value={form.timeSeconds}
              onChange={(e) => updateField('timeSeconds', e.target.value)}
              placeholder={t('performance.timePlaceholder')}
              step="0.01"
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
            />
          </div>

          {/* Context */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('performance.context')}</label>
            <div className="flex gap-1.5">
              {[
                { value: 'training_test', labelKey: 'performance.contextOptions.training' },
                { value: 'competition', labelKey: 'performance.contextOptions.competition' },
                { value: 'exhibition', labelKey: 'performance.contextOptions.exhibition' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateField('context', opt.value)}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    form.context === opt.value
                      ? 'bg-primary text-white border-transparent'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('performance.notes')}</label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder={t('performance.notesPlaceholder')}
              rows={2}
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? t('common.saving') : editId ? t('common.update') : t('performance.saveRecord')}
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
          onClick={() => setShowForm(true)}
          className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('performance.addRecord')}
        </button>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-900 mb-2">{t('performance.deleteRecord')}</h3>
            <p className="text-sm text-gray-600 mb-4">{t('performance.deleteRecordConfirm')}</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-lg"
              >
                {t('common.delete')}
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
