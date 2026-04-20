const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api'

interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
}

async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || `HTTP error ${response.status}`)
  }

  const data: ApiResponse<T> = await response.json()
  return data
}

const getToken = async (): Promise<string | null> => {
  // Expo SecureStore or AsyncStorage
  try {
    const { default: SecureStore } = await import('expo-secure-store')
    return SecureStore.getItemAsync('auth_token')
  } catch {
    // fallback: return null
    return null
  }
}

const setToken = async (token: string): Promise<void> => {
  try {
    const { default: SecureStore } = await import('expo-secure-store')
    await SecureStore.setItemAsync('auth_token', token)
  } catch {
    // silent fail
  }
}

const removeToken = async (): Promise<void> => {
  try {
    const { default: SecureStore } = await import('expo-secure-store')
    await SecureStore.deleteItemAsync('auth_token')
  } catch {
    // silent fail
  }
}

export const api = {
  get: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  put: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  delete: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: 'DELETE',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
}

export { getToken, setToken, removeToken }
