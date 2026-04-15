import { apiFetch } from './api';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequest {
  _id?: string;
  tenantId: string;
  employeeId: string;
  userId: string;
  type: string; // ANNUAL, SICK, UNPAID, OTHER...
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewComment?: string | null;
}

export interface AttendanceAdjustment {
  _id?: string;
  tenantId: string;
  employeeId: string;
  userId: string;
  attendanceId?: string | null;
  date: string;
  proposedClockIn?: string | null;
  proposedClockOut?: string | null;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewComment?: string | null;
}

export async function createLeaveRequest(params: {
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
}): Promise<string> {
  const { employeeId, ...body } = params;

  const response = await apiFetch<{ id: string }>(`/employees/${employeeId}/leave-requests`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (response.success && response.data) {
    return response.data.id;
  }

  throw new Error(response.message || 'Failed to create leave request');
}

export async function getLeaveRequests(employeeId: string): Promise<LeaveRequest[]> {
  const response = await apiFetch<{ requests: LeaveRequest[] }>(
    `/employees/${employeeId}/leave-requests`
  );

  if (response.success && response.data) {
    return response.data.requests;
  }

  throw new Error(response.message || 'Failed to load leave requests');
}

export async function createAttendanceAdjustment(params: {
  employeeId: string;
  date: string;
  proposedClockIn?: string;
  proposedClockOut?: string;
  reason: string;
}): Promise<string> {
  const { employeeId, ...body } = params;

  const response = await apiFetch<{ id: string }>(
    `/employees/${employeeId}/attendance-adjustments`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );

  if (response.success && response.data) {
    return response.data.id;
  }

  throw new Error(response.message || 'Failed to create attendance adjustment');
}

export async function getAttendanceAdjustments(employeeId: string): Promise<AttendanceAdjustment[]> {
  const response = await apiFetch<{ adjustments: AttendanceAdjustment[] }>(
    `/employees/${employeeId}/attendance-adjustments`
  );

  if (response.success && response.data) {
    return response.data.adjustments;
  }

  throw new Error(response.message || 'Failed to load attendance adjustments');
}

/**
 * Lấy tất cả leave requests đã duyệt của 1 employee
 * Dùng cho attendance screen: hiển thị ngày nghỉ phép đã duyệt
 */
export async function getApprovedLeaves(employeeId: string): Promise<LeaveRequest[]> {
  const all = await getLeaveRequests(employeeId);
  return all.filter(lr => lr.status === 'APPROVED');
}
