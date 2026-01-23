/**
 * API Service - Base configuration và helper functions
 */

import { Platform } from 'react-native';

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

  // Trên iOS/Android, cần dùng IP address của máy
  // Thay đổi IP này thành IP của máy bạn (xem trong Expo terminal hoặc ipconfig)
  // Ví dụ: 'http://192.168.1.6:3000/api'
  // Hoặc dùng ngrok/tunnel cho production
  return 'http://192.168.1.6:3000/api'; // ⚠️ THAY ĐỔI IP NÀY THÀNH IP CỦA MÁY BẠN
};

const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@dacn_auth_token';

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
  }
}

/**
 * Base fetch function với authentication
 */
async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('API Request:', url); // Debug log
    console.log('Token present:', !!token); // Debug log
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Parse response JSON
    const data = await response.json().catch(() => {
      // If response is not JSON, return error message
      return { 
        success: false, 
        message: `HTTP ${response.status}: ${response.statusText}` 
      };
    });

    // Check if response is ok
    if (!response.ok) {
      const errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        message: errorMessage,
        data
      });
      throw new Error(errorMessage);
    }

    // Check if response has success field and it's false
    if (data.success === false) {
      const errorMessage = data.message || data.error || 'API request failed';
      console.error('API Error (success=false):', errorMessage);
      throw new Error(errorMessage);
    }

    return data;
  } catch (error: any) {
    console.error('API Error:', error);
    // Re-throw with better error message
    if (error.message) {
      throw error;
    }
    throw new Error(error.message || 'Network request failed');
  }
}

export { apiFetch, getAuthToken, removeAuthToken, setAuthToken };

