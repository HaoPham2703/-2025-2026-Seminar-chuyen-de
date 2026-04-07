/**
 * Employee Service
 */

import { apiFetch } from './api';

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
  qrToken?: string | null;
  qrTokenExpiresIn?: number;
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

export interface EmployeeQrCode {
  code?: string;
  qrImageUrl?: string;
  generatedAt?: string;
  expiresAt?: string;
  isActive?: boolean;
  qrToken?: string | null;
  expiresIn?: number;
}

/**
 * Lấy QR code của một employee theo ID
 * (Sử dụng cho màn QR cá nhân nếu cần load lại độc lập với profile)
 */
export async function getEmployeeQrCode(employeeId: string): Promise<EmployeeQrCode | null> {
  const response = await apiFetch<{
    qrCode: EmployeeQrCode | null;
    qrToken?: string | null;
    expiresIn?: number;
  }>(`/employees/${employeeId}/qr-code`);

  if (response.success && response.data) {
    const { qrCode, qrToken, expiresIn } = response.data;

    if (!qrCode && !qrToken) return null;

    return {
      ...(qrCode ?? {}),
      qrToken: qrToken ?? qrCode?.qrToken ?? null,
      expiresIn: expiresIn ?? qrCode?.expiresIn,
    };
  }

  throw new Error(response.message || 'Failed to get employee QR code');
}

/**
 * Quét QR token để lấy thông tin nhân viên (admin/manager quét QR của nhân viên)
 */
export async function verifyQrToken(qrToken: string): Promise<{ employee: EmployeeProfile }> {
  const response = await apiFetch<{ employee: EmployeeProfile }>('/employees/verify-qr', {
    method: 'POST',
    body: JSON.stringify({ qrToken }),
  });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.message || 'Failed to verify QR code');
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

export interface PayslipTotals {
  gross: number;
  net: number;
}

export interface PayslipLineItem {
  label: string;
  amount: number;
}

export interface Payslip {
  id: string;
  employeeId: string | null;
  year: number;
  month: number;
  currency: string;
  status: string;
  totals: PayslipTotals | null;
  earnings: PayslipLineItem[];
  deductions: PayslipLineItem[];
  issuedAt?: string | null;
  approvedAt?: string | null;
  notes?: string | null;
}

export async function getPayslips(
  employeeId: string,
  params?: { year?: number; month?: number }
): Promise<Payslip[]> {
  const query = new URLSearchParams();
  if (params?.year) query.set('year', String(params.year));
  if (params?.month) query.set('month', String(params.month));

  const response = await apiFetch<{ payslips: Payslip[] }>(
    `/employees/${employeeId}/payslips${query.toString() ? `?${query.toString()}` : ''}`
  );

  if (response.success && response.data) {
    return response.data.payslips;
  }

  throw new Error(response.message || 'Failed to load payslips');
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
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
}

/**
 * Cập nhật profile của employee hiện tại
 */
export async function updateEmployeeProfile(data: UpdateProfileRequest): Promise<EmployeeProfileResponse> {
  const response = await apiFetch<EmployeeProfileResponse>('/employees/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.message || 'Failed to update profile');
}
