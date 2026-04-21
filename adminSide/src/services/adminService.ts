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

  async getAttendanceByDate(date: string): Promise<{ records: any[]; total: number; date?: string }> {
    const response = await api.get<{ records: any[]; total: number; date?: string }>(
      `/admin/attendance?date=${encodeURIComponent(date)}`
    )
    return response.data || { records: [], total: 0 }
  },

  async getAllLeaveRequests(status?: string, limit?: number): Promise<{ requests: LeaveRequest[]; total: number }> {
    const params = new URLSearchParams()
    if (status) {
      params.append('status', status)
    }
    if (limit && Number.isFinite(limit)) {
      params.append('limit', String(limit))
    }

    const query = params.toString()
    const url = query ? `/admin/leave-requests?${query}` : '/admin/leave-requests'
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

  async createEmployee(payload: {
    employeeId?: string
    firstName: string
    lastName: string
    email: string
    password?: string
    phone?: string
    dateOfBirth?: string
    gender?: string
    department?: string
    position?: string
    employmentType?: string
    hireDate?: string
    baseSalary?: number
    currency?: string
    street?: string
    city?: string
    province?: string
    emergencyName?: string
    emergencyPhone?: string
    emergencyRelation?: string
  }): Promise<{ id: string; userId: string; employeeId: string; accountInfo: { email: string; defaultPassword: string } }> {
    const response = await api.post<{ data: { id: string; userId: string; employeeId: string; accountInfo: { email: string; defaultPassword: string } } }>('/admin/employees', payload)
    return response.data!.data!
  },

  async updateEmployee(id: string, payload: {
    name?: string
    email?: string
    department?: string
    departmentId?: string
    position?: string
    positionId?: string
    phone?: string
  }): Promise<void> {
    await api.put(`/admin/employees/${id}`, payload)
  },

  async deleteEmployee(id: string): Promise<void> {
    await api.delete(`/admin/employees/${id}`)
  },

  async sendNotification(payload: {
    title: string
    message: string
    type: string
    priority: string
    targetAudience: string
    targetDepartment?: string
    targetEmployeeIds?: string[]
    includeInactive?: boolean
  }): Promise<{ notificationId: string; recipientsCount: number }> {
    const response = await api.post<{ notificationId: string; recipientsCount: number }>(
      '/notifications/send',
      payload
    )
    return response.data!
  },

  async getAllDepartments(): Promise<{ departments: any[]; total: number }> {
    const response = await api.get<{ departments: any[]; total: number }>('/admin/departments')
    return response.data || { departments: [], total: 0 }
  },

  async getSentNotifications(page = 1): Promise<{
    notifications: Array<{
      id: string
      type: string
      title: string
      message: string
      priority: string
      targetAudience: string
      recipientsCount: number
      sentAt: string
    }>
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }> {
    const response = await api.get<{
      notifications: Array<any>
      pagination: any
    }>(`/notifications/sent?page=${page}&limit=20`)
    return response.data || { notifications: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }
  },
}
