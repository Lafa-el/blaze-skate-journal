import { useState, useEffect } from 'react'
import { Plus, Bookmark, ChevronLeft, ChevronRight, Trash2, Flag, Edit3 } from 'lucide-react'
import { coachNoteService } from '../services/coachNoteService'
import { useAuth } from '../contexts/AuthContext'

const priorityOptions = [
  { value: 'high', label: 'High', color: 'bg-red-500' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-500' },
  { value: 'low', label: 'Low', color: 'bg-emerald-500' },
]

const defaultTechnicalTags = [
  'corner_entry', 'corner_drift', 'high_center_of_gravity',
  'right_leg_support', 'exit_angle', 'straightaway_bouncing',
  'incomplete_push', 'start_technique', 'block_start',
  'jump_takeoff', 'rotation', 'spin_centering',
  'program_flow', 'transitions', 'edges',
]

export default function CoachNotes() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Form state
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    coachName: '',
    note: '',
    priority: 'medium',
    technicalTags: [],
    followUpTomorrow: '',
    linkedSessionId: '',
  })

  // Load notes
  useEffect(() => {
    if (!user) return
    loadNotes()
  }, [user])

  const loadNotes = async () => {
    setError('')
    try {
      const all = await coachNoteService.list({}, user.uid)
      setNotes(all)
    } catch (e) {
      setError('Failed to load coach notes. Check your connection or Firebase config.')
      console.error('[CoachNotes] Failed to load:', e)
    }
  }

  const resetForm = () => {
    setForm({
      date: new Date().toISOString().slice(0, 10),
      coachName: '',
      note: '',
      priority: 'medium',
      technicalTags: [],
      followUpTomorrow: '',
      linkedSessionId: '',
    })
    setEditId(null)
    setShowForm(false)
  }

  const startEdit = (note) => {
    const d = note.data
    setForm({
      date: d.date || new Date().toISOString().slice(0, 10),
      coachName: d.coachName || '',
      note: d.note || '',
      priority: d.priority || 'medium',
      technicalTags: d.technicalTags || [],
      followUpTomorrow: d.followUpTomorrow || '',
      linkedSessionId: d.linkedSessionId || '',
    })
    setEditId(note.docId)
    setShowForm(true)
  }

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const toggleTechTag = (tag) => {
    setForm(prev => ({
      ...prev,
      technicalTags: prev.technicalTags.includes(tag)
        ? prev.technicalTags.filter(t => t !== tag)
        : [...prev.technicalTags, tag],
    }))
  }

  const handleSave = async () => {
    if (!user) return
    setLoading(true)
    try {
      if (editId) {
        await coachNoteService.update(editId, form, user.uid)
      } else {
        await coachNoteService.create(form, user.uid)
      }
      resetForm()
      await loadNotes()
    } catch {
      // Error handled silently
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (docId) => {
    if (!user) return
    try {
      await coachNoteService.delete(docId, user.uid)
      setDeleteConfirm(null)
      await loadNotes()
    } catch {
      // Error handled silently
    }
  }

  const getPriorityColor = (priority) => {
    const opt = priorityOptions.find(p => p.value === priority)
    return opt ? opt.color : 'bg-gray-400'
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Coach Notes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Feedback & coaching points</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Notes List */}
      {notes.length > 0 && (
        <div className="space-y-4">
          {notes.map((note) => {
            const n = note.data
            return (
              <div key={note.docId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className={`h-1 ${getPriorityColor(n.priority)}`} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{n.coachName || 'Anonymous'}</span>
                        <span className="text-xs text-gray-400">{n.date || ''}</span>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Flag className="w-3 h-3" />
                        {n.priority}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(note)}
                        className="p-1.5 rounded-lg hover:bg-gray-100"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(note.docId)}
                        className="p-1.5 rounded-lg hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                      <button
                        className="p-1.5 rounded-lg hover:bg-gray-100"
                        title="Bookmark"
                      >
                        <Bookmark className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed mb-3">{n.note}</p>

                  {n.technicalTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {n.technicalTags.map((tag) => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {n.followUpTomorrow && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                      <p className="text-xs font-medium text-amber-800 mb-0.5">Follow Up Tomorrow</p>
                      <p className="text-xs text-amber-700">{n.followUpTomorrow}</p>
                    </div>
                  )}

                  {n.linkedSessionId && (
                    <p className="text-xs text-gray-400 mt-2">Linked Session: {n.linkedSessionId}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {notes.length === 0 && !showForm && (
        <div className="text-center py-8 text-gray-400">
          <Bookmark className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No coach notes yet</p>
        </div>
      )}

      {/* Add Note Button / Form */}
      {showForm ? (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-semibold text-gray-900">
            {editId ? 'Edit Note' : 'Add Note'}
          </h3>

          {/* Coach Name */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Coach Name</label>
            <input
              type="text"
              value={form.coachName}
              onChange={(e) => updateField('coachName', e.target.value)}
              placeholder="e.g. Song Weilong"
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Priority</label>
            <div className="flex gap-1.5">
              {priorityOptions.map((p) => (
                <button
                  key={p.value}
                  onClick={() => updateField('priority', p.value)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    form.priority === p.value
                      ? `${p.color} text-white border-transparent`
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Coach Feedback</label>
            <textarea
              value={form.note}
              onChange={(e) => updateField('note', e.target.value)}
              placeholder="What did the coach say?"
              rows={4}
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2 resize-none"
            />
          </div>

          {/* Technical Tags */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Technical Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {defaultTechnicalTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTechTag(tag)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    form.technicalTags.includes(tag)
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Follow Up Tomorrow */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Follow Up Tomorrow (optional)</label>
            <textarea
              value={form.followUpTomorrow}
              onChange={(e) => updateField('followUpTomorrow', e.target.value)}
              placeholder="What to work on next session?"
              rows={2}
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2 resize-none"
            />
          </div>

          {/* Linked Session ID */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Linked Session ID (optional)</label>
            <input
              type="text"
              value={form.linkedSessionId}
              onChange={(e) => updateField('linkedSessionId', e.target.value)}
              placeholder="Session doc ID"
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Saving...' : editId ? 'Update' : 'Save Note'}
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
          <Plus className="w-5 h-5" />
          Add Note
        </button>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-900 mb-2">Delete Note?</h3>
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
