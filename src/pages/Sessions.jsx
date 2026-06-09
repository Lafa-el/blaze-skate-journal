import { useState, useEffect } from 'react'
import { Plus, Clock, Scissors, Trophy, Calendar, MapPin, ChevronLeft, ChevronRight, Trash2, Edit3 } from 'lucide-react'
import { sessionService } from '../services/sessionService'
import { useAuth } from '../contexts/AuthContext'

const sessionTypes = [
  { value: 'ice', label: 'Ice' },
  { value: 'dryland', label: 'Dryland' },
  { value: 'private_lesson', label: 'Private Lesson' },
  { value: 'competition', label: 'Competition' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'rest', label: 'Rest' },
]

const intensityLevels = [1, 2, 3, 4, 5]
const defaultFocusTags = [
  'start', '500m', '1000m', '1500m', 'corner_entry',
  'corner_drift', 'follow_skating', 'footwork', 'edges',
  'jumps', 'spins', 'program', 'speed_work', 'endurance',
]

export default function Sessions() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessions, setSessions] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Form state
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    sessionType: 'ice',
    sessionLabel: '',
    durationMinutes: '',
    intensity: 3,
    focusTags: [],
    coachName: '',
    notes: '',
  })

  // Load sessions for selected date
  useEffect(() => {
    if (!user) return
    loadSessions()
  }, [user, selectedDate])

  const loadSessions = async () => {
    setError('')
    try {
      const all = await sessionService.list(user.uid, 'date')
      const filtered = all.filter(s => s.data.date === selectedDate)
      setSessions(filtered)
    } catch (e) {
      setError('Failed to load sessions. Check your connection or Firebase config.')
      console.error('[Sessions] Failed to load:', e)
    }
  }

  const resetForm = () => {
    setForm({
      date: selectedDate,
      sessionType: 'ice',
      sessionLabel: '',
      durationMinutes: '',
      intensity: 3,
      focusTags: [],
      coachName: '',
      notes: '',
    })
    setEditId(null)
    setShowForm(false)
  }

  const startEdit = (session) => {
    const d = session.data
    setForm({
      date: d.date || selectedDate,
      sessionType: d.sessionType || 'ice',
      sessionLabel: d.sessionLabel || '',
      durationMinutes: d.durationMinutes || '',
      intensity: d.intensity ?? 3,
      focusTags: d.focusTags || [],
      coachName: d.coachName || '',
      notes: d.notes || '',
    })
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

  const handleSave = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = {
        ...form,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : 0,
      }
      if (editId) {
        await sessionService.update(editId, data, user.uid)
      } else {
        await sessionService.create(data, user.uid)
      }
      resetForm()
      await loadSessions()
    } catch {
      // Error handled by UI
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (docId) => {
    if (!user) return
    try {
      await sessionService.delete(docId, user.uid)
      setDeleteConfirm(null)
      await loadSessions()
    } catch {
      // Error handled by UI
    }
  }

  const goToPrevDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    setSelectedDate(d.toISOString().slice(0, 10))
  }

  const goToNextDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    setSelectedDate(d.toISOString().slice(0, 10))
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.data.durationMinutes || 0), 0)

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
        <p className="text-sm text-gray-500 mt-0.5">Training sessions history</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          {error}
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

        {/* Day Summary */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {totalMinutes} min
          </span>
          <span>{sessions.length} session(s)</span>
        </div>
      </div>

      {/* Session List */}
      {sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map((session) => {
            const s = session.data
            return (
              <div key={session.docId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {s.sessionLabel || `${s.sessionType.charAt(0).toUpperCase() + s.sessionType.slice(1)} Session`}
                      </h3>
                      {s.coachName && (
                        <p className="text-sm text-gray-500 mt-0.5">{s.coachName}</p>
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
                      {s.sessionType.replace('_', ' ')}
                    </span>
                    {s.intensity && (
                      <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium">
                        Intensity: {s.intensity}/5
                      </span>
                    )}
                    {s.durationMinutes && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                        {s.durationMinutes} min
                      </span>
                    )}
                  </div>

                  {s.focusTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {s.focusTags.map((tag) => (
                        <span key={tag} className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">
                          #{tag}
                        </span>
                      ))}
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

      {sessions.length === 0 && !showForm && (
        <div className="text-center py-8 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No sessions for this day</p>
        </div>
      )}

      {/* Add Session Button / Form */}
      {showForm ? (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-semibold text-gray-900">
            {editId ? 'Edit Session' : 'Add Session'}
          </h3>

          {/* Session Type */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Session Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {sessionTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => updateField('sessionType', type.value)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    form.sessionType === type.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Session Label */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Label (optional)</label>
            <input
              type="text"
              value={form.sessionLabel}
              onChange={(e) => updateField('sessionLabel', e.target.value)}
              placeholder="e.g. AM Ice, Free Program"
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Duration (minutes)</label>
            <input
              type="number"
              value={form.durationMinutes}
              onChange={(e) => updateField('durationMinutes', e.target.value)}
              placeholder="e.g. 90"
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
            />
          </div>

          {/* Intensity */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Intensity (1–5)</label>
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

          {/* Focus Tags */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Focus Tags</label>
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
            <label className="text-xs font-medium text-gray-500 mb-1 block">Coach Name (optional)</label>
            <input
              type="text"
              value={form.coachName}
              onChange={(e) => updateField('coachName', e.target.value)}
              placeholder="e.g. Song Weilong"
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="What happened in this session?"
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
              {loading ? 'Saving...' : editId ? 'Update' : 'Save Session'}
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
          onClick={() => {
            setForm(prev => ({ ...prev, date: selectedDate }))
            setShowForm(true)
          }}
          className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Session
        </button>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-900 mb-2">Delete Session?</h3>
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
