import { api } from './api'

export interface Position {
  _id: string
  name: string
  departmentId: string
  departmentName: string
  baseSalary: number
  employeeCount: number
}

export interface PositionEmployee {
  _id: string
  employeeId: string
  name: string
  email: string
  department: string
  position: string
  phone: string
  baseSalary: number
}

export async function getPositions(departmentId?: string): Promise<Position[]> {
  let url = '/admin/positions'
  if (departmentId) {
    url += `?departmentId=${departmentId}`
  }
  const response = await api.get<{ positions: Position[] }>(url)
  if (!response.success) throw new Error(response.message || 'Failed to load positions')
  return response.data?.positions || []
}

export async function getPositionsByDepartment(deptId: string): Promise<{ _id: string; name: string; baseSalary: number }[]> {
  const response = await api.get<{ positions: Array<{ _id: string; name: string; baseSalary: number }> }>(
    `/admin/departments/${deptId}/positions`
  )
  if (!response.success) throw new Error(response.message || 'Failed to load positions')
  return response.data?.positions || []
}

export async function createPosition(
  name: string,
  departmentId: string,
  baseSalary: number
): Promise<{ id: string }> {
  const response = await api.post<{ id: string }>('/admin/positions', { name, departmentId, baseSalary })
  if (!response.success) throw new Error(response.message || 'Failed to create position')
  return response.data!
}

export async function updatePosition(
  id: string,
  name?: string,
  departmentId?: string,
  baseSalary?: number
): Promise<void> {
  const response = await api.put(`/admin/positions/${id}`, { name, departmentId, baseSalary })
  if (!response.success) throw new Error(response.message || 'Failed to update position')
}

export async function deletePosition(id: string): Promise<void> {
  const response = await api.delete(`/admin/positions/${id}`)
  if (!response.success) throw new Error(response.message || 'Failed to delete position')
}

export async function getPositionEmployees(positionId: string): Promise<{
  employees: PositionEmployee[]
  total: number
  position: string
}> {
  const response = await api.get<{ employees: PositionEmployee[]; total: number; position: string }>(
    `/admin/positions/${positionId}/employees`
  )
  if (!response.success) throw new Error(response.message || 'Failed to load employees')
  return response.data!
}
