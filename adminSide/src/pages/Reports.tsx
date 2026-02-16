import { useEffect, useState } from 'react'
import { adminService, type Employee, type LeaveRequest } from '../services/adminService'
import { t } from '../utils/i18n'
import { useLanguage } from '../contexts/LanguageContext'

interface ReportStats {
  totalEmployees: number
  totalAttendance: number
  presentCount: number
  absentCount: number
  lateCount: number
  totalLeaveRequests: number
  pendingLeaveRequests: number
  approvedLeaveRequests: number
  rejectedLeaveRequests: number
  departments: number
}

export default function Reports() {
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })
  const { language } = useLanguage()

  useEffect(() => {
    loadReports()
  }, [dateRange])

  const loadReports = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('🔄 Loading reports data...')

      // Load all data in parallel
      const [employeesData, attendanceData, leaveRequestsData] = await Promise.all([
        adminService.getAllEmployees(),
        adminService.getTodayAttendance(),
        adminService.getAllLeaveRequests(),
      ])

      console.log('✅ Reports data loaded')

      setEmployees(employeesData.employees || [])
      setLeaveRequests(leaveRequestsData.requests || [])

      // Calculate statistics
      const attendanceRecords = attendanceData.records || []
      const presentCount = attendanceRecords.filter(
        (r: any) => r.status === 'PRESENT' || r.clockIn
      ).length
      const absentCount = attendanceRecords.filter(
        (r: any) => r.status === 'ABSENT' || !r.clockIn
      ).length
      const lateCount = attendanceRecords.filter((r: any) => r.status === 'LATE').length

      // Group employees by department
      const departmentSet = new Set<string>()
      employeesData.employees.forEach((emp) => {
        if (emp.department && emp.department !== 'N/A') {
          departmentSet.add(emp.department)
        }
      })

      const reportStats: ReportStats = {
        totalEmployees: employeesData.total,
        totalAttendance: attendanceRecords.length,
        presentCount,
        absentCount,
        lateCount,
        totalLeaveRequests: leaveRequestsData.total,
        pendingLeaveRequests: leaveRequestsData.requests.filter(
          (lr) => lr.status === 'PENDING'
        ).length,
        approvedLeaveRequests: leaveRequestsData.requests.filter(
          (lr) => lr.status === 'APPROVED'
        ).length,
        rejectedLeaveRequests: leaveRequestsData.requests.filter(
          (lr) => lr.status === 'REJECTED'
        ).length,
        departments: departmentSet.size,
      }

      setStats(reportStats)
    } catch (err: any) {
      console.error('❌ Failed to load reports:', err)
      setError(err.message || 'Failed to load reports')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">{t('common.loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const attendanceRate =
    stats.totalEmployees > 0
      ? ((stats.presentCount / stats.totalEmployees) * 100).toFixed(1)
      : '0'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.reports')}</h1>
          <p className="text-gray-600 mt-1">
            {t('reports.summary') || 'Summary and Analytics'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">
              {t('reports.from') || 'From'}:
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">{t('reports.to') || 'To'}:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <button
            type="button"
            onClick={loadReports}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors cursor-pointer"
          >
            {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">
                {t('reports.totalEmployees') || 'Total Employees'}
              </div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {stats.totalEmployees}
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">
                {t('reports.attendanceRate') || 'Attendance Rate'}
              </div>
              <div className="text-3xl font-bold text-green-600 mt-2">
                {attendanceRate}%
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">
                {t('reports.pendingRequests') || 'Pending Requests'}
              </div>
              <div className="text-3xl font-bold text-yellow-600 mt-2">
                {stats.pendingLeaveRequests}
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">
                {t('departments.totalDepartments')}
              </div>
              <div className="text-3xl font-bold text-purple-600 mt-2">
                {stats.departments}
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🏢</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('reports.attendanceStats') || 'Attendance Statistics'}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('dashboard.present')}</span>
              <span className="text-lg font-semibold text-green-600">
                {stats.presentCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('status.late')}</span>
              <span className="text-lg font-semibold text-yellow-600">
                {stats.lateCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('status.absent')}</span>
              <span className="text-lg font-semibold text-red-600">
                {stats.absentCount}
              </span>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-900 font-medium">
                  {t('reports.totalAttendance') || 'Total Attendance Records'}
                </span>
                <span className="text-lg font-semibold text-gray-900">
                  {stats.totalAttendance}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Requests Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('reports.leaveRequestsStats') || 'Leave Requests Statistics'}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('common.pending')}</span>
              <span className="text-lg font-semibold text-yellow-600">
                {stats.pendingLeaveRequests}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('common.approved')}</span>
              <span className="text-lg font-semibold text-green-600">
                {stats.approvedLeaveRequests}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('common.rejected')}</span>
              <span className="text-lg font-semibold text-red-600">
                {stats.rejectedLeaveRequests}
              </span>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-900 font-medium">
                  {t('reports.totalRequests') || 'Total Requests'}
                </span>
                <span className="text-lg font-semibold text-gray-900">
                  {stats.totalLeaveRequests}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
