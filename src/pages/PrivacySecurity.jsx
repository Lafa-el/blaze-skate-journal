import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, Lock, ShieldAlert, Trash2 } from 'lucide-react'

export default function PrivacySecurity() {
  const navigate = useNavigate()
  const { user, isLoading, updatePasswordFn, updateEmailFn, deleteAccountFn } = useAuth()

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)

  // Email state
  const [newEmail, setNewEmail] = useState('')
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
      setPasswordError('Current password is required')
      return
    }
    if (!newPassword) {
      setPasswordError('New password is required')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    setUpdatingPassword(true)
    try {
      await updatePasswordFn(currentPassword, newPassword)
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password')
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
      setEmailError('Invalid email address')
      return
    }

    setUpdatingEmail(true)
    try {
      await updateEmailFn(newEmail)
      setEmailSuccess(true)
      setNewEmail('')
      setTimeout(() => setEmailSuccess(false), 3000)
    } catch (err) {
      setEmailError(err.message || 'Failed to update email')
    } finally {
      setUpdatingEmail(false)
    }
  }

  // Delete Account handler
  const handleDeleteAccount = async (e) => {
    e.preventDefault()
    setDeleteError('')

    if (!deletePassword) {
      setDeleteError('Password is required to delete account')
      return
    }

    setIsDeleting(true)
    try {
      await deleteAccountFn(deletePassword)
      navigate('/login')
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account')
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
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Privacy & Security</h1>
          <div className="flex-1" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Change Password */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Change Password</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Confirm New Password</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            {renderError(passwordError)}
            {passwordSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Password updated successfully!</span>
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
                  Updating...
                </span>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        </div>

        {/* Bind Email */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Bind Email</h2>
          </div>
          {user?.email ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Email already bound</p>
                <p className="text-xs text-green-600">{user.email}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateEmail} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600">New Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email address"
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              {renderError(emailError)}
              {emailSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Email updated successfully!</span>
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
                    Updating...
                  </span>
                ) : (
                  'Bind Email'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Delete Account */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-red-200">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-red-600">Delete Account</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Once you delete your account, all your data including training sessions, notes, and reviews will be permanently removed. This action cannot be undone.
          </p>
          <button
            onClick={() => setDeleteStep(1)}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto">
            {deleteStep === 1 && (
              <>
                <h3 className="font-semibold text-gray-900 mb-2">⚠️ Delete Account?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This will permanently delete your account and all associated data. This includes:
                </p>
                <ul className="text-sm text-gray-500 list-disc list-inside mb-4 space-y-1">
                  <li>Training sessions and records</li>
                  <li>Coach notes</li>
                  <li>Weekly reviews</li>
                  <li>Profile information</li>
                  <li>Photos and data</li>
                </ul>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setDeleteStep(2); setShowDeleteConfirm(false) }}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-lg transition-colors"
                  >
                    I understand
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteStep(0) }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {deleteStep === 2 && (
              <>
                <h3 className="font-semibold text-gray-900 mb-2">Type "DELETE" to confirm</h3>
                <p className="text-sm text-gray-600 mb-4">
                  To confirm account deletion, please type DELETE below.
                </p>
                <input
                  type="text"
                  value={deleteType}
                  onChange={(e) => setDeleteType(e.target.value)}
                  placeholder="Type DELETE"
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
                    Next
                  </button>
                  <button
                    onClick={() => { setDeleteStep(1); setDeleteType('') }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                </div>
              </>
            )}

            {deleteStep === 3 && (
              <>
                <h3 className="font-semibold text-gray-900 mb-2">Enter your password</h3>
                <p className="text-sm text-gray-600 mb-4">
                  For security, please enter your current password to confirm.
                </p>
                <form onSubmit={handleDeleteAccount} className="space-y-3">
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Current password"
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
                          Deleting...
                        </span>
                      ) : (
                        'Delete Account'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDeleteStep(2); setDeleteType(''); setDeletePassword('') }}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-colors"
                    >
                      Back
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
