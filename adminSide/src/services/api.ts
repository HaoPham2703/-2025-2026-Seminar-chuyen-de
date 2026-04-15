const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Token management
const getToken = (): string | null => {
  return localStorage.getItem('admin_token')
}

const setToken = (token: string): void => {
  localStorage.setItem('admin_token', token)
}

const removeToken = (): void => {
  localStorage.removeItem('admin_token')
}

// API Client
interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
}

async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken()
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const url = `${API_URL}${endpoint}`
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`)
    console.log(`   Token: ${token ? 'Present' : 'Missing'}`)
    
    const response = await fetch(url, {
      ...options,
      headers,
    })

    console.log(`📥 API Response: ${response.status} ${response.statusText}`)
    console.log(`   URL: ${response.url}`)

    // Kiểm tra nếu response không phải JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('❌ Non-JSON response:', text)
      throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 200)}`)
    }

    const data: ApiResponse<T> = await response.json()

    if (!response.ok) {
      console.error('❌ API Error:', data)
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }

    return data
  } catch (error: any) {
    console.error('❌ API request failed:', error)
    if (error.message) {
      console.error('   Error message:', error.message)
    }
    throw error
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
  patch: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
}

export { getToken, setToken, removeToken }
export type { ApiResponse }
