import { Routes, Route } from 'react-router-dom'
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
import BottomNav from './components/BottomNav'

export default function App() {
  return (
    <div className="min-h-screen pb-20">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/daily" element={<Daily />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/coach-notes" element={<CoachNotes />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/body" element={<Body />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/weekly-review" element={<WeeklyReview />} />
        <Route path="/summer-camp" element={<SummerCamp />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/export" element={<Export />} />
      </Routes>
      <BottomNav />
    </div>
  )
}
