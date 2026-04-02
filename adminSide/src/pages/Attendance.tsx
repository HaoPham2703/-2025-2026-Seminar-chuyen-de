import { useEffect, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { adminService, type Employee } from '../services/adminService'
import { t } from '../utils/i18n'

interface AttendanceRecord {
  _id: string
  employeeId: string
  date: string
  clockIn?: {
    time: string
    location?: string
    qrCode?: string
  }
  clockOut?: {
    time: string
    location?: string
    qrCode?: string
  }
  status: string
  workDuration?: number
  overtimeDuration?: number
  breakDuration?: number
}

interface AttendanceRecordWithEmployee extends AttendanceRecord {
  employeeName?: string
  employeeDepartment?: string
}

export default function Attendance() {
  const [records, setRecords] = useState<AttendanceRecordWithEmployee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const { language } = useLanguage()

  useEffect(() => {
    loadData()
  }, [selectedDate])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Load employees first
      console.log('🔄 Loading employees...')
      const employeesData = await adminService.getAllEmployees()
      const employeesMap = new Map<string, Employee>()
      employeesData.employees.forEach((emp) => {
        employeesMap.set(emp._id, emp)
      })
      // Load attendance records
      console.log('🔄 Loading attendance records...')
      const attendanceData = await adminService.getTodayAttendance()
      console.log('✅ Attendance records loaded:', attendanceData)
      
      // Map employee info to records
      const recordsWithEmployee: AttendanceRecordWithEmployee[] = (attendanceData.records || []).map((record: AttendanceRecord) => {
        const employee = employeesMap.get(record.employeeId)
        return {
          ...record,
          employeeName: employee?.name || record.employeeId,
          employeeDepartment: employee?.department || 'N/A',
        }
      })
      
      setRecords(recordsWithEmployee)
    } catch (err: any) {
      console.error('❌ Failed to load data:', err)
      setError(err.message || 'Failed to load attendance records')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    return date.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (minutes?: number) => {
    if (minutes === undefined || minutes === null) return '-'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    const hoursStr = String(hours).padStart(2, '0')
    const minsStr = String(mins).padStart(2, '0')
    return `${hoursStr}:${minsStr}`
  }

  const getWorkDurationMinutes = (record: AttendanceRecord) => {
    if (record.workDuration !== undefined && record.workDuration !== null) {
      return record.workDuration
    }
    if (!record.clockIn?.time || !record.clockOut?.time) return undefined

    const toDate = (timeValue: string) => {
      if (timeValue.includes('T') || timeValue.includes('-')) {
        return new Date(timeValue)
      }
      return new Date(`${selectedDate}T${timeValue}`)
    }

    const start = toDate(record.clockIn.time)
    const end = toDate(record.clockOut.time)
    const diffMs = end.getTime() - start.getTime()
    if (Number.isNaN(diffMs) || diffMs <= 0) return 0
    return Math.floor(diffMs / 60000)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      PRESENT: {
        text: t('status.present'),
        className: 'bg-green-100 text-green-800',
      },
      LATE: {
        text: t('status.late'),
        className: 'bg-yellow-100 text-yellow-800',
      },
      ABSENT: {
        text: t('status.absent'),
        className: 'bg-red-100 text-red-800',
      },
      SICK: {
        text: t('status.sick'),
        className: 'bg-blue-100 text-blue-800',
      },
      WFH: {
        text: t('status.wfh'),
        className: 'bg-purple-100 text-purple-800',
      },
    }

    const statusInfo = statusMap[status] || {
      text: status,
      className: 'bg-gray-100 text-gray-800',
    }

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}
      >
        {statusInfo.text}
      </span>
    )
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.attendance')}</h1>
          <p className="text-gray-600 mt-1">
            {t('dashboard.today')}: {new Date(selectedDate).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          <button
            type="button"
            onClick={loadData}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors cursor-pointer"
          >
            {t('common.refresh') || 'Refresh'}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">{t('dashboard.present')}</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {records.filter((r) => r.status === 'PRESENT' || r.clockIn).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">{t('status.late')}</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {records.filter((r) => r.status === 'LATE').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">{t('status.absent')}</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {records.filter((r) => r.status === 'ABSENT' || !r.clockIn).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">{t('common.total') || 'Total'}</div>
          <div className="text-2xl font-bold text-gray-600 mt-1">
            {records.length}
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('attendance.employee') || 'Employee'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('attendance.clockIn') || 'Clock In'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('attendance.clockOut') || 'Clock Out'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('attendance.workHours') || 'Work Hours'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('attendance.status') || 'Status'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {t('attendance.noRecords') || 'No attendance records found'}
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.employeeName || record.employeeId}
                      </div>
                      <div className="text-xs text-gray-500">{record.employeeDepartment}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.clockIn ? formatTime(record.clockIn.time) : '-'}
                      </div>
                      {record.clockIn?.location && (
                        <div className="text-xs text-gray-500">{record.clockIn.location}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.clockOut ? formatTime(record.clockOut.time) : '-'}
                      </div>
                      {record.clockOut?.location && (
                        <div className="text-xs text-gray-500">{record.clockOut.location}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDuration(getWorkDurationMinutes(record))}
                      </div>
                      {record.overtimeDuration && record.overtimeDuration > 0 && (
                        <div className="text-xs text-orange-600">
                          OT: {formatDuration(record.overtimeDuration)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
