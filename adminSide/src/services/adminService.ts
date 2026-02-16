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
}
