import {
  Award,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  ClipboardList,
  Clock,
  DollarSign,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Settings,
  Users
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { adminService } from '../services/adminService'
import { t } from '../utils/i18n'

function UserProfile() {
  const { user } = useAuth()
  const userInitial = user?.firstName?.[0] || user?.email?.[0] || 'A'
  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email || 'User'

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
        {userInitial.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
        <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
      </div>
    </div>
  )
}

const menuItems = [
  { path: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/schedule', icon: Calendar, labelKey: 'nav.schedule' },
  { path: '/attendance', icon: Clock, labelKey: 'nav.attendance' },
  { path: '/payroll', icon: DollarSign, labelKey: 'nav.payroll' },
  { path: '/leave-requests', icon: ClipboardList, labelKey: 'nav.leaveRequests' },
  { path: '/notifications', icon: Bell, labelKey: 'nav.notifications' },
  { path: '/rewards', icon: Award, labelKey: 'rewards.title' },
  { path: '/employees', icon: Users, labelKey: 'nav.employees' },
  { path: '/departments', icon: Building2, labelKey: 'nav.departments' },
  { path: '/positions', icon: Briefcase, labelKey: 'nav.positions' },
  // { path: '/integrations', icon: Plug, labelKey: 'nav.integrations' },
  { path: '/reports', icon: FileText, labelKey: 'nav.reports' },
]

const shortcuts = [
  { path: '/employees', labelKey: 'shortcuts.newHireOnboarding' },
  { path: '/leave-requests', labelKey: 'shortcuts.leaveRequests' },
  { path: '/reports', labelKey: 'shortcuts.performanceReviews' },
]

export default function Sidebar() {
  const location = useLocation()
  const [shortcutCounts, setShortcutCounts] = useState({
    newHireOnboarding: 0,
    leaveRequests: 0,
    performanceReviews: 0,
  })

  useEffect(() => {
    const loadShortcutCounts = async () => {
      try {
        const [employees, pendingLeaves] = await Promise.all([
          adminService.getAllEmployees(),
          adminService.getAllLeaveRequests('PENDING', 200),
        ])

        setShortcutCounts({
          newHireOnboarding: employees.total || 0,
          leaveRequests: pendingLeaves.total || 0,
          // Hệ thống chưa có module review riêng, tạm để 0 và dẫn sang reports
          performanceReviews: 0,
        })
      } catch (error) {
        console.error('Failed to load shortcut counts:', error)
      }
    }

    loadShortcutCounts()
  }, [])

  const getShortcutCount = (labelKey: string) => {
    if (labelKey === 'shortcuts.newHireOnboarding') return shortcutCounts.newHireOnboarding
    if (labelKey === 'shortcuts.leaveRequests') return shortcutCounts.leaveRequests
    if (labelKey === 'shortcuts.performanceReviews') return shortcutCounts.performanceReviews
    return 0
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">HRsync</h1>
        <p className="text-sm text-gray-500 mt-1">HR Management</p>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} />
              <span>{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </nav>

      {/* Shortcuts */}
      <div className="p-4 border-t border-gray-200">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-4">
          {t('common.shortcuts') || 'Shortcuts'}
        </h3>
        <div className="space-y-1">
          {shortcuts.map((shortcut) => {
            const isActive = location.pathname === shortcut.path
            return (
            <Link
              key={shortcut.path}
              to={shortcut.path}
              className={`flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-sm text-gray-700">{t(shortcut.labelKey)}</span>
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">
                {getShortcutCount(shortcut.labelKey)}
              </span>
            </Link>
          )})}
        </div>
      </div>

      {/* Bottom Menu */}
      <div className="p-4 border-t border-gray-200 space-y-1">
        <Link
          to="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            location.pathname === '/settings'
              ? 'bg-blue-50 text-blue-600 font-medium'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Settings size={20} />
          <span>{t('nav.settings')}</span>
        </Link>
        <Link
          to="/help"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            location.pathname === '/help'
              ? 'bg-blue-50 text-blue-600 font-medium'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <HelpCircle size={20} />
          <span>{t('nav.helpCenter')}</span>
        </Link>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <UserProfile />
      </div>
    </div>
  )
}
