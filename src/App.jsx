import { Routes, Route, Navigate } from 'react-router-dom'
import { LanguageProvider } from './i18n'
import { useAuth } from './contexts/AuthContext'
import Dashboard from './pages/Dashboard'
import Daily from './pages/Daily'
import Calendar from './pages/Calendar'
import Sessions from './pages/Sessions'
import CoachNotes from './pages/CoachNotes'
import Performance from './pages/Performance'
import Body from './pages/Body'
import Videos from './pages/Videos'
import WeeklyReview from './pages/WeeklyReview'
import SummerCamp from './pages/SummerCamp'
import Settings from './pages/Settings'
import Export from './pages/Export'
import EditProfile from './pages/EditProfile'
import HelpSupport from './pages/HelpSupport'
import PrivacySecurity from './pages/PrivacySecurity'
import Login from './pages/Login'
import BottomNav from './components/BottomNav'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 mt-4">Loading...</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  const { user, loading } = useAuth()

  // Show loading screen while auth state is being determined
  if (loading) {
    return <LoadingScreen />
  }

  return (
    <LanguageProvider>
      <>
        <Routes>
        {/* Public routes */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/daily" element={<ProtectedRoute><Daily /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
        <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
        <Route path="/coach-notes" element={<ProtectedRoute><CoachNotes /></ProtectedRoute>} />
        <Route path="/performance" element={<ProtectedRoute><Performance /></ProtectedRoute>} />
        <Route path="/body" element={<ProtectedRoute><Body /></ProtectedRoute>} />
        <Route path="/videos" element={<ProtectedRoute><Videos /></ProtectedRoute>} />
        <Route path="/weekly-review" element={<ProtectedRoute><WeeklyReview /></ProtectedRoute>} />
        <Route path="/summer-camp" element={<ProtectedRoute><SummerCamp /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
<Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
<Route path="/privacy-security" element={<ProtectedRoute><PrivacySecurity /></ProtectedRoute>} />
<Route path="/help-support" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
<Route path="/export" element={<ProtectedRoute><Export /></ProtectedRoute>} />
      </Routes>

      {/* Show BottomNav only for protected routes (not login page) */}
      {user && <BottomNav />}
      </>
    </LanguageProvider>
  )
}
