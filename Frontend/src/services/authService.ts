/**
 * Authentication Service
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, removeAuthToken, setAuthToken } from './api';

const ROLE_KEY = '@dacn_user_role';

export interface LoginRequest {
  email: string;
  password: string;
  tenantId?: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  profile: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    employeeId?: string;
  };
  tenant: {
    id: string;
    name: string;
    features: {
      attendance: boolean;
      schedule: boolean;
      leaveManagement: boolean;
      overtime: boolean;
      reports: boolean;
      payroll: boolean;
    };
  };
  employee?: {
    id: string;
    employeeId: string;
    qrCode: {
      code: string;
      isActive: boolean;
    };
  };
}

export interface LoginResponse {
  token: string;
  user: User;
}

/**
 * Đăng nhập
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  if (response.success && response.data) {
    // Lưu token
    await setAuthToken(response.data.token);
    // Lưu role để điều hướng UI
    if (response.data.user?.role) {
      await AsyncStorage.setItem(ROLE_KEY, response.data.user.role);
    }
    return response.data;
  }

  throw new Error(response.message || 'Login failed');
}

/**
 * Đăng xuất
 */
export async function logout(): Promise<void> {
  await removeAuthToken();
  await AsyncStorage.removeItem(ROLE_KEY);
}

/**
 * Lấy thông tin user hiện tại
 */
export async function getCurrentUser(): Promise<User> {
  const response = await apiFetch<{ user: User }>('/auth/me');

  if (response.success && response.data) {
    return response.data.user;
  }

  throw new Error(response.message || 'Failed to get user info');
}

export async function getStoredRole(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ROLE_KEY);
  } catch (error) {
    console.error('Error getting stored role:', error);
    return null;
  }
}

export async function setStoredRole(role: string): Promise<void> {
  try {
    await AsyncStorage.setItem(ROLE_KEY, role);
  } catch (error) {
    console.error('Error setting stored role:', error);
  }
}

/**
 * Đăng ký tài khoản mới
 */
export interface SignUpRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  tenantId?: string;
}

export async function signUp(data: SignUpRequest): Promise<{ message: string }> {
  const response = await apiFetch<{ message: string }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (response.success) {
    return { message: response.message || 'Account created successfully' };
  }

  throw new Error(response.message || 'Sign up failed');
}
