import { api } from './api'

export interface PayrollPeriod {
  month: number
  year: number
}

export interface PayrollItem {
  name: string
  amount: number
}

export interface Payroll {
  _id: string
  tenantId: string
  employeeId: string
  employeeName: string
  employeeCode: string
  period: PayrollPeriod
  baseSalary: number
  allowances: PayrollItem[]
  deductions: PayrollItem[]
  allowancesTotal: number
  deductionsTotal: number
  netSalary: number
  status: 'DRAFT' | 'PENDING' | 'APPROVED'
  approvedAt: string | null
  createdAt: string
  createdBy: string
}

export interface EmployeeOption {
  id: string
  name: string
  code: string
  position: string
}

export interface CreatePayrollRequest {
  employeeId: string
  period: PayrollPeriod
  baseSalary: number
  allowances?: PayrollItem[]
  deductions?: PayrollItem[]
  status?: 'DRAFT' | 'PENDING' | 'APPROVED'
}

export async function getAllPayrolls(params?: {
  month?: number
  year?: number
  employeeId?: string
  status?: string
}): Promise<Payroll[]> {
  const query = new URLSearchParams()
  if (params?.month) query.set('month', params.month.toString())
  if (params?.year) query.set('year', params.year.toString())
  if (params?.employeeId) query.set('employeeId', params.employeeId)
  if (params?.status) query.set('status', params.status)

  const qs = query.toString()
  const response = await api.get<{ payrolls: Payroll[] }>(
    `/payrolls${qs ? `?${qs}` : ''}`
  )

  if (response.success && response.data) {
    return response.data.payrolls || []
  }
  throw new Error(response.message || 'Failed to load payrolls')
}

export async function getEmployeeOptions(): Promise<EmployeeOption[]> {
  const response = await api.get<{ employees: EmployeeOption[] }>(
    '/payrolls/employees'
  )
  if (response.success && response.data) {
    return response.data.employees || []
  }
  throw new Error(response.message || 'Failed to load employees')
}

export async function createPayroll(data: CreatePayrollRequest): Promise<string> {
  const response = await api.post<{ id: string }>('/payrolls', data)
  if (response.success && response.data) {
    return response.data.id
  }
  throw new Error(response.message || 'Failed to create payroll')
}
