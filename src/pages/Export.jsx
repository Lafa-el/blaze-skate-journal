import { useState } from 'react'
import {
  Download, Calendar, FileJson, FileSpreadsheet,
  CheckCircle, AlertCircle, ChevronRight, Clock, BookOpen, Video, Target, Star,
} from 'lucide-react'
import { exportData } from '../services/exportService'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../i18n'

const EXPORT_SCOPES = [
  { value: 'all', label: 'allData', icon: BookOpen, description: 'allDataDesc' },
  { value: 'dateRange', label: 'dateRange', icon: Calendar, description: 'dateRangeDesc' },
  { value: 'summerCamp', label: 'summerCamp2026', icon: Target, description: 'summerCampDesc' },
  { value: 'singleWeek', label: 'singleWeek', icon: Clock, description: 'singleWeekDesc' },
]

const EXPORT_FORMATS = [
  { value: 'json', label: 'json', icon: FileJson, description: 'jsonDesc' },
  { value: 'csv', label: 'csv', icon: FileSpreadsheet, description: 'csvDesc' },
]

export default function Export() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)
  const [error, setError] = useState('')
  const [format, setFormat] = useState('json')
  const [scope, setScope] = useState('all')

  // Date range params
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [campStart, setCampStart] = useState('2026-06-15')
  const [campEnd, setCampEnd] = useState('2026-07-10')
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff)).toISOString().slice(0, 10)
  })

  const canExport = () => {
    if (scope === 'all') return true
    if (scope === 'dateRange') return dateStart && dateEnd
    if (scope === 'summerCamp') return campStart && campEnd
    if (scope === 'singleWeek') return weekStart
    return false
  }

  const handleExport = async () => {
    if (!user) return
    if (!canExport()) {
      setError(t('export.fillDates'))
      return
    }

    setExporting(true)
    setExported(false)
    setError('')

    try {
      const params = {}
      if (scope === 'dateRange') {
        params.dateStart = dateStart
        params.dateEnd = dateEnd
      } else if (scope === 'summerCamp') {
        params.campStart = campStart
        params.campEnd = campEnd
      } else if (scope === 'singleWeek') {
        params.weekStart = weekStart
      }

      await exportData(format, scope, params, user.uid)
      setExported(true)
      setTimeout(() => setExported(false), 5000)
    } catch {
      setError(t('export.exportFailed'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('export.title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('export.subtitle')}</p>
      </div>

      {/* Format Selection */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">{t('export.exportFormat')}</p>
        <div className="grid grid-cols-2 gap-3">
          {EXPORT_FORMATS.map((f) => {
            const Icon = f.icon
            return (
              <button
                key={f.value}
                onClick={() => setFormat(f.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  format === f.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Icon className={`w-5 h-5 mb-2 ${
                  format === f.value ? 'text-primary' : 'text-gray-400'
                }`} />
                <p className="text-sm font-semibold text-gray-900">{t(`export.${f.label}`)}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{t(`export.${f.description}`)}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Scope Selection */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">{t('export.exportScope')}</p>
        <div className="space-y-2">
          {EXPORT_SCOPES.map((s) => {
            const Icon = s.icon
            return (
              <button
                key={s.value}
                onClick={() => setScope(s.value)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  scope === s.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${
                  scope === s.value ? 'text-primary' : 'text-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{t(`export.${s.label}`)}</p>
                  <p className="text-[10px] text-gray-500">{t(`export.${s.description}`)}</p>
                </div>
                <ChevronRight className={`w-4 h-4 shrink-0 ${
                  scope === s.value ? 'text-primary' : 'text-gray-300'
                }`} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Date Range Options */}
      {scope === 'dateRange' && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
          <p className="text-xs font-medium text-gray-500">{t('export.dateRange')}</p>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('export.startDate')}</label>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('export.endDate')}</label>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
            />
          </div>
        </div>
      )}

      {/* Summer Camp Options */}
      {scope === 'summerCamp' && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
          <p className="text-xs font-medium text-gray-500">{t('export.summerCamp2026')} Period</p>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('export.campStart')}</label>
            <input
              type="date"
              value={campStart}
              onChange={(e) => setCampStart(e.target.value)}
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('export.campEnd')}</label>
            <input
              type="date"
              value={campEnd}
              onChange={(e) => setCampEnd(e.target.value)}
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
            />
          </div>
        </div>
      )}

      {/* Single Week Options */}
      {scope === 'singleWeek' && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">{t('export.weekStart')}</p>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm px-3 py-2"
          />
        </div>
      )}

      {/* Collection Overview */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <p className="text-xs font-medium text-gray-500 mb-2">{t('export.collections')}</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <Target className="w-3 h-3 text-indigo-500" />
            <span>{t('export.trainingSessions')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3 h-3 text-amber-500" />
            <span>{t('export.coachNotes')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileJson className="w-3 h-3 text-green-500" />
            <span>{t('export.performanceRecords')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Video className="w-3 h-3 text-purple-500" />
            <span>{t('export.videoReferences')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-blue-500" />
            <span>{t('export.weeklyReviews')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="w-3 h-3 text-gray-500" />
            <span>{t('export.bodyStatus')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3 h-3 text-pink-500" />
            <span>{t('export.journalDays')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-3 h-3 text-yellow-500" />
            <span>{t('export.milestones')}</span>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {exported && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{t('export.exportSuccess')}</span>
        </div>
      )}

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={exporting || !canExport()}
        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {exporting ? (
          <>
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            {t('export.exporting')}
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            {t('export.exportBtn')} {format.toUpperCase()}
          </>
        )}
      </button>
    </div>
  )
}
