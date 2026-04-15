/**
 * Attendance Service
 */

import { apiFetch, ApiResponse } from './api';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface ClockInRequest {
  employeeId: string;
  location?: Location;
  qrCode?: string;
  method?: 'MOBILE_APP' | 'QR_SCAN' | 'MANUAL';
}

export interface ClockOutRequest {
  employeeId: string;
  location?: Location;
}

export interface AttendanceRecord {
  _id: string;
  tenantId: string;
  employeeId: string;
  date: string;
  clockIn?: {
    time: string;
    location?: Location;
    method: string;
    qrCode?: string;
    isLate: boolean;
    lateMinutes: number;
  };
  clockOut?: {
    time: string;
    location?: Location;
    method: string;
    qrCode?: string;
  };
  workDuration: number;
  breakDuration: number;
  overtimeDuration: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
  expectedStartTime: string;
  expectedEndTime: string;
  notes?: string;
  leaveRequestId?: string;
}

export interface CurrentAttendanceResponse {
  attendance: AttendanceRecord | null;
  isClockedIn: boolean;
  isClockedOut: boolean;
}

/**
 * Chấm công vào ca
 */
export async function clockIn(data: ClockInRequest): Promise<{
  clockInTime: string;
  isLate: boolean;
  lateMinutes: number;
}> {
  const response = await apiFetch<{
    clockInTime: string;
    isLate: boolean;
    lateMinutes: number;
  }>('/attendance/clock-in', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.message || 'Clock in failed');
}

/**
 * Chấm công ra ca
 */
export async function clockOut(data: ClockOutRequest): Promise<{
  clockOutTime: string;
  workDuration: number;
  overtimeDuration: number;
}> {
  const response = await apiFetch<{
    clockOutTime: string;
    workDuration: number;
    overtimeDuration: number;
  }>('/attendance/clock-out', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.message || 'Clock out failed');
}

/**
 * Lấy thông tin chấm công hôm nay
 */
export async function getCurrentAttendance(employeeId: string): Promise<CurrentAttendanceResponse> {
  const response = await apiFetch<CurrentAttendanceResponse>(
    `/attendance/current?employeeId=${employeeId}`
  );

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.message || 'Failed to get current attendance');
}

/**
 * Lấy lịch sử chấm công
 */
export async function getAttendanceHistory(
  employeeId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<{
  records: AttendanceRecord[];
  total: number;
}> {
  const params = new URLSearchParams({
    employeeId,
    ...(options?.startDate && { startDate: options.startDate }),
    ...(options?.endDate && { endDate: options.endDate }),
    ...(options?.limit && { limit: options.limit.toString() }),
  });

  const response = await apiFetch<{
    records: AttendanceRecord[];
    total: number;
  }>(`/attendance/history?${params.toString()}`);

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.message || 'Failed to get attendance history');
}
