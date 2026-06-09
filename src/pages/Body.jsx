import { useState, useEffect } from 'react'
import { HeartPulse, Moon, Droplet, Scale, Ruler, AlertTriangle, Smile, Trash2, ChevronLeft } from 'lucide-react'
import { bodyStatusService } from '../services/bodyStatusService'
import { useAuth } from '../contexts/AuthContext'

const moodOptions = [
  { value: 1, label: '😫', desc: 'Terrible' },
  { value: 2, label: '😕', desc: 'Poor' },
  { value: 3, label: '😐', desc: 'Okay' },
  { value: 4, label: '😊', desc: 'Good' },
  { value: 5, label: '😄', desc: 'Great' },
  { value: 6, label: '🔥', desc: 'Excellent' },
]

const sorenessAreas = [
  'quadriceps', 'hamstrings', 'calves', 'lower_back',
  'shoulders', 'knees', 'ankles', 'hips', 'glutes', 'core',
]

export default function Body() {
  const { user } = useAuth()
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

  // Load latest reading
  useEffect(() => {
    if (!user) return
    loadReadings()
  }, [user])

  const loadReadings = async () => {
    setError('')
    try {
      const all = await bodyStatusService.list(user.uid, 7)
      setReadings(all)
    } catch (e) {
      setError('Failed to load body readings. Check your connection or Firebase config.')
      console.error('[Body] Failed to load:', e)
    }
  }

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
    if (!user) return
    setLoading(true)
    try {
      const data = {
        ...form,
        sleepHours: form.sleepHours ? Number(form.sleepHours) : 0,
        bodyWeightLb: form.bodyWeightLb ? Number(form.bodyWeightLb) : 0,
        heightCm: form.heightCm ? Number(form.heightCm) : 0,
      }
      if (editId) {
        await bodyStatusService.update(editId, data, user.uid)
      } else {
        await bodyStatusService.create(data, user.uid)
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
    if (!user) return
    try {
      await bodyStatusService.delete(docId, user.uid)
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
        <h1 className="text-2xl font-bold text-gray-900">Body Status</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track your daily physical condition</p>
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
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Readings</h2>
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
                          {r.sleepHours}h sleep · Fatigue {r.fatigueLevel}/5
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(reading)}
                        className="p-1.5 rounded-lg hover:bg-gray-100"
                        title="Edit"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(reading.docId)}
                        className="p-1.5 rounded-lg hover:bg-red-50"
                        title="Delete"
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
            {editId ? 'Edit Body Status' : 'Log Body Status'}
          </h3>

          {/* Sleep Hours */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5" />
              Sleep (hours)
            </label>
            <input
              type="number"
              value={form.sleepHours}
              onChange={(e) => updateField('sleepHours', e.target.value)}
              placeholder="e.g. 7.5"
              step="0.5"
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
            />
          </div>

          {/* Fatigue Level */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Fatigue Level (1–5)</label>
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
            <p className="text-xs text-gray-400 mt-1">1 = Fresh, 5 = Exhausted</p>
          </div>

          {/* Mood */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Mood</label>
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
                  title={m.desc}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Soreness Areas */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Soreness Areas</label>
            <div className="flex flex-wrap gap-1.5">
              {sorenessAreas.map((area) => (
                <button
                  key={area}
                  onClick={() => toggleSorenessArea(area)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    form.sorenessAreas.includes(area)
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {area.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Weight & Height */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                Weight (lb)
              </label>
              <input
                type="number"
                value={form.bodyWeightLb}
                onChange={(e) => updateField('bodyWeightLb', e.target.value)}
                placeholder="e.g. 128"
                step="0.1"
                className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5" />
                Height (cm)
              </label>
              <input
                type="number"
                value={form.heightCm}
                onChange={(e) => updateField('heightCm', e.target.value)}
                placeholder="e.g. 160"
                className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
              />
            </div>
          </div>

          {/* Injury Note */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Injury / Pain Note (optional)
            </label>
            <textarea
              value={form.injuryNote}
              onChange={(e) => updateField('injuryNote', e.target.value)}
              placeholder="Any pain, discomfort, or injury to note?"
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
              {loading ? 'Saving...' : editId ? 'Update' : 'Save Body Status'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <HeartPulse className="w-5 h-5" />
          Log Body Status
        </button>
      )}

      {/* Empty State */}
      {readings.length === 0 && !showForm && (
        <div className="text-center py-8 text-gray-400">
          <Smile className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No body status logged yet</p>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-900 mb-2">Delete Reading?</h3>
            <p className="text-sm text-gray-600 mb-4">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-lg"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg"
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
