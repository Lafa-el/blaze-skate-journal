import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Loader2, AlertCircle, CheckCircle, Lock, ShieldAlert, Trash2 } from 'lucide-react'
import { useLanguage } from '../i18n'
import { en } from '../i18n/dictionaries/en'
import { zh } from '../i18n/dictionaries/zh'

export default function PrivacySecurity() {
  const navigate = useNavigate()
  const { user, isLoading, updatePassword, updateEmail, deleteAccount } = useAuth()
  const { t, lang } = useLanguage()
  const deleteConfirmItems = lang === 'zh' ? zh.privacySecurity.deleteConfirmItems : en.privacySecurity.deleteConfirmItems

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)

  // Email state
  const [newEmail, setNewEmail] = useState('')
  const [currentEmailPassword, setCurrentEmailPassword] = useState('')
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [updatingEmail, setUpdatingEmail] = useState(false)

  // Delete Account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteStep, setDeleteStep] = useState(0) // 0=not started, 1=warning, 2=type DELETE, 3=password
  const [deleteType, setDeleteType] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Change Password handler
  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    if (!currentPassword) {
      setPasswordError(t('privacySecurity.currentPasswordRequired'))
      return
    }
    if (!newPassword) {
      setPasswordError(t('privacySecurity.newPasswordRequired'))
      return
    }
    if (newPassword.length < 6) {
      setPasswordError(t('privacySecurity.newPasswordMinLength'))
      return
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError(t('privacySecurity.passwordsMismatch'))
      return
    }

    setUpdatingPassword(true)
    try {
      await updatePassword(currentPassword, newPassword)
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err) {
      setPasswordError(err.message || t('privacySecurity.failedPassword'))
    } finally {
      setUpdatingPassword(false)
    }
  }

  // Update Email handler
  const handleUpdateEmail = async (e) => {
    e.preventDefault()
    setEmailError('')
    setEmailSuccess(false)

    if (!validateEmail(newEmail)) {
      setEmailError(t('privacySecurity.invalidEmail'))
      return
    }
    if (user?.email && !currentEmailPassword) {
      setEmailError(t('privacySecurity.currentPasswordRequired'))
      return
    }

    setUpdatingEmail(true)
    try {
      await updateEmail(newEmail, currentEmailPassword)
      setEmailSuccess(true)
      setNewEmail('')
      setCurrentEmailPassword('')
      setTimeout(() => setEmailSuccess(false), 3000)
    } catch (err) {
      setEmailError(err.message || t('privacySecurity.failedEmail'))
    } finally {
      setUpdatingEmail(false)
    }
  }

  // Delete Account handler
  const handleDeleteAccount = async (e) => {
    e.preventDefault()
    setDeleteError('')

    if (!deletePassword) {
      setDeleteError(t('privacySecurity.deletePasswordRequired'))
      return
    }

    setIsDeleting(true)
    try {
      await deleteAccount(deletePassword)
      navigate('/login')
    } catch (err) {
      setDeleteError(err.message || t('privacySecurity.failedDelete'))
    } finally {
      setIsDeleting(false)
    }
  }

  // Error banner component
  const renderError = (error) => {
    if (!error) return null
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{t('privacySecurity.title')}</h1>
          <div className="flex-1" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Change Password */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">{t('privacySecurity.changePassword')}</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600">{t('privacySecurity.currentPassword')}</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('privacySecurity.currentPasswordPlaceholder')}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">{t('privacySecurity.newPassword')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('privacySecurity.newPasswordPlaceholder')}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">{t('privacySecurity.confirmNewPassword')}</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder={t('privacySecurity.confirmNewPasswordPlaceholder')}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            {renderError(passwordError)}
            {passwordSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{t('privacySecurity.passwordUpdated')}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={updatingPassword || isLoading}
              className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
            >
              {updatingPassword ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('privacySecurity.updatingPassword')}
                </span>
              ) : (
                t('privacySecurity.updatePassword')
              )}
            </button>
          </form>
        </div>

        {/* Bind Email */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">{t('privacySecurity.bindEmail')}</h2>
          </div>
          {user?.email && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 mb-3">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">{t('privacySecurity.emailBound')}</p>
                <p className="text-xs text-green-600">{user.email}</p>
              </div>
            </div>
          )}
          <form onSubmit={handleUpdateEmail} className="space-y-3">
            {user?.email && (
              <div>
                <label className="text-xs font-medium text-gray-600">{t('privacySecurity.currentPassword')}</label>
                <input
                  type="password"
                  value={currentEmailPassword}
                  onChange={(e) => setCurrentEmailPassword(e.target.value)}
                  placeholder={t('privacySecurity.currentPasswordPlaceholder')}
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-600">{t('privacySecurity.newEmail')}</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={t('privacySecurity.newEmailPlaceholder')}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            {renderError(emailError)}
            {emailSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{t('privacySecurity.emailUpdated')}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={updatingEmail || isLoading}
              className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
            >
              {updatingEmail ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('privacySecurity.updatingEmail')}
                </span>
              ) : (
                t('privacySecurity.bindEmailBtn')
              )}
            </button>
          </form>
        </div>

        {/* Delete Account */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-red-200">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-red-600">{t('privacySecurity.deleteAccount')}</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {t('privacySecurity.deleteAccountWarning')}
          </p>
          <button
            onClick={() => { setShowDeleteConfirm(true); setDeleteStep(1) }}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {t('privacySecurity.deleteBtn')}
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto">
            {deleteStep === 1 && (
              <>
                <h3 className="font-semibold text-gray-900 mb-2">{t('privacySecurity.deleteConfirmTitle')}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {t('privacySecurity.deleteConfirmText')}
                </p>
                <ul className="text-sm text-gray-500 list-disc list-inside mb-4 space-y-1">
                  {deleteConfirmItems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteStep(2)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-lg transition-colors"
                  >
                    {t('privacySecurity.deleteConfirmUnderstand')}
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteStep(0) }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </>
            )}

            {deleteStep === 2 && (
              <>
                <h3 className="font-semibold text-gray-900 mb-2">{t('privacySecurity.deleteConfirmType')}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {t('privacySecurity.deleteConfirmHint')}
                </p>
                <input
                  type="text"
                  value={deleteType}
                  onChange={(e) => setDeleteType(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      if (deleteType.toUpperCase() === 'DELETE') {
                        setDeleteStep(3)
                      }
                    }}
                    disabled={deleteType.toUpperCase() !== 'DELETE'}
                    className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg transition-colors"
                  >
                    {t('common.next')}
                  </button>
                  <button
                    onClick={() => { setDeleteStep(1); setDeleteType('') }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-colors"
                  >
                    {t('common.back')}
                  </button>
                </div>
              </>
            )}

            {deleteStep === 3 && (
              <>
                <h3 className="font-semibold text-gray-900 mb-2">{t('privacySecurity.deletePassword')}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {t('privacySecurity.deletePasswordHint')}
                </p>
                <form onSubmit={handleDeleteAccount} className="space-y-3">
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder={t('privacySecurity.deleteCurrentPassword')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  {renderError(deleteError)}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isDeleting || !deletePassword}
                      className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg transition-colors"
                    >
                      {isDeleting ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t('privacySecurity.deleting')}
                        </span>
                      ) : (
                        t('privacySecurity.deleteBtn')
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDeleteStep(2); setDeleteType(''); setDeletePassword('') }}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-colors"
                    >
                      {t('common.back')}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
