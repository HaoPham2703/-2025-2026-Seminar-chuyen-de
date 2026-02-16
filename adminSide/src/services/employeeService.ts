import { api } from './api'

export interface Employee {
  _id: string
  userId: string
  employeeId: string
  personalInfo: {
    firstName: string
    lastName: string
    email?: string
    phone?: string
    dateOfBirth?: string
    gender?: string
    address?: string
  }
  department?: string
  position?: string
  role?: string
  qrCode?: {
    code: string
  }
}

export interface EmployeeProfile extends Employee {
  statistics?: {
    totalWorkingDays: number
    totalHours: number
    onTimeRate: number
  }
}

export interface LeaveRequest {
  _id: string
  employeeId: string
  type: string
  startDate: string
  endDate: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  reviewedBy?: string
  reviewedAt?: string
  reviewComment?: string
}

export const employeeService = {
  async getProfile(): Promise<EmployeeProfile> {
    const response = await api.get<EmployeeProfile>('/employees/profile')
    return response.data!
  },

  async getById(employeeId: string): Promise<Employee> {
    const response = await api.get<Employee>(`/employees/${employeeId}`)
    return response.data!
  },

  async getLeaveRequests(employeeId: string): Promise<LeaveRequest[]> {
    const response = await api.get<{ requests: LeaveRequest[] }>(
      `/employees/${employeeId}/leave-requests`
    )
    return response.data?.requests || []
  },

  async createLeaveRequest(
    employeeId: string,
    data: {
      type: string
      startDate: string
      endDate: string
      reason: string
    }
  ): Promise<{ id: string }> {
    const response = await api.post<{ id: string }>(
      `/employees/${employeeId}/leave-requests`,
      data
    )
    return response.data!
  },
}
