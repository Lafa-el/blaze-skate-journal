import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Calendar,
  CalendarDays,
  BarChart3,
  Video,
  MoreHorizontal,
  Clock,
  PenLine,
  HeartPulse,
  TrendingUp,
  Tent,
  Settings,
  Download,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLanguage } from '../i18n'

const primaryTabs = [
  { path: '/dashboard', key: 'nav.dashboard', icon: Home },
  { path: '/calendar', key: 'nav.calendar', icon: CalendarDays },
  { path: '/performance', key: 'nav.stats', icon: BarChart3 },
  { path: '/videos', key: 'nav.videos', icon: Video },
]

const moreItems = [
  { path: '/daily', key: 'nav.daily', icon: Calendar },
  { path: '/sessions', key: 'nav.sessions', icon: Clock },
  { path: '/coach-notes', key: 'nav.notes', icon: PenLine },
  { path: '/body', key: 'nav.body', icon: HeartPulse },
  { path: '/weekly-review', key: 'nav.review', icon: TrendingUp },
  { path: '/summer-camp', key: 'nav.camp', icon: Tent },
  { path: '/export', key: 'nav.export', icon: Download },
  { path: '/settings', key: 'nav.settings', icon: Settings },
]

export default function BottomNav() {
  const location = useLocation()
  const { t } = useLanguage()
  const [moreOpen, setMoreOpen] = useState(false)

  // Close menu when clicking outside
  useEffect(() => {
    const menu = document.querySelector('[data-bottom-nav]')
    if (!menu) return
    function handleClick(e) {
      if (!menu.contains(e.target)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close menu on route change
  useEffect(() => {
    setMoreOpen(false)
  }, [location.pathname])

  const isActive = (path) => location.pathname === path
  const isActiveMorePath = () => moreItems.some(item => location.pathname === item.path)

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/90 backdrop-blur-lg border-t border-gray-200 z-50 pb-[env(safe-area-inset-bottom)]"
      data-bottom-nav
    >
      <div className="flex items-center justify-around px-1 py-1">
        {primaryTabs.map(({ path, key, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg transition-colors ${
              isActive(path)
                ? 'text-primary'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium">{t(key)}</span>
          </Link>
        ))}

        {/* More button */}
        <div className="relative">
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg transition-colors ${
              moreOpen
                ? 'text-primary'
                : isActiveMorePath()
                  ? 'text-primary'
                  : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium">{t('nav.more')}</span>
          </button>

          {/* More submenu */}
          {moreOpen && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-52">
              {moreItems.map(({ path, key, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    isActive(path)
                      ? 'bg-indigo-50 text-primary font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{t(key)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
