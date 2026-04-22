import { useEffect, useState } from 'react'
import { adminService } from '../services/adminService'
import { t } from '../utils/i18n'

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
  // New fields
  payrollTotalGross: number
  payrollTotalNet: number
  payrollPaidCount: number
  payrollDraftCount: number
  payrollPendingCount: number
  departmentBreakdown: { name: string; count: number }[]
  activeEmployees: number
  inactiveEmployees: number
}

type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'UNKNOWN'

const toDateKey = (value: any): string => {
  if (!value) return ''
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().split('T')[0]
  }
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }
    return value.slice(0, 10)
  }
  if (typeof value === 'object' && value.$date) {
    return toDateKey(value.$date)
  }
  return ''
}

const toSortTimestamp = (record: any): number => {
  const candidates = [
    record?.updatedAt,
    record?.clockOut?.time,
    record?.clockIn?.time,
    record?.createdAt,
    record?.date,
  ]

  for (const value of candidates) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime()
  }
  return 0
}

const getAttendanceStatus = (record: any): AttendanceStatus => {
  const rawStatus = typeof record?.status === 'string' ? record.status.toUpperCase() : ''
  if (rawStatus === 'LATE') return 'LATE'
  if (rawStatus === 'PRESENT') return 'PRESENT'
  if (rawStatus === 'ABSENT') return 'ABSENT'
  if (record?.clockIn?.isLate) return 'LATE'
  if (record?.clockIn) return 'PRESENT'
  return 'UNKNOWN'
}

export default function Reports() {
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })
  useEffect(() => {
    loadReports()
  }, [dateRange])

  const loadReports = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [employeesData, leaveRequestsData] = await Promise.all([
        adminService.getAllEmployees(),
        adminService.getAllLeaveRequests(),
      ])

      // Attendance: fetch each day in range
      const allRecords: any[] = []
      const current = new Date(dateRange.start)
      const end = new Date(dateRange.end)
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0]
        try {
          const dayData = await adminService.getAttendanceByDate(dateStr)
          allRecords.push(...(dayData.records || []))
        } catch {
          // ignore day errors
        }
        current.setDate(current.getDate() + 1)
      }
      const dedupedAttendanceMap = new Map<string, any>()
      allRecords.forEach((record: any, index: number) => {
        const employeeKey = record?.employeeId ? String(record.employeeId) : ''
        const recordDate =
          toDateKey(record?.date) ||
          toDateKey(record?.clockIn?.time) ||
          toDateKey(record?.clockOut?.time)
        const fallbackKey = String(record?._id || `${recordDate || 'unknown'}-${index}`)
        const dedupeKey = employeeKey && recordDate ? `${employeeKey}-${recordDate}` : fallbackKey

        const existing = dedupedAttendanceMap.get(dedupeKey)
        if (!existing || toSortTimestamp(record) >= toSortTimestamp(existing)) {
          dedupedAttendanceMap.set(dedupeKey, record)
        }
      })

      const dedupedRecords = Array.from(dedupedAttendanceMap.values()).sort(
        (a, b) => toSortTimestamp(b) - toSortTimestamp(a)
      )
      setAttendanceRecords(dedupedRecords)

      // Attendance stats: normalize status to avoid double counting
      const presentCount = dedupedRecords.filter(
        (r: any) => getAttendanceStatus(r) === 'PRESENT'
      ).length
      const absentCount = dedupedRecords.filter(
        (r: any) => getAttendanceStatus(r) === 'ABSENT'
      ).length
      const lateCount = dedupedRecords.filter(
        (r: any) => getAttendanceStatus(r) === 'LATE'
      ).length
      const totalAttendance = presentCount + lateCount + absentCount

      // Department breakdown
      const deptMap = new Map<string, number>()
      employeesData.employees.forEach((emp) => {
        const dept = emp.department || 'Khác'
        deptMap.set(dept, (deptMap.get(dept) || 0) + 1)
      })
      const departmentBreakdown = Array.from(deptMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)

      // Employee stats
      const activeEmployees = employeesData.employees.filter(
        (e: any) => e.status === 'ACTIVE'
      ).length

      const reportStats: ReportStats = {
        totalEmployees: employeesData.total,
        activeEmployees,
        inactiveEmployees: employeesData.total - activeEmployees,
        totalAttendance,
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
        departments: departmentBreakdown.length,
        departmentBreakdown,
        payrollTotalGross: 0,
        payrollTotalNet: 0,
        payrollPaidCount: 0,
        payrollDraftCount: 0,
        payrollPendingCount: 0,
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

  if (!stats) return null

  const attendanceRate =
    stats.totalAttendance > 0
      ? (((stats.presentCount + stats.lateCount) / stats.totalAttendance) * 100).toFixed(1)
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
          <p className="text-gray-400 text-xs mt-1">
            ⚠️ Mỗi nhân viên chỉ có một phiếu lương mỗi tháng.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">
              {t('reports.from') || 'Từ'}:
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
            <label className="text-sm text-gray-600">{t('reports.to') || 'Đến'}:</label>
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-xs text-gray-500 mb-1">Tổng nhân viên</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</div>
          <div className="text-xs text-gray-400 mt-1">
            👤 {stats.activeEmployees} active · {stats.inactiveEmployees} inactive
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-xs text-gray-500 mb-1">Tỷ lệ có mặt</div>
          <div className="text-2xl font-bold text-green-600">{attendanceRate}%</div>
          <div className="text-xs text-gray-400 mt-1">trong kỳ báo cáo</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-xs text-gray-500 mb-1">Đi muộn</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.lateCount}</div>
          <div className="text-xs text-gray-400 mt-1">lần</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-xs text-gray-500 mb-1">Nghỉ phép</div>
          <div className="text-2xl font-bold text-blue-600">{stats.totalLeaveRequests}</div>
          <div className="text-xs text-gray-400 mt-1">
            {stats.pendingLeaveRequests} chờ duyệt
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-xs text-gray-500 mb-1">Phòng ban</div>
          <div className="text-2xl font-bold text-purple-600">{stats.departments}</div>
          <div className="text-xs text-gray-400 mt-1">phòng ban</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-xs text-gray-500 mb-1">Bản ghi chấm công</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalAttendance}</div>
          <div className="text-xs text-gray-400 mt-1">trong kỳ</div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Chấm công</h2>
          <div className="space-y-3">
            {[
              { label: 'Có mặt', value: stats.presentCount, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Đi muộn', value: stats.lateCount, color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'Vắng', value: stats.absentCount, color: 'text-red-600', bg: 'bg-red-50' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${row.bg} ${row.color}`}>
                    {row.value}
                  </div>
                  <span className="text-gray-600">{row.label}</span>
                </div>
                <span className={`text-lg font-semibold ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Requests */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nghỉ phép</h2>
          <div className="space-y-3">
            {[
              { label: 'Chờ duyệt', value: stats.pendingLeaveRequests, color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'Đã duyệt', value: stats.approvedLeaveRequests, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Từ chối', value: stats.rejectedLeaveRequests, color: 'text-red-600', bg: 'bg-red-50' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${row.bg} ${row.color}`}>
                    {row.value}
                  </div>
                  <span className="text-gray-600">{row.label}</span>
                </div>
                <span className={`text-lg font-semibold ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Phân bổ nhân viên theo phòng ban</h2>
        <div className="space-y-3">
          {stats.departmentBreakdown.map((dept) => {
            const pct = stats.totalEmployees > 0
              ? ((dept.count / stats.totalEmployees) * 100).toFixed(1)
              : '0'
            return (
              <div key={dept.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{dept.name}</span>
                  <span className="text-gray-500">{dept.count} nhân viên ({pct}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
          {stats.departmentBreakdown.length === 0 && (
            <p className="text-gray-400 text-sm">Không có dữ liệu phòng ban</p>
          )}
        </div>
      </div>

      {/* Attendance Records Table */}
      {attendanceRecords.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Bản ghi chấm công gần đây
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Ngày</th>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Mã NV</th>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Nhân viên</th>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Giờ vào</th>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Giờ ra</th>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.slice(0, 20).map((r: any, i: number) => {
                  const status = getAttendanceStatus(r)
                  const statusColorClass =
                    status === 'PRESENT'
                      ? 'bg-green-100 text-green-700'
                      : status === 'LATE'
                      ? 'bg-yellow-100 text-yellow-700'
                      : status === 'ABSENT'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  const statusLabel =
                    status === 'PRESENT'
                      ? 'Có mặt'
                      : status === 'LATE'
                      ? 'Muộn'
                      : status === 'ABSENT'
                      ? 'Vắng'
                      : 'Không rõ'

                  return (
                    <tr key={r._id || i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-700">{r.date || r.clockIn?.time?.split('T')[0] || '—'}</td>
                      <td className="py-2 px-3 text-gray-500">{r.employeeId || '—'}</td>
                      <td className="py-2 px-3 font-medium text-gray-900">{r.name || r.employeeName || '—'}</td>
                      <td className="py-2 px-3 text-gray-700">
                        {r.clockIn?.time
                          ? new Date(r.clockIn.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="py-2 px-3 text-gray-700">
                        {r.clockOut?.time
                          ? new Date(r.clockOut.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColorClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {attendanceRecords.length > 20 && (
              <p className="text-gray-400 text-xs mt-2 text-center">
                Hiển thị 20/{attendanceRecords.length} bản ghi
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
