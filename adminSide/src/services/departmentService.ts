import { api } from './api'

export interface Department {
  _id: string
  name: string
  description: string
  employeeCount: number
  positionCount: number
  head?: {
    _id: string
    employeeId: string
    name: string
    email: string
    phone: string
  } | null
}

export interface DepartmentEmployee {
  _id: string
  employeeId: string
  name: string
  email: string
  department: string
  position: string
  phone: string
  employmentStatus: string
}

export async function getDepartments(): Promise<Department[]> {
  const response = await api.get<{ departments: Department[] }>('/admin/departments')
  if (!response.success) throw new Error(response.message || 'Failed to load departments')
  return response.data?.departments || []
}

export async function createDepartment(name: string, description?: string): Promise<{ id: string }> {
  const response = await api.post<{ id: string }>('/admin/departments', { name, description })
  if (!response.success) throw new Error(response.message || 'Failed to create department')
  return response.data!
}

export async function updateDepartment(
  id: string,
  name?: string,
  description?: string,
  headEmployeeId?: string | null
): Promise<void> {
  const response = await api.put(`/admin/departments/${id}`, { name, description, headEmployeeId })
  if (!response.success) throw new Error(response.message || 'Failed to update department')
}

export async function deleteDepartment(id: string): Promise<void> {
  const response = await api.delete(`/admin/departments/${id}`)
  if (!response.success) throw new Error(response.message || 'Failed to delete department')
}

export async function getDepartmentEmployees(departmentId: string): Promise<{
  employees: DepartmentEmployee[]
  total: number
  department: string
}> {
  const response = await api.get<{ employees: DepartmentEmployee[]; total: number; department: string }>(
    `/admin/departments/${departmentId}/employees`
  )
  if (!response.success) throw new Error(response.message || 'Failed to load employees')
  return response.data!
}

export async function assignEmployeesToDepartment(
  departmentId: string,
  employeeIds: string[]
): Promise<void> {
  const response = await api.patch(`/admin/departments/${departmentId}/employees`, {
    employeeIds,
    action: 'assign',
  })
  if (!response.success) throw new Error(response.message || 'Failed to assign employees')
}

export async function removeEmployeesFromDepartment(
  departmentId: string,
  employeeIds: string[]
): Promise<void> {
  const response = await api.patch(`/admin/departments/${departmentId}/employees`, {
    employeeIds,
    action: 'remove',
  })
  if (!response.success) throw new Error(response.message || 'Failed to remove employees')
}

