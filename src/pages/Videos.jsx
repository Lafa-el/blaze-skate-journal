import { useState, useEffect } from 'react'
import { Film, Plus, Trash2, Edit3, ExternalLink, Tag, Clock, FileVideo, X } from 'lucide-react'
import { videoService } from '../services/videoService'
import { useAuth } from '../contexts/AuthContext'

const ANALYSIS_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-600' },
  { value: 'analyzing', label: 'Analyzing', color: 'bg-amber-100 text-amber-700' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' },
]

const TECHNICAL_TAG_OPTIONS = [
  'edge', 'turn', 'jump', 'spin', 'footwork', 'flow',
  'step_sequence', 'combo', 'alignment', 'speed', 'other',
]

export default function Videos() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [videos, setVideos] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedSession, setSelectedSession] = useState('all')

  // Form state
  const [form, setForm] = useState({
    title: '',
    fileName: '',
    externalUrl: '',
    sessionId: '',
    technicalTags: [],
    analysisStatus: 'pending',
    notes: '',
  })

  // Load videos
  useEffect(() => {
    if (!user) return
    loadVideos()
  }, [user, selectedStatus, selectedSession])

  const loadVideos = async () => {
    setError('')
    try {
      setLoading(true)
      const filters = {}
      if (selectedStatus !== 'all') filters.analysisStatus = selectedStatus
      if (selectedSession !== 'all') filters.sessionId = selectedSession
      const all = await videoService.list(filters, user.uid)
      setVideos(all)
    } catch (e) {
      setError('Failed to load videos. Check your connection or Firebase config.')
      console.error('[Videos] Failed to load:', e)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({
      title: '',
      fileName: '',
      externalUrl: '',
      sessionId: '',
      technicalTags: [],
      analysisStatus: 'pending',
      notes: '',
    })
    setEditId(null)
    setShowForm(false)
  }

  const startEdit = (video) => {
    const d = video.data
    setForm({
      title: d.title || '',
      fileName: d.fileName || '',
      externalUrl: d.externalUrl || '',
      sessionId: d.sessionId || '',
      technicalTags: d.technicalTags || [],
      analysisStatus: d.analysisStatus || 'pending',
      notes: d.notes || '',
    })
    setEditId(video.docId)
    setShowForm(true)
  }

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const toggleTag = (tag) => {
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
      const data = {
        title: form.title.trim(),
        fileName: form.fileName.trim(),
        externalUrl: form.externalUrl.trim(),
        sessionId: form.sessionId.trim(),
        technicalTags: form.technicalTags,
        analysisStatus: form.analysisStatus,
        notes: form.notes.trim(),
      }

      if (editId) {
        await videoService.update(editId, data, user.uid)
      } else {
        await videoService.create(data, user.uid)
      }
      resetForm()
      await loadVideos()
    } catch {
      // Error handled silently
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (docId) => {
    if (!user) return
    try {
      await videoService.delete(docId, user.uid)
      setDeleteConfirm(null)
      await loadVideos()
    } catch {
      // Error handled silently
    }
  }

  // Collect unique session IDs for filter dropdown
  const uniqueSessions = [...new Set(videos.map(v => v.data.sessionId).filter(Boolean))]

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Video References</h1>
          <p className="text-sm text-gray-500 mt-0.5">Technique review clips & analysis</p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Filters</h2>
        <div className="flex gap-2">
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="p-2 rounded-xl bg-primary text-white hover:bg-primary-dark"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">Analysis Status</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {ANALYSIS_STATUSES.map((status) => (
              <button
                key={status.value}
                onClick={() => setSelectedStatus(status.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedStatus === status.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {uniqueSessions.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Session</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedSession('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedSession === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {uniqueSessions.map((session) => (
                <button
                  key={session}
                  onClick={() => setSelectedSession(session)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedSession === session
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {session}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8 text-gray-400">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm">Loading...</p>
        </div>
      )}

      {/* Videos List */}
      {!loading && videos.length > 0 && (
        <div className="space-y-3">
          {videos.map((video) => {
            const v = video.data
            const statusStyle = ANALYSIS_STATUSES.find(s => s.value === v.analysisStatus)?.color || 'bg-gray-100 text-gray-600'
            return (
              <div key={video.docId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                      <Film className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{v.title || 'Untitled'}</h3>
                          {v.fileName && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{v.fileName}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusStyle}`}>
                            {ANALYSIS_STATUSES.find(s => s.value === v.analysisStatus)?.label || v.analysisStatus}
                          </span>
                        </div>
                      </div>

                      {/* Tags */}
                      {v.technicalTags && v.technicalTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {v.technicalTags.map((tag) => (
                            <span key={tag} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                        {v.sessionId && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {v.sessionId}
                          </span>
                        )}
                        {v.externalUrl && (
                          <a
                            href={v.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-indigo-500 hover:text-indigo-600"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Link
                          </a>
                        )}
                      </div>

                      {v.notes && (
                        <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg px-3 py-2">
                          {v.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => startEdit(video)}
                      className="p-1.5 rounded-lg hover:bg-gray-100"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(video.docId)}
                      className="p-1.5 rounded-lg hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {videos.length === 0 && !loading && !showForm && (
        <div className="text-center py-8 text-gray-400">
          <FileVideo className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No video references yet</p>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {editId ? 'Edit Video Reference' : 'Add Video Reference'}
            </h3>
            <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="e.g. Double Axel Practice"
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
            />
          </div>

          {/* File Name */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">File Name</label>
            <input
              type="text"
              value={form.fileName}
              onChange={(e) => updateField('fileName', e.target.value)}
              placeholder="e.g. da_practice_20260607.mp4"
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
            />
          </div>

          {/* External URL */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">External URL</label>
            <input
              type="url"
              value={form.externalUrl}
              onChange={(e) => updateField('externalUrl', e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
            />
          </div>

          {/* Session ID */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Session ID</label>
            <input
              type="text"
              value={form.sessionId}
              onChange={(e) => updateField('sessionId', e.target.value)}
              placeholder="e.g. session-2026-06-07"
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
            />
          </div>

          {/* Technical Tags */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Technical Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {TECHNICAL_TAG_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                    form.technicalTags.includes(tag)
                      ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Analysis Status */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Analysis Status</label>
            <div className="flex gap-1.5">
              {ANALYSIS_STATUSES.map((status) => (
                <button
                  key={status.value}
                  onClick={() => updateField('analysisStatus', status.value)}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    form.analysisStatus === status.value
                      ? `${status.color} border-transparent`
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Notes about this video..."
              rows={2}
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading || !form.title.trim()}
              className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Saving...' : editId ? 'Update' : 'Save'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-900 mb-2">Delete Video Reference?</h3>
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
