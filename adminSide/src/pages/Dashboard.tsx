import { useEffect, useState } from 'react'
import AttendanceReportCard from '../components/dashboard/AttendanceReportCard'
import TasksCard from '../components/dashboard/TasksCard'
import ScheduleCard from '../components/dashboard/ScheduleCard'
import LeaveRequestsCard from '../components/dashboard/LeaveRequestsCard'
import InternshipCard from '../components/dashboard/InternshipCard'
import { adminService, type DashboardData } from '../services/adminService'
import { t } from '../utils/i18n'

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('🔄 Loading dashboard data...')
      const dashboardData = await adminService.getDashboardData()
      console.log('✅ Dashboard data loaded:', dashboardData)
      setData(dashboardData)
    } catch (err: any) {
      console.error('❌ Failed to load dashboard data:', err)
      console.error('Error details:', {
        message: err.message,
        stack: err.stack
      })
      setError(err.message || 'Failed to load dashboard data')
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

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Report */}
        <div className="lg:col-span-1">
          <AttendanceReportCard
            absent={data.attendance.absent}
            present={data.attendance.present}
            sick={data.attendance.sick}
            wfh={data.attendance.wfh}
          />
        </div>

        {/* Tasks */}
        <div className="lg:col-span-1">
          <TasksCard />
        </div>

        {/* Schedule */}
        <div className="lg:col-span-1">
          <ScheduleCard />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Requests */}
        <div>
          <LeaveRequestsCard leaveRequests={data.leaveRequests} />
        </div>

        {/* Employees */}
        <div>
          <InternshipCard totalEmployees={data.statistics.totalEmployees} />
        </div>
      </div>
    </div>
  )
}
