import { api } from './api'

export interface DashboardData {
  attendance: {
    absent: Array<{
      _id: string
      name: string
      department: string
      status: string
    }>
    present: Array<{
      _id: string
      name: string
      department: string
      status: string
      time: string
    }>
    sick: Array<{
      _id: string
      name: string
      department: string
      status: string
    }>
    wfh: Array<{
      _id: string
      name: string
      department: string
      status: string
    }>
  }
  leaveRequests: Array<{
    _id: string
    name: string
    role: string
    type: string
    dateRange: string
    status: string
  }>
  statistics: {
    totalEmployees: number
    presentCount: number
    absentCount: number
    pendingLeaveRequests: number
  }
}

export interface Employee {
  _id: string
  employeeId: string
  name: string
  email: string
  department: string
  position: string
  phone: string
}

export interface LeaveRequest {
  _id: string
  employeeId: string
  employeeName: string
  employeeRole: string
  type: string
  startDate: string
  endDate: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  reviewedBy?: string
  reviewedAt?: string
}

export interface PayrollFormulaSettings {
  overtimeMultiplier: number
  latePenaltyPerLate: number
  bhxhRate: number
  pitRate: number
  standardWorkingDays: number
}

export const adminService = {
  async getDashboardData(): Promise<DashboardData> {
    const response = await api.get<DashboardData>('/admin/dashboard')
    return response.data!
  },

  async getAllEmployees(): Promise<{ employees: Employee[]; total: number }> {
    const response = await api.get<{ employees: Employee[]; total: number }>('/admin/employees')
    return response.data || { employees: [], total: 0 }
  },

  async getTodayAttendance(): Promise<{ records: any[]; total: number }> {
    const response = await api.get<{ records: any[]; total: number }>('/admin/attendance/today')
    return response.data || { records: [], total: 0 }
  },

  async getAllLeaveRequests(status?: string): Promise<{ requests: LeaveRequest[]; total: number }> {
    let url = '/admin/leave-requests'
    if (status) {
      url += `?status=${status}`
    }
    const response = await api.get<{ requests: LeaveRequest[]; total: number }>(url)
    return response.data || { requests: [], total: 0 }
  },

  async getAttendanceSettings(): Promise<{
    workStartTime: string
    workEndTime: string
    breakDuration: number
    lateThreshold: number
    overtimeThreshold: number
  }> {
    const response = await api.get<{
      workStartTime: string
      workEndTime: string
      breakDuration: number
      lateThreshold: number
      overtimeThreshold: number
    }>('/admin/attendance-settings')
    return response.data!
  },

  async updateLeaveRequest(id: string, status: 'APPROVED' | 'REJECTED', reviewComment?: string): Promise<void> {
    await api.patch(`/admin/leave-requests/${id}`, { status, reviewComment })
  },

  async updateAttendanceSettings(payload: {
    workStartTime?: string
    workEndTime?: string
    breakDuration?: number
    lateThreshold?: number
    overtimeThreshold?: number
    reason?: string
  }): Promise<void> {
    await api.put('/admin/attendance-settings', payload)
  },

  async getPayrollFormulaSettings(): Promise<PayrollFormulaSettings> {
    const response = await api.get<PayrollFormulaSettings>('/admin/payroll-formula-settings')
    return response.data!
  },

  async updatePayrollFormulaSettings(payload: {
    overtimeMultiplier?: number
    latePenaltyPerLate?: number
    bhxhRate?: number
    pitRate?: number
    standardWorkingDays?: number
    reason?: string
  }): Promise<void> {
    await api.put('/admin/payroll-formula-settings', payload)
  },
}
