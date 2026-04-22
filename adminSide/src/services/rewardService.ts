import { api } from './api'

// ─── Types ────────────────────────────────────────────────────────────────────

export type RewardType = 'MATERIAL' | 'MONEY'
export type RewardStatus = 'PENDING' | 'APPROVED' | 'CANCELLED'
export type DisciplineType = 'LATE' | 'ABSENT' | 'VIOLATION' | 'FORGOTTEN_CHECKOUT' | 'OTHER'
export type DisciplineStatus = 'RECORDED' | 'APPROVED' | 'WAIVED'

export interface Reward {
  _id: string
  employeeId: string
  employeeName: string
  type: RewardType
  title: string
  description: string
  amount: number | null
  itemName: string | null
  status: RewardStatus
  month: number
  year: number
  createdAt: string
}

export interface Discipline {
  _id: string
  employeeId: string
  employeeName: string
  type: DisciplineType
  description: string
  amount: number | null
  status: DisciplineStatus
  month: number
  year: number
  createdAt: string
}

export interface RewardRule {
  _id: string
  type: string
  requiredDays: number
  rewardType: RewardType
  rewardAmount: number | null
  rewardItem: string | null
  isActive: boolean
}

export interface RewardRecord {
  _id: string
  employeeId: string
  employeeName: string
  ruleId: string | null
  rewardType: RewardType
  rewardAmount: number | null
  rewardItem: string | null
  month: number
  year: number
  earnedDays: number
  requiredDays: number
  createdAt: string
}

export interface AutoCalcPreview {
  rule: {
    requiredDays: number
    rewardType: RewardType
    rewardAmount: number | null
    rewardItem: string | null
  } | null
  employees: {
    _id: string
    name: string
    onTimeDays: number
    requiredDays: number
    rewardType: RewardType
    rewardAmount: number | null
    rewardItem: string | null
  }[]
}

// ─── Reward Rules ─────────────────────────────────────────────────────────────

export async function getRewardRule(): Promise<RewardRule | null> {
  const response = await api.get<RewardRule | null>('/admin/reward-rules')
  if (!response.success) throw new Error(response.message || 'Failed to load reward rule')
  return response.data || null
}

export async function saveRewardRule(payload: {
  type: string
  requiredDays: number
  rewardType: RewardType
  rewardAmount?: number
  rewardItem?: string
  isActive: boolean
}): Promise<{ id: string }> {
  const response = await api.put<{ id: string }>('/admin/reward-rules', payload)
  if (!response.success) throw new Error(response.message || 'Failed to save reward rule')
  return response.data!
}

// ─── Rewards ─────────────────────────────────────────────────────────────────

export async function getRewards(params?: {
  month?: number
  year?: number
  employeeId?: string
  status?: string
  type?: string
}): Promise<Reward[]> {
  let url = '/admin/rewards'
  const searchParams = new URLSearchParams()
  if (params?.month) searchParams.set('month', String(params.month))
  if (params?.year) searchParams.set('year', String(params.year))
  if (params?.employeeId) searchParams.set('employeeId', params.employeeId)
  if (params?.status) searchParams.set('status', params.status)
  if (params?.type) searchParams.set('type', params.type)
  const qs = searchParams.toString()
  if (qs) url += `?${qs}`

  const response = await api.get<{ rewards: Reward[] }>(url)
  if (!response.success) throw new Error(response.message || 'Failed to load rewards')
  return response.data?.rewards || []
}

export async function createReward(payload: {
  employeeId: string
  type: RewardType
  title: string
  description?: string
  amount?: number
  itemName?: string
  month: number
  year: number
}): Promise<{ id: string }> {
  const response = await api.post<{ id: string }>('/admin/rewards', payload)
  if (!response.success) throw new Error(response.message || 'Failed to create reward')
  return response.data!
}

export async function updateRewardStatus(id: string, status: 'APPROVED' | 'CANCELLED'): Promise<void> {
  const response = await api.patch(`/admin/rewards/${id}`, { status })
  if (!response.success) throw new Error(response.message || 'Failed to update reward')
}

// ─── Disciplines ─────────────────────────────────────────────────────────────

export async function getDisciplines(params?: {
  month?: number
  year?: number
  employeeId?: string
  type?: string
  status?: string
}): Promise<Discipline[]> {
  let url = '/admin/disciplines'
  const searchParams = new URLSearchParams()
  if (params?.month) searchParams.set('month', String(params.month))
  if (params?.year) searchParams.set('year', String(params.year))
  if (params?.employeeId) searchParams.set('employeeId', params.employeeId)
  if (params?.type) searchParams.set('type', params.type)
  if (params?.status) searchParams.set('status', params.status)
  const qs = searchParams.toString()
  if (qs) url += `?${qs}`

  const response = await api.get<{ disciplines: Discipline[] }>(url)
  if (!response.success) throw new Error(response.message || 'Failed to load disciplines')
  return response.data?.disciplines || []
}

export async function createDiscipline(payload: {
  employeeId: string
  type: DisciplineType
  description: string
  amount?: number
  month: number
  year: number
}): Promise<{ id: string }> {
  const response = await api.post<{ id: string }>('/admin/disciplines', payload)
  if (!response.success) throw new Error(response.message || 'Failed to record discipline')
  return response.data!
}

export async function updateDisciplineStatus(id: string, status: 'APPROVED' | 'WAIVED'): Promise<void> {
  const response = await api.patch(`/admin/disciplines/${id}`, { status })
  if (!response.success) throw new Error(response.message || 'Failed to update discipline')
}

// ─── Auto Calculate ───────────────────────────────────────────────────────────

export async function getAutoCalcPreview(month?: number, year?: number): Promise<AutoCalcPreview> {
  let url = '/admin/rewards/auto-calculate/employees'
  const searchParams = new URLSearchParams()
  if (month) searchParams.set('month', String(month))
  if (year) searchParams.set('year', String(year))
  const qs = searchParams.toString()
  if (qs) url += `?${qs}`

  const response = await api.get<AutoCalcPreview>(url)
  if (!response.success) throw new Error(response.message || 'Failed to load preview')
  return response.data!
}

export async function runAutoReward(month?: number, year?: number): Promise<{
  month: number
  year: number
  totalQualified: number
  records: { id: string; employeeId: string; employeeName: string; earnedDays: number }[]
}> {
  let url = '/admin/rewards/auto-calculate'
  const searchParams = new URLSearchParams()
  if (month) searchParams.set('month', String(month))
  if (year) searchParams.set('year', String(year))
  const qs = searchParams.toString()
  if (qs) url += `?${qs}`

  const response = await api.post<{
    month: number
    year: number
    totalQualified: number
    records: { id: string; employeeId: string; employeeName: string; earnedDays: number }[]
  }>(url)
  if (!response.success || !response.data) throw new Error(response.message || 'Failed to run auto reward')
  return response.data
}

// ─── Reward Records (auto-generated) ─────────────────────────────────────────

export async function getRewardRecords(params?: {
  month?: number
  year?: number
}): Promise<RewardRecord[]> {
  let url = '/admin/reward-records'
  const searchParams = new URLSearchParams()
  if (params?.month) searchParams.set('month', String(params.month))
  if (params?.year) searchParams.set('year', String(params.year))
  const qs = searchParams.toString()
  if (qs) url += `?${qs}`

  const response = await api.get<{ records: RewardRecord[] }>(url)
  if (!response.success) throw new Error(response.message || 'Failed to load reward records')
  return response.data?.records || []
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const REWARD_STATUS_COLORS: Record<RewardStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

export const DISCIPLINE_TYPE_LABELS: Record<DisciplineType, string> = {
  LATE: 'Đi muộn',
  ABSENT: 'Vắng không phép',
  VIOLATION: 'Vi phạm nội quy',
  FORGOTTEN_CHECKOUT: 'Quên check-out',
  OTHER: 'Khác',
}

export const DISCIPLINE_STATUS_COLORS: Record<DisciplineStatus, string> = {
  RECORDED: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-orange-100 text-orange-700',
  WAIVED: 'bg-gray-100 text-gray-500',
}

export const DISCIPLINE_TYPE_COLORS: Record<DisciplineType, string> = {
  LATE: 'bg-yellow-100 text-yellow-800',
  ABSENT: 'bg-red-100 text-red-800',
  VIOLATION: 'bg-purple-100 text-purple-800',
  FORGOTTEN_CHECKOUT: 'bg-orange-100 text-orange-800',
  OTHER: 'bg-gray-100 text-gray-700',
}
