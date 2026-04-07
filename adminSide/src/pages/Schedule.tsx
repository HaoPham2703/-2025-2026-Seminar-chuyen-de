import { useEffect, useState } from 'react'
import { ChevronRight, Search, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react'
import { adminService, type Employee } from '../services/adminService'
import {
  getWeekSchedules,
  upsertDailySchedule,
  deleteDailySchedule,
  getScheduleLogs,
  SHIFT_COLORS,
  getShiftLabel,
  type DailySchedule,
  type WeekSchedule,
  type ScheduleLog,
  type ShiftType,
} from '../services/scheduleService'
import { t } from '../utils/i18n'
import { useLanguage } from '../contexts/LanguageContext'
import ScheduleModal from '../components/schedule/ScheduleModal'

export default function Schedule() {
  const { language } = useLanguage()

  // ─── State: Employees ───────────────────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ─── State: Week Navigation ──────────────────────────────────────────────
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday as first day
    const monday = new Date(now)
    monday.setDate(diff)
    return monday
  })

  // ─── State: Schedules ────────────────────────────────────────────────────
  const [weekSchedules, setWeekSchedules] = useState<WeekSchedule>({})
  const [loadingSchedules, setLoadingSchedules] = useState(false)

  // ─── State: Modal ──────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{
    employeeId: string
    employeeName: string
    date: string
    existing: DailySchedule | null
  } | null>(null)

  // ─── State: Tab ─────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'schedule' | 'history'>('schedule')

  // ─── State: Schedule Filter ──────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')

  // ─── Filtered Employees ─────────────────────────────────────────────────
  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ─── State: History ─────────────────────────────────────────────────────
  const [logs, setLogs] = useState<ScheduleLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [logFilterEmployee, setLogFilterEmployee] = useState('')

  // ─── Load Employees ────────────────────────────────────────────────────
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await adminService.getAllEmployees()
        setEmployees(data.employees || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load employees')
      } finally {
        setIsLoading(false)
      }
    }
    loadEmployees()
  }, [])

  // ─── Load Week Schedules ────────────────────────────────────────────────
  useEffect(() => {
    const loadSchedules = async () => {
      try {
        setLoadingSchedules(true)
        const weekStart = selectedWeek.toISOString().split('T')[0]
        const data = await getWeekSchedules(weekStart)
        setWeekSchedules(data)
      } catch (err: any) {
        console.error('Failed to load schedules:', err)
        // Silent fail — show default schedule
      } finally {
        setLoadingSchedules(false)
      }
    }
    loadSchedules()
  }, [selectedWeek])

  // ─── Load Logs when History tab is active ──────────────────────────────
  useEffect(() => {
    if (activeTab !== 'history') return
    const loadLogs = async () => {
      try {
        setLoadingLogs(true)
        const data = await getScheduleLogs(logFilterEmployee || undefined)
        setLogs(data)
      } catch (err: any) {
        console.error('Failed to load logs:', err)
      } finally {
        setLoadingLogs(false)
      }
    }
    loadLogs()
  }, [activeTab, logFilterEmployee])

  // ─── Helpers ────────────────────────────────────────────────────────────
  const getWeekDates = (date: Date) => {
    const week = []
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek)
      currentDate.setDate(startOfWeek.getDate() + i)
      week.push(currentDate)
    }
    return week
  }

  const weekDates = getWeekDates(selectedWeek)

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedWeek)
    newDate.setDate(selectedWeek.getDate() + (direction === 'next' ? 7 : -7))
    setSelectedWeek(newDate)
  }

  const getScheduleForCell = (employeeId: string, date: Date): DailySchedule | null => {
    const dateStr = date.toISOString().split('T')[0]
    return weekSchedules[employeeId]?.[dateStr] || null
  }

  const openScheduleModal = (employeeId: string, employeeName: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const existing = getScheduleForCell(employeeId, date)
    setSelectedCell({ employeeId, employeeName, date: dateStr, existing })
    setShowModal(true)
  }

  const handleSaveSchedule = async (payload: {
    shiftType: ShiftType
    startTime: string
    endTime: string
  }) => {
    if (!selectedCell) return

    try {
      await upsertDailySchedule({
        employeeId: selectedCell.employeeId,
        date: selectedCell.date,
        shiftType: payload.shiftType,
        startTime: payload.startTime,
        endTime: payload.endTime,
      })
      // Reload schedules
      const weekStart = selectedWeek.toISOString().split('T')[0]
      const data = await getWeekSchedules(weekStart)
      setWeekSchedules(data)
      setShowModal(false)
      setSelectedCell(null)
    } catch (err: any) {
      alert(err.message || 'Failed to save schedule')
    }
  }

  const handleDeleteSchedule = async () => {
    if (!selectedCell?.existing) return

    try {
      await deleteDailySchedule(selectedCell.existing._id)
      const weekStart = selectedWeek.toISOString().split('T')[0]
      const data = await getWeekSchedules(weekStart)
      setWeekSchedules(data)
      setShowModal(false)
      setSelectedCell(null)
    } catch (err: any) {
      alert(err.message || 'Failed to delete schedule')
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      weekday: 'short',
    })
  }

  const formatDateFull = (date: Date) => {
    return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      day: 'numeric',
      month: 'short',
    })
  }

  const formatChangedAt = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // ─── Loading ────────────────────────────────────────────────────────────
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
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.schedule')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('schedule.weeklyView') || 'Weekly Schedule View'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigateWeek('prev')}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-sm"
          >
            ← {t('common.previous') || 'Prev'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedWeek(() => {
              const now = new Date()
              const day = now.getDay()
              const diff = now.getDate() - day + (day === 0 ? -6 : 1)
              const monday = new Date(now)
              monday.setDate(diff)
              return monday
            })}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-sm"
          >
            {t('dashboard.today')}
          </button>
          <button
            type="button"
            onClick={() => navigateWeek('next')}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-sm"
          >
            {t('common.next') || 'Next'} →
          </button>
        </div>
      </div>

      {/* ─── Tabs ────────────────────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'schedule'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('schedule.schedules') || 'Lịch trình'}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('schedule.history') || 'Lịch sử'}
        </button>
      </div>

      {/* ─── TAB: SCHEDULE ──────────────────────────────────────────── */}
      {activeTab === 'schedule' && (
        <>
          {loadingSchedules && (
            <div className="text-center text-sm text-gray-500 py-4">{t('common.loading')}</div>
          )}

          {/* Search Bar */}
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={t('common.search') + ' nhân viên...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-8 gap-px bg-gray-200">
              {/* Empty top-left corner */}
              <div className="bg-gray-50 p-3 font-medium text-xs text-gray-500 uppercase" />

              {/* Day headers */}
              {weekDates.map((date, idx) => {
                const isToday = date.toDateString() === new Date().toDateString()
                return (
                  <div
                    key={idx}
                    className={`bg-gray-50 p-3 text-center ${isToday ? 'bg-orange-50 border-b-2 border-orange-400' : ''}`}
                  >
                    <div className="text-xs font-semibold text-gray-500 uppercase">
                      {formatDate(date)}
                    </div>
                    <div className={`text-base font-bold mt-0.5 ${isToday ? 'text-orange-600' : 'text-gray-900'}`}>
                      {date.getDate()}
                    </div>
                  </div>
                )
              })}

              {/* Employee rows */}
              {filteredEmployees.length === 0 ? (
                <div className="col-span-8 p-8 text-center text-gray-400">
                  {t('common.noResults') || t('common.noData')}
                </div>
              ) : (
                filteredEmployees.map((employee) => (
                  <div key={employee._id} className="contents">
                    {/* Employee name cell */}
                    <div className="bg-white p-3 flex flex-col justify-center">
                      <span className="text-sm font-medium text-gray-900">{employee.name}</span>
                      <span className="text-xs text-gray-400 mt-0.5">{employee.department}</span>
                    </div>

                    {/* Schedule cells */}
                    {weekDates.map((date, dayIdx) => {
                      const isToday = date.toDateString() === new Date().toDateString()
                      const schedule = getScheduleForCell(employee._id, date)

                      return (
                        <div
                          key={dayIdx}
                          onClick={() => openScheduleModal(employee._id, employee.name, date)}
                          className={`bg-white p-2 text-center cursor-pointer hover:bg-blue-50 transition-colors min-h-[56px] flex items-center justify-center ${
                            isToday ? 'bg-orange-50' : ''
                          } ${schedule ? '' : ''}`}
                        >
                          {schedule ? (
                            <div className="w-full">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${SHIFT_COLORS[schedule.shiftType] || 'bg-gray-100 text-gray-700'}`}>
                                {getShiftLabel(schedule.shiftType)}
                              </span>
                              {schedule.shiftType !== 'OFF' && (
                                <div className="text-[10px] text-gray-500 mt-0.5">
                                  {schedule.startTime}–{schedule.endTime}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-300">
                              {t('schedule.default') || '9:00-18:00'}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3">
            {(['MORNING', 'AFTERNOON', 'NIGHT', 'FULL_DAY', 'OFF', 'CUSTOM'] as ShiftType[]).map((type) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className={`inline-block w-3 h-3 rounded ${SHIFT_COLORS[type]?.replace('text-', 'bg-').replace('-800', '-600') || 'bg-gray-300'}`} />
                <span className="text-xs text-gray-600">{getShiftLabel(type)}</span>
              </div>
            ))}
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              {t('schedule.info')}
            </p>
          </div>
        </>
      )}

      {/* ─── TAB: HISTORY ─────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <>
          {/* Filter */}
          <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-4">
            <label className="text-sm text-gray-600">{t('attendance.employee')}:</label>
            <select
              value={logFilterEmployee}
              onChange={(e) => setLogFilterEmployee(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- {t('common.all') || 'Tất cả'} --</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {loadingLogs ? (
              <div className="p-12 text-center text-gray-500">{t('common.loading')}</div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                {t('common.noData') || 'Chưa có lịch sử thay đổi nào'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                        {t('attendance.employee')}
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                        {t('schedule.changedBy')}
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                        {t('schedule.before')}
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                        {t('schedule.after')}
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                        {t('schedule.reason')}
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Thời gian
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {log.employeeName || log.employeeId}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {log.changedByName || log.changedBy}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {log.before ? (
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${SHIFT_COLORS[log.before.shiftType] || 'bg-gray-100 text-gray-700'}`}>
                              {getShiftLabel(log.before.shiftType)} ({log.before.startTime}–{log.before.endTime})
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {log.after ? (
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${SHIFT_COLORS[log.after.shiftType] || 'bg-gray-100 text-gray-700'}`}>
                              {getShiftLabel(log.after.shiftType)} ({log.after.startTime}–{log.after.endTime})
                            </span>
                          ) : (
                            <span className="text-xs text-red-400 italic">Đã xóa lịch tùy chỉnh</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-[150px] truncate">
                          {log.reason || <span className="text-gray-300 italic">—</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatChangedAt(log.changedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── Modal ────────────────────────────────────────────────────── */}
      {showModal && selectedCell && (
        <ScheduleModal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setSelectedCell(null) }}
          onSave={handleSaveSchedule}
          onDelete={selectedCell.existing ? handleDeleteSchedule : undefined}
          employeeName={selectedCell.employeeName}
          date={selectedCell.date}
          existingSchedule={selectedCell.existing}
        />
      )}
    </div>
  )
}
