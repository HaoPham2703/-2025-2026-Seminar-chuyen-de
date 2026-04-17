import { api } from './api'

export interface Benefit {
  id: string
  name: string
  type: 'fixed' | 'percent' | 'custom'
  value: number
  employeeCount: number
  createdAt?: string
}

export interface CreateBenefitRequest {
  name: string
  type: 'fixed' | 'percent' | 'custom'
  value: number
}

export interface UpdateBenefitRequest {
  name?: string
  type?: 'fixed' | 'percent' | 'custom'
  value?: number
}

export interface BenefitEmployee {
  id: string
  employeeName: string
  employeeCode: string
  startDate: string
  endDate: string | null
}

export interface EmployeeBenefit {
  id: string
  employeeName: string
  employeeCode: string
  benefitName: string
  type: 'fixed' | 'percent' | 'custom'
  amount: number
  startDate: string
  endDate: string | null
}

export interface CreateEmployeeBenefitRequest {
  employeeId: string
  benefitId: string
  startDate: string
}

export interface UpdateEmployeeBenefitRequest {
  benefitId?: string
  startDate?: string
  endDate?: string | null
}

// Benefits Management APIs

export async function getAllBenefits(): Promise<Benefit[]> {
  const response = await api.get<{ benefits: Benefit[] }>('/benefits')
  if (response.success && response.data) {
    return response.data.benefits || []
  }
  throw new Error(response.message || 'Failed to load benefits')
}

export async function createBenefit(data: CreateBenefitRequest): Promise<string> {
  const response = await api.post<{ id: string }>('/benefits', data)
  if (response.success && response.data) {
    return response.data.id
  }
  throw new Error(response.message || 'Failed to create benefit')
}

export async function updateBenefit(id: string, data: UpdateBenefitRequest): Promise<void> {
  const response = await api.put<null>(`/benefits/${id}`, data)
  if (!response.success) {
    throw new Error(response.message || 'Failed to update benefit')
  }
}

export async function deleteBenefit(id: string): Promise<void> {
  const response = await api.delete<null>(`/benefits/${id}`)
  if (!response.success) {
    throw new Error(response.message || 'Failed to delete benefit')
  }
}

export async function getBenefitEmployees(id: string): Promise<BenefitEmployee[]> {
  const response = await api.get<{ employees: BenefitEmployee[] }>(`/benefits/${id}/employees`)
  if (response.success && response.data) {
    return response.data.employees || []
  }
  throw new Error(response.message || 'Failed to load benefit employees')
}

// Employee Benefits APIs

export async function getAllEmployeeBenefits(params?: {
  employeeId?: string
}): Promise<EmployeeBenefit[]> {
  const query = new URLSearchParams()
  if (params?.employeeId) query.set('employeeId', params.employeeId)

  const qs = query.toString()
  const response = await api.get<{ employeeBenefits: EmployeeBenefit[] }>(
    `/employee-benefits${qs ? `?${qs}` : ''}`
  )
  if (response.success && response.data) {
    return response.data.employeeBenefits || []
  }
  throw new Error(response.message || 'Failed to load employee benefits')
}

export async function createEmployeeBenefit(data: CreateEmployeeBenefitRequest): Promise<string> {
  const response = await api.post<{ id: string }>('/employee-benefits', data)
  if (response.success && response.data) {
    return response.data.id
  }
  throw new Error(response.message || 'Failed to create employee benefit')
}

export async function updateEmployeeBenefit(id: string, data: UpdateEmployeeBenefitRequest): Promise<void> {
  const response = await api.put<null>(`/employee-benefits/${id}`, data)
  if (!response.success) {
    throw new Error(response.message || 'Failed to update employee benefit')
  }
}

export async function deleteEmployeeBenefit(id: string): Promise<void> {
  const response = await api.delete<null>(`/employee-benefits/${id}`)
  if (!response.success) {
    throw new Error(response.message || 'Failed to delete employee benefit')
  }
}
