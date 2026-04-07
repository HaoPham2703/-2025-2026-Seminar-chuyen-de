import { useState } from 'react'
import { t } from '../../utils/i18n'
import { SHIFT_DEFAULTS, getShiftLabel, type DailySchedule, type ShiftType } from '../../services/scheduleService'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (schedule: { shiftType: ShiftType; startTime: string; endTime: string }) => void
  onDelete?: () => void
  employeeName: string
  date: string         // "YYYY-MM-DD"
  existingSchedule?: DailySchedule | null
}

export default function ScheduleModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  employeeName,
  date,
  existingSchedule,
}: ScheduleModalProps) {
  const [shiftType, setShiftType] = useState<ShiftType>(
    existingSchedule?.shiftType || 'FULL_DAY'
  )
  const [startTime, setStartTime] = useState(
    existingSchedule?.startTime || SHIFT_DEFAULTS['FULL_DAY'].startTime
  )
  const [endTime, setEndTime] = useState(
    existingSchedule?.endTime || SHIFT_DEFAULTS['FULL_DAY'].endTime
  )
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleShiftTypeChange = (type: ShiftType) => {
    setShiftType(type)
    if (type !== 'CUSTOM') {
      setStartTime(SHIFT_DEFAULTS[type].startTime)
      setEndTime(SHIFT_DEFAULTS[type].endTime)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({ shiftType, startTime, endTime })
    } finally {
      setSaving(false)
    }
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00')
      return d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })
    } catch {
      return dateStr
    }
  }

  const SHIFT_OPTIONS: ShiftType[] = ['MORNING', 'AFTERNOON', 'NIGHT', 'FULL_DAY', 'OFF', 'CUSTOM']

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{t('schedule.shiftTitle')}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {employeeName} — {formatDate(date)}
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Shift Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('schedule.shiftType')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SHIFT_OPTIONS.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleShiftTypeChange(type)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                    shiftType === type
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t(`schedule.${type.toLowerCase()}`) || getShiftLabel(type)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Time Inputs */}
          {shiftType === 'CUSTOM' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('schedule.startTime')}
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('schedule.endTime')}
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Summary */}
          {shiftType !== 'OFF' && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              <span className="font-medium">Giờ làm việc: </span>
              {startTime || '--:--'} → {endTime || '--:--'}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            {existingSchedule && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2 border border-red-300 rounded-lg text-red-600 font-medium hover:bg-red-50 transition-colors cursor-pointer"
              >
                {t('schedule.delete')}
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? (t('common.saving') || 'Đang lưu...') : (t('common.save') || 'Lưu')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}