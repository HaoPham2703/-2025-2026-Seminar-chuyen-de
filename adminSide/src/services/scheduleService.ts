import { api } from './api'

export type ShiftType = 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'FULL_DAY' | 'OFF' | 'CUSTOM'

export interface DailySchedule {
  _id: string
  employeeId: string
  date: string          // "YYYY-MM-DD"
  shiftType: ShiftType
  startTime: string    // "HH:MM"
  endTime: string      // "HH:MM"
  isOverridden: boolean
}

export interface WeekSchedule {
  [employeeId: string]: {
    [date: string]: DailySchedule
  }
}

export interface ScheduleLog {
  _id: string
  employeeId: string
  employeeName: string | null
  changedBy: string
  changedByName: string | null
  before: { shiftType: ShiftType; startTime: string; endTime: string } | null
  after: { shiftType: ShiftType; startTime: string; endTime: string } | null
  reason: string | null
  changedAt: string
}

// ─── API Calls ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/schedules/daily?weekStart=YYYY-MM-DD
 * Returns: { [employeeId]: { [date]: DailySchedule } }
 */
export async function getWeekSchedules(weekStart: string): Promise<WeekSchedule> {
  const response = await api.get<WeekSchedule>(`/admin/schedules/daily?weekStart=${encodeURIComponent(weekStart)}`)
  if (!response.success) throw new Error(response.message || 'Failed to load schedules')
  return response.data || {}
}

/**
 * POST /api/admin/schedules/daily
 * Creates or updates a daily schedule for an employee
 */
export async function upsertDailySchedule(payload: {
  employeeId: string
  date: string
  shiftType: ShiftType
  startTime?: string
  endTime?: string
  reason?: string
}): Promise<{ id: string }> {
  const response = await api.post<{ id: string }>('/admin/schedules/daily', payload)
  if (!response.success) throw new Error(response.message || 'Failed to save schedule')
  return response.data!
}

/**
 * DELETE /api/admin/schedules/daily/:id
 * Removes a custom schedule — employee returns to default
 */
export async function deleteDailySchedule(id: string): Promise<void> {
  const response = await api.delete(`/admin/schedules/daily/${id}`)
  if (!response.success) throw new Error(response.message || 'Failed to delete schedule')
}

/**
 * GET /api/admin/schedules/logs?employeeId?&limit=50
 * Returns: { logs: ScheduleLog[] }
 */
export async function getScheduleLogs(employeeId?: string, limit = 50): Promise<ScheduleLog[]> {
  let url = `/admin/schedules/logs?limit=${limit}`
  if (employeeId) url += `&employeeId=${encodeURIComponent(employeeId)}`
  const response = await api.get<{ logs: ScheduleLog[] }>(url)
  if (!response.success) throw new Error(response.message || 'Failed to load schedule logs')
  return response.data?.logs || []
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const SHIFT_DEFAULTS: Record<ShiftType, { label: string; startTime: string; endTime: string }> = {
  MORNING:   { label: 'Ca sáng',        startTime: '08:00', endTime: '12:00' },
  AFTERNOON: { label: 'Ca chiều',       startTime: '13:00', endTime: '17:00' },
  NIGHT:     { label: 'Ca tối',         startTime: '18:00', endTime: '22:00' },
  FULL_DAY:  { label: 'Cả ngày',        startTime: '09:00', endTime: '18:00' },
  OFF:       { label: 'Nghỉ',           startTime: '',      endTime: '' },
  CUSTOM:    { label: 'Tùy chỉnh',      startTime: '09:00', endTime: '18:00' },
}

export const SHIFT_COLORS: Record<ShiftType, string> = {
  MORNING:   'bg-yellow-100 text-yellow-800',
  AFTERNOON: 'bg-orange-100 text-orange-800',
  NIGHT:     'bg-indigo-100 text-indigo-800',
  FULL_DAY:  'bg-blue-100 text-blue-800',
  OFF:       'bg-red-100 text-red-800',
  CUSTOM:    'bg-green-100 text-green-800',
}

export function getShiftLabel(shiftType: ShiftType): string {
  return SHIFT_DEFAULTS[shiftType]?.label || shiftType
}
