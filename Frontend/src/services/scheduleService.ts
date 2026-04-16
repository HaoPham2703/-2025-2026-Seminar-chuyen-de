/**
 * Schedule Service
 */

import { apiFetch } from './api';

export interface DailySchedule {
  date: string;
  shiftType: 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'FULL_DAY' | 'OFF' | 'CUSTOM' | string;
  startTime: string | null;
  endTime: string | null;
  isOverridden: boolean;
}

export interface MyScheduleResponse {
  employeeId: string;
  weekStart: string;
  weekEnd: string;
  schedule: Record<string, DailySchedule>;
}

/**
 * Lấy lịch làm việc tuần của employee hiện tại
 * @param weekStart Ngày thứ Hai của tuần (YYYY-MM-DD)
 */
export async function getMySchedules(weekStart: string): Promise<MyScheduleResponse> {
  const response = await apiFetch<MyScheduleResponse>(
    `/employees/schedules/my?weekStart=${encodeURIComponent(weekStart)}`
  );

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.message || 'Failed to get schedules');
}
