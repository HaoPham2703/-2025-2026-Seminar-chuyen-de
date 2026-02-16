import { api } from './api'

export interface AttendanceRecord {
  _id: string
  employeeId: string
  date: string
  clockIn?: {
    time: string
    location?: string
    method: string
  }
  clockOut?: {
    time: string
    location?: string
    method: string
  }
  workDuration: number
  overtimeDuration: number
  breakDuration: number
  status: string
}

export interface AttendanceHistoryResponse {
  records: AttendanceRecord[]
  total: number
}

export const attendanceService = {
  async getCurrent(employeeId: string): Promise<AttendanceRecord | null> {
    const response = await api.get<AttendanceRecord>(
      `/attendance/current?employeeId=${employeeId}`
    )
    return response.data || null
  },

  async getHistory(
    employeeId: string,
    startDate?: string,
    endDate?: string
  ): Promise<AttendanceHistoryResponse> {
    let url = `/attendance/history?employeeId=${employeeId}`
    if (startDate) url += `&startDate=${startDate}`
    if (endDate) url += `&endDate=${endDate}`
    
    const response = await api.get<AttendanceHistoryResponse>(url)
    return response.data || { records: [], total: 0 }
  },

  async clockIn(employeeId: string, location?: string, qrCode?: string) {
    const response = await api.post('/attendance/clock-in', {
      employeeId,
      location,
      qrCode,
      method: 'ADMIN_DASHBOARD',
    })
    return response.data
  },

  async clockOut(employeeId: string, location?: string) {
    const response = await api.post('/attendance/clock-out', {
      employeeId,
      location,
      method: 'ADMIN_DASHBOARD',
    })
    return response.data
  },
}
