import { useState, useEffect, useCallback } from 'react'
import { HeartPulse, Moon, Scale, Ruler, AlertTriangle, Smile, Trash2, ChevronLeft } from 'lucide-react'
import { bodyStatusService } from '../services/bodyStatusService'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../i18n'

const moodOptions = [
  { value: 1, label: '😫', descKey: 'body.moodOptions.terrible' },
  { value: 2, label: '😕', descKey: 'body.moodOptions.poor' },
  { value: 3, label: '😐', descKey: 'body.moodOptions.okay' },
  { value: 4, label: '😊', descKey: 'body.moodOptions.good' },
  { value: 5, label: '😄', descKey: 'body.moodOptions.great' },
  { value: 6, label: '🔥', descKey: 'body.moodOptions.excellent' },
]

const sorenessAreas = [
  { key: 'quadriceps' }, { key: 'hamstrings' }, { key: 'calves' }, { key: 'lower_back' },
  { key: 'shoulders' }, { key: 'knees' }, { key: 'ankles' }, { key: 'hips' },
  { key: 'glutes' }, { key: 'core' },
]

export default function Body() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const uid = user?.uid
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [readings, setReadings] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Form state
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    sleepHours: '',
    fatigueLevel: 3,
    sorenessAreas: [],
    bodyWeightLb: '',
    heightCm: '',
    injuryNote: '',
    mood: 3,
  })

  const loadReadings = useCallback(async () => {
    if (!uid) return
    setError('')
    try {
      const all = await bodyStatusService.list(uid, 7)
      setReadings(all)
    } catch (e) {
      setError(t('body.failedLoad'))
      console.error('[Body] Failed to load:', e)
    }
  }, [t, uid])

  // Load latest reading
  useEffect(() => {
    loadReadings()
  }, [loadReadings])

  const resetForm = () => {
    setForm({
      date: new Date().toISOString().slice(0, 10),
      sleepHours: '',
      fatigueLevel: 3,
      sorenessAreas: [],
      bodyWeightLb: '',
      heightCm: '',
      injuryNote: '',
      mood: 3,
    })
    setEditId(null)
    setShowForm(false)
  }

  const startEdit = (reading) => {
    const d = reading.data
    setForm({
      date: d.date || new Date().toISOString().slice(0, 10),
      sleepHours: d.sleepHours || '',
      fatigueLevel: d.fatigueLevel ?? 3,
      sorenessAreas: d.sorenessAreas || [],
      bodyWeightLb: d.bodyWeightLb || '',
      heightCm: d.heightCm || '',
      injuryNote: d.injuryNote || '',
      mood: d.mood ?? 3,
    })
    setEditId(reading.docId)
    setShowForm(true)
  }

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const toggleSorenessArea = (area) => {
    setForm(prev => ({
      ...prev,
      sorenessAreas: prev.sorenessAreas.includes(area)
        ? prev.sorenessAreas.filter(a => a !== area)
        : [...prev.sorenessAreas, area],
    }))
  }

  const handleSave = async () => {
    if (!uid) return
    setLoading(true)
    try {
      const data = {
        ...form,
        sleepHours: form.sleepHours ? Number(form.sleepHours) : 0,
        bodyWeightLb: form.bodyWeightLb ? Number(form.bodyWeightLb) : 0,
        heightCm: form.heightCm ? Number(form.heightCm) : 0,
      }
      if (editId) {
        await bodyStatusService.update(editId, data, uid)
      } else {
        await bodyStatusService.create(data, uid)
      }
      resetForm()
      await loadReadings()
    } catch {
      // Error handled silently
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (docId) => {
    if (!uid) return
    try {
      await bodyStatusService.delete(docId, uid)
      setDeleteConfirm(null)
      await loadReadings()
    } catch {
      // Error handled silently
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('body.title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('body.subtitle')}</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Recent Readings */}
      {readings.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('body.recentReadings')}</h2>
          <div className="space-y-3">
            {readings.map((reading) => {
              const r = reading.data
              return (
                <div key={reading.docId} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{moodOptions.find(m => m.value === r.mood)?.label || '😐'}</span>
                      <div>
                        <p className="font-medium text-gray-900">{r.date}</p>
                        <p className="text-xs text-gray-400">
                          {r.sleepHours}h {t('body.sleep')} · Fatigue {r.fatigueLevel}/{t('common.score')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(reading)}
                        className="p-1.5 rounded-lg hover:bg-gray-100"
                        title={t('common.edit')}
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(reading.docId)}
                        className="p-1.5 rounded-lg hover:bg-red-50"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>

                  {r.bodyWeightLb && (
                    <div className="flex gap-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5" />
                        {r.bodyWeightLb} lb
                      </span>
                      {r.heightCm && (
                        <span className="flex items-center gap-1">
                          <Ruler className="w-3.5 h-3.5" />
                          {r.heightCm} cm
                        </span>
                      )}
                    </div>
                  )}

                  {r.sorenessAreas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {r.sorenessAreas.map((area) => (
                        <span key={area} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {area.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {r.injuryNote && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">{r.injuryNote}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Button / Form */}
      {showForm ? (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-semibold text-gray-900">
            {editId ? t('body.editBody') : t('body.logBody')}
          </h3>

          {/* Sleep Hours */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5" />
              {t('body.sleep')}
            </label>
            <input
              type="number"
              value={form.sleepHours}
              onChange={(e) => updateField('sleepHours', e.target.value)}
              placeholder={t('body.sleepPlaceholder')}
              step="0.5"
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
            />
          </div>

          {/* Fatigue Level */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('body.fatigue')}</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => updateField('fatigueLevel', n)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    form.fatigueLevel === n
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">{t('body.fatigueScale')}</p>
          </div>

          {/* Mood */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('body.mood')}</label>
            <div className="flex gap-1.5">
              {moodOptions.map((m) => (
                <button
                  key={m.value}
                  onClick={() => updateField('mood', m.value)}
                  className={`flex-1 py-2 rounded-lg text-lg transition-colors border ${
                    form.mood === m.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  title={t(m.descKey)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Soreness Areas */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('body.sorenessAreas')}</label>
            <div className="flex flex-wrap gap-1.5">
              {sorenessAreas.map((area) => (
                <button
                  key={area.key}
                  onClick={() => toggleSorenessArea(area.key)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    form.sorenessAreas.includes(area.key)
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {area.key.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Weight & Height */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                {t('body.weight')}
              </label>
              <input
                type="number"
                value={form.bodyWeightLb}
                onChange={(e) => updateField('bodyWeightLb', e.target.value)}
                placeholder={t('body.weightPlaceholder')}
                step="0.1"
                className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5" />
                {t('body.height')}
              </label>
              <input
                type="number"
                value={form.heightCm}
                onChange={(e) => updateField('heightCm', e.target.value)}
                placeholder={t('body.heightPlaceholder')}
                className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
              />
            </div>
          </div>

          {/* Injury Note */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t('body.injuryNote')}
            </label>
            <textarea
              value={form.injuryNote}
              onChange={(e) => updateField('injuryNote', e.target.value)}
              placeholder={t('body.injuryPlaceholder')}
              rows={3}
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
              {loading ? t('common.saving') : editId ? t('common.update') : t('body.saveBody')}
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
          <HeartPulse className="w-5 h-5" />
          {t('body.logBody')}
        </button>
      )}

      {/* Empty State */}
      {readings.length === 0 && !showForm && (
        <div className="text-center py-8 text-gray-400">
          <Smile className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('body.noBodyStatus')}</p>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-900 mb-2">{t('body.deleteReading')}</h3>
            <p className="text-sm text-gray-600 mb-4">{t('body.deleteReadingConfirm')}</p>
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
