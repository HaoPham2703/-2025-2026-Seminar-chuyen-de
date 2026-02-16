import { useEffect, useState } from 'react'
import { adminService, type Employee } from '../services/adminService'
import { t } from '../utils/i18n'
import { useLanguage } from '../contexts/LanguageContext'

export default function Schedule() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const { language } = useLanguage()

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('🔄 Loading employees...')
      const data = await adminService.getAllEmployees()
      console.log('✅ Employees loaded:', data)
      setEmployees(data.employees || [])
    } catch (err: any) {
      console.error('❌ Failed to load employees:', err)
      setError(err.message || 'Failed to load employees')
    } finally {
      setIsLoading(false)
    }
  }

  const getWeekDates = (date: Date) => {
    const week = []
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Monday as first day
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
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.schedule')}</h1>
          <p className="text-gray-600 mt-1">
            {t('schedule.weeklyView') || 'Weekly Schedule View'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigateWeek('prev')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            ← {t('common.previous') || 'Previous'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedWeek(new Date())}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {t('dashboard.today')}
          </button>
          <button
            type="button"
            onClick={() => navigateWeek('next')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {t('common.next') || 'Next'} →
          </button>
        </div>
      </div>

      {/* Week Calendar Header */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-8 gap-px bg-gray-200">
          {/* Employee column header */}
          <div className="bg-gray-50 p-4 font-medium text-gray-700">
            {t('attendance.employee')}
          </div>
          {/* Day headers */}
          {weekDates.map((date, index) => {
            const isToday = date.toDateString() === new Date().toDateString()
            return (
              <div
                key={index}
                className={`bg-gray-50 p-4 text-center ${
                  isToday ? 'bg-orange-50 border-b-2 border-orange-500' : ''
                }`}
              >
                <div className="text-sm font-medium text-gray-700">
                  {date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
                    weekday: 'short',
                  })}
                </div>
                <div
                  className={`text-lg font-bold mt-1 ${
                    isToday ? 'text-orange-600' : 'text-gray-900'
                  }`}
                >
                  {date.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Employee rows */}
        <div className="divide-y divide-gray-200">
          {employees.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {t('common.noData')}
            </div>
          ) : (
            employees.slice(0, 20).map((employee) => (
              <div key={employee._id} className="grid grid-cols-8 gap-px bg-gray-200">
                {/* Employee name */}
                <div className="bg-white p-4">
                  <div className="text-sm font-medium text-gray-900">
                    {employee.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {employee.department}
                  </div>
                </div>
                {/* Schedule cells */}
                {weekDates.map((date, dayIndex) => {
                  const isToday = date.toDateString() === new Date().toDateString()
                  return (
                    <div
                      key={dayIndex}
                      className={`bg-white p-2 text-center ${
                        isToday ? 'bg-orange-50' : ''
                      }`}
                    >
                      <div className="text-xs text-gray-400">
                        {t('schedule.default') || '9:00 - 18:00'}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          {t('schedule.info') ||
            'Schedule information will be displayed here. Click on a cell to edit schedule.'}
        </p>
      </div>
    </div>
  )
}
