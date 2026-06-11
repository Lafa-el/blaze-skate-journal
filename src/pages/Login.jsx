import { useState, useEffect } from 'react'
import { Mail, Lock, User, Loader2, AlertCircle, CheckCircle, Flame } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n'

function useSystemColorScheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setIsDark(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isDark
}

/* eslint-disable react-hooks/set-state-in-effect */
export default function Login() {
  const { signInWithEmail, signUpWithEmail, resetPasswordEmail, isLoading, signInError, signUpError, resetError } = useAuth()
  const navigate = useNavigate()
  const { t } = useLanguage()

  const isDark = useSystemColorScheme()
  const [mode, setMode] = useState('login') // 'login', 'register', 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  // Clear state when switching modes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEmail('')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPassword('')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayName('')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConfirmPassword('')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowPassword(false)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResetSent(false)
  }, [mode])
  /* eslint-enable react-hooks/set-state-in-effect */

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validatePassword = (password) => {
    return password.length >= 6
  }

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      return
    }

    if (!password) {
      return
    }

    try {
      await signInWithEmail(email, password)
      navigate('/dashboard')
    } catch {
      // Error is handled by AuthContext
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()

    if (!displayName.trim()) {
      return
    }

    if (!validateEmail(email)) {
      return
    }

    if (!validatePassword(password)) {
      return
    }

    if (password !== confirmPassword) {
      return
    }

    try {
      await signUpWithEmail(email, password, displayName.trim())
      navigate('/dashboard')
    } catch {
      // Error is handled by AuthContext
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      return
    }

    try {
      await resetPasswordEmail(email)
      setResetSent(true)
    } catch {
      // Error is handled by AuthContext
    }
  }
  const renderError = (error) => {
    if (!error) return null
    return (
      <div className={`flex items-center gap-2 p-3 rounded-lg text-sm transition-colors duration-300 ${
        isDark
          ? 'bg-red-900/30 border border-red-800 text-red-300'
          : 'bg-red-50 border border-red-200 text-red-700'
      }`}>
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div className={`min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12 transition-colors duration-300 ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
    }`}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-colors duration-300 ${
            isDark
              ? 'bg-gradient-to-br from-indigo-600 to-purple-700'
              : 'bg-gradient-to-br from-indigo-400 to-purple-500'
          }`}>
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-2xl font-bold transition-colors duration-300 ${
            isDark ? 'text-gray-100' : 'text-gray-900'
          }`}>{t('login.brand')}</h1>
          <p className={`text-sm mt-1 transition-colors duration-300 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>{t('login.tagline')}</p>
        </div>

        {/* Card */}
        <div className={`rounded-2xl shadow-lg border transition-colors duration-300 ${
          isDark
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-100'
        }`}>
          {/* Mode Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === 'login'
                  ? isDark
                    ? 'bg-indigo-900/50 text-indigo-300'
                    : 'bg-indigo-50 text-indigo-600'
                  : isDark
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('login.signIn')}
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === 'register'
                  ? isDark
                    ? 'bg-indigo-900/50 text-indigo-300'
                    : 'bg-indigo-50 text-indigo-600'
                  : isDark
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('login.createAccount')}
            </button>
            <button
              onClick={() => setMode('reset')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === 'reset'
                  ? isDark
                    ? 'bg-indigo-900/50 text-indigo-300'
                    : 'bg-indigo-50 text-indigo-600'
                  : isDark
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('login.forgotPassword')}
            </button>
          </div>

          {/* Errors */}
          {renderError(mode === 'login' ? signInError : mode === 'register' ? signUpError : resetError)}

          {/* Reset Success */}
          {resetSent && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-4 transition-colors duration-300 ${
              isDark
                ? 'bg-green-900/30 border border-green-800 text-green-300'
                : 'bg-green-50 border border-green-200 text-green-700'
            }`}>
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{t('login.resetSent')}</span>
            </div>
          )}

          {/* Forms */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>{t('login.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('login.emailPlaceholder')}
                    required
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-300 ${
                      isDark
                        ? 'bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'border border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>{t('login.password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('login.passwordPlaceholder')}
                    required
                    className={`w-full pl-10 pr-10 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-300 ${
                      isDark
                        ? 'bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'border border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm hover:transition-colors ${
                      isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {showPassword ? t('login.hide') : t('login.show')}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2.5 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('login.signingIn')}
                  </span>
                ) : (
                  t('login.signIn')
                )}
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>{t('login.name')}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t('login.namePlaceholder')}
                    required
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-300 ${
                      isDark
                        ? 'bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'border border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>{t('login.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('login.emailPlaceholder')}
                    required
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-300 ${
                      isDark
                        ? 'bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'border border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>{t('login.password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('login.passwordMinLength')}
                    required
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-300 ${
                      isDark
                        ? 'bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'border border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>{t('login.confirmPassword')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('login.passwordPlaceholder')}
                    required
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-300 ${
                      isDark
                        ? 'bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'border border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2.5 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('login.creatingAccount')}
                  </span>
                ) : (
                  t('login.createAccount')
                )}
              </button>
            </form>
          )}

          {mode === 'reset' && (
            <div>
              <p className={`text-sm mb-4 transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {t('login.enterEmailReset')}
              </p>
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>{t('login.email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('login.emailPlaceholder')}
                      required
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-300 ${
                        isDark
                          ? 'bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400'
                          : 'border border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || resetSent}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2.5 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 transition-all"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('login.sending')}
                    </span>
                  ) : resetSent ? (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {t('common.sent')}
                    </span>
                  ) : (
                    t('login.sendResetLink')
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className={`text-center text-xs mt-6 transition-colors duration-300 ${
          isDark ? 'text-gray-500' : 'text-gray-400'
        }`}>
          {t('login.brand')} v1.5.0
        </p>
      </div>
    </div>
  )
}
