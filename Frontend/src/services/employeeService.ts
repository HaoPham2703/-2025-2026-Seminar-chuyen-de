/**
 * Employee Service
 */

import { apiFetch, ApiResponse } from './api';

export interface EmployeeProfile {
  id: string;
  employeeId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: string;
    phone: string;
    email: string;
    address?: {
      street?: string;
      city?: string;
      province?: string;
    };
    emergencyContact?: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
  employment: {
    position: string;
    department: string;
    employmentType: string;
    hireDate: string;
    status: string;
    baseSalary?: number;
    currency?: string;
  };
  qrCode: {
    code: string;
    qrImageUrl?: string;
    generatedAt: string;
    expiresAt: string;
    isActive: boolean;
  };
  statistics: {
    totalWorkingDays: number;
    totalHours: number;
    lateCount: number;
    absentCount: number;
    overtimeHours: number;
    onTimeRate: number;
  };
}

export interface EmployeeProfileResponse {
  employee: EmployeeProfile;
  user: {
    email: string;
    profile: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      avatar?: string;
    };
  };
}

/**
 * Lấy profile của employee hiện tại
 */
export async function getEmployeeProfile(): Promise<EmployeeProfileResponse> {
  const response = await apiFetch<EmployeeProfileResponse>('/employees/profile');

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.message || 'Failed to get employee profile');
}

/**
 * Lấy thông tin chi tiết của một employee (admin only)
 */
export async function getEmployeeById(employeeId: string): Promise<{ employee: EmployeeProfile }> {
  const response = await apiFetch<{ employee: EmployeeProfile }>(
    `/employees/${employeeId}`
  );

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.message || 'Failed to get employee');
}
