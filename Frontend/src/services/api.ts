/**
 * API Service - Base configuration và helper functions
 */

import { DeviceEventEmitter, Platform } from 'react-native';
import Constants from 'expo-constants';

// Detect platform và sử dụng IP address phù hợp
// Trên iOS/Android simulator, localhost không hoạt động, cần dùng IP thực tế
const getApiBaseUrl = () => {
  // Nếu có env variable, dùng nó
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Trên web, dùng localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api';
  }

  // Cố gắng auto-detect IP từ Expo dev server (hostUri dạng "192.168.x.x:19000")
  const hostUri = Constants.expoConfig?.hostUri || Constants.hostUri;
  const host = hostUri?.split(':')?.[0];
  if (host && /^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return `http://${host}:3000/api`;
  }

  // Android Emulator: localhost của emulator != localhost của máy host
  // (chỉ dùng khi không detect được hostUri và cũng không có EXPO_PUBLIC_API_URL)
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }

  // Fallback: yêu cầu cấu hình EXPO_PUBLIC_API_URL khi chạy trên device thật
  console.warn(
    'EXPO_PUBLIC_API_URL is not set; falling back to localhost. ' +
      'On physical devices, set EXPO_PUBLIC_API_URL to your machine LAN IP (e.g. http://192.168.1.10:3000/api).'
  );
  return 'http://localhost:3000/api';
};

const API_BASE_URL = getApiBaseUrl();
console.log('[api] API_BASE_URL:', API_BASE_URL);

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@dacn_auth_token';
const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';
let hasEmittedUnauthorized = false;

function isPublicAuthEndpoint(endpoint: string): boolean {
  return (
    endpoint.startsWith('/auth/login') ||
    endpoint.startsWith('/auth/signup') ||
    endpoint.startsWith('/auth/refresh-token')
  );
}

/**
 * Get auth token from storage (AsyncStorage)
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    console.log('Get token from storage:', token ? 'Token exists' : 'No token');
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

/**
 * Set auth token to storage
 */
async function setAuthToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    hasEmittedUnauthorized = false;
    console.log('Token saved to storage successfully');
    // Verify token was saved
    const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
    console.log('Token verification:', savedToken ? 'Token saved correctly' : 'Token not saved');
  } catch (error) {
    console.error('Error saving token:', error);
    throw error;
  }
}

/**
 * Remove auth token from storage
 */
async function removeAuthToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token:', error);
    // Không throw — xóa thất bại không ảnh hưởng luồng logout
  }
}

/**
 * Base fetch function với authentication + auto-refresh token
 */
async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<ApiResponse<T>> {
  const token = await getAuthToken();
  const isAuthPublic = isPublicAuthEndpoint(endpoint);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('API Request:', url);
    console.log('Token present:', !!token);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({
      success: false,
      message: `HTTP ${response.status}: ${response.statusText}`,
    }));

    // Chỉ thử refresh khi đang có token và endpoint không phải public auth.
    // Tránh trường hợp chưa login nhưng lại báo "Token expired".
    if (response.status === 401 && retryCount === 0 && !!token && !isAuthPublic) {
      console.log('Token expired, attempting refresh...');
      const refreshed = await refreshToken();
      if (refreshed) {
        console.log('Token refreshed, retrying request...');
        return apiFetch<T>(endpoint, options, retryCount + 1);
      }
      // Refresh thất bại → emit unauthorized
      await removeAuthToken();
      if (!hasEmittedUnauthorized) {
        hasEmittedUnauthorized = true;
        DeviceEventEmitter.emit(AUTH_UNAUTHORIZED_EVENT);
      }
      throw new Error('Token expired. Please login again.');
    }

    if (!response.ok) {
      const errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
      console.error('API Error Response:', { status: response.status, message: errorMessage, data });

      if (response.status === 401) {
        // Public auth endpoint trả 401 (vd sai mật khẩu) thì không đụng token global.
        if (!isAuthPublic) {
          await removeAuthToken();
          if (!hasEmittedUnauthorized) {
            hasEmittedUnauthorized = true;
            DeviceEventEmitter.emit(AUTH_UNAUTHORIZED_EVENT);
          }
        }
      }

      throw new Error(errorMessage);
    }

    if (data.success === false) {
      const errorMessage = data.message || data.error || 'API request failed';
      console.error('API Error (success=false):', errorMessage);
      throw new Error(errorMessage);
    }

    return data;
  } catch (error: any) {
    console.error('API Error:', error);
    if (error.message) {
      throw error;
    }
    throw new Error(error.message || 'Network request failed');
  }
}

/**
 * Gọi /auth/refresh-token để lấy token mới
 */
async function refreshToken(): Promise<boolean> {
  try {
    const token = await getAuthToken();
    if (!token) return false;

    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (data.success && data.data?.token) {
      await setAuthToken(data.data.token);
      hasEmittedUnauthorized = false;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export { apiFetch, getAuthToken, removeAuthToken, setAuthToken, refreshToken, AUTH_UNAUTHORIZED_EVENT };

