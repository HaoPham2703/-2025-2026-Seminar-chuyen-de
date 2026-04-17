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
  isSuperseded?: boolean
  supersededBy?: string | null
  revisedFrom?: string | null
  reviseReason?: string | null
}

export interface EmployeeOption {
  id: string
  name: string
  code: string
  position: string
  email: string
}

export interface CreatePayrollRequest {
  employeeId: string
  period: PayrollPeriod
  baseSalary: number
  allowances?: PayrollItem[]
  deductions?: PayrollItem[]
  status?: 'DRAFT' | 'PENDING' | 'APPROVED'
}

export interface UpdatePayrollRequest {
  period?: PayrollPeriod
  baseSalary?: number
  allowances?: PayrollItem[]
  deductions?: PayrollItem[]
  status?: 'DRAFT' | 'PENDING' | 'APPROVED'
  reason?: string
}

export interface RevisePayrollRequest {
  period?: PayrollPeriod
  baseSalary?: number
  allowances?: PayrollItem[]
  deductions?: PayrollItem[]
  status?: 'DRAFT' | 'PENDING' | 'APPROVED'
  reason: string
}

export interface AutoCalcPayrollRequest {
  employeeId: string
  month: number
  year: number
  baseSalary?: number
  overtimeMultiplier?: number
  latePenaltyPerLate?: number
  bhxhRate?: number
  pitRate?: number
}

export interface LateIncident {
  date: string
  lateMinutes: number
  status: string
}

export interface AbsentIncident {
  date: string
  status: string
}

export interface DisciplineBreakdown {
  type: string
  description: string
  amount: number
}

export interface RewardBreakdown {
  approved: { title: string; type: string; amount: number; itemName: string | null }[]
  pending: { title: string; type: string; amount: number; itemName: string | null }[]
}

export interface AutoCalcPayrollResponse {
  baseSalary: number
  attendanceSummary: {
    totalWorkMinutes: number
    totalOvertimeMinutes: number
    lateCount: number
    absentCount: number
    attendanceDays: number
    standardWorkingDays: number
  }
  lateIncidents: LateIncident[]
  absentIncidents: AbsentIncident[]
  disciplineBreakdown: DisciplineBreakdown[]
  rewardBreakdown: RewardBreakdown
  suggestion: {
    allowances: PayrollItem[]
    deductions: PayrollItem[]
    allowancesTotal: number
    deductionsTotal: number
    netSalary: number
    components: {
      benefitsTotal: number
      overtimePay: number
      lateCount: number
      latePenaltyPerLate: number
      absentPenaltyPerDay: number
      absentCount: number
      disciplineAmount: number
      rewardAmount: number
      bhxh: number
      pit: number
    }
  }
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
  throw new Error(response.message || response.message || 'Mỗi nhân viên chỉ được có 1 bảng lương trong cùng một tháng')
}

export async function updatePayroll(id: string, data: UpdatePayrollRequest): Promise<void> {
  const response = await api.put<null>(`/payrolls/${id}`, data)
  if (!response.success) {
    throw new Error(response.message || 'Failed to update payroll')
  }
}

export async function revisePayroll(id: string, data: RevisePayrollRequest): Promise<string> {
  const response = await api.post<{ id: string }>(`/payrolls/${id}/revise`, data)
  if (response.success && response.data) {
    return response.data.id
  }
  throw new Error(response.message || 'Failed to revise payroll')
}

export async function autoCalculatePayroll(data: AutoCalcPayrollRequest): Promise<AutoCalcPayrollResponse> {
  const response = await api.post<AutoCalcPayrollResponse>('/payrolls/auto-calculate', data)
  if (response.success && response.data) {
    return response.data
  }
  throw new Error(response.message || 'Failed to auto calculate payroll')
}

export async function deletePayroll(id: string): Promise<void> {
  const response = await api.delete<null>(`/payrolls/${id}`)
  if (!response.success) {
    throw new Error(response.message || 'Failed to delete payroll')
  }
}

export async function deletePayrolls(ids: string[]): Promise<void> {
  const response = await api.delete<null>('/payrolls/bulk-delete', { ids })
  if (!response.success) {
    throw new Error(response.message || 'Failed to delete payrolls')
  }
}
