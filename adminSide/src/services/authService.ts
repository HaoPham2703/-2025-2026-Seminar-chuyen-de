import { api, setToken, removeToken, getToken } from './api'

export interface LoginCredentials {
  email: string
  password: string
  tenantId?: string
}

export interface SignupCredentials {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  tenantId?: string
}

export interface User {
  id: string
  email: string
  role: string
  firstName?: string
  lastName?: string
}

export interface LoginResponse {
  token: string
  user: User
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials)
    if (response.data?.token) {
      setToken(response.data.token)
    }
    return response.data!
  },

  async signup(credentials: SignupCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/signup', credentials)
    if (response.data?.token) {
      setToken(response.data.token)
    }
    return response.data!
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me')
    return response.data!
  },

  logout(): void {
    removeToken()
  },

  isAuthenticated(): boolean {
    return !!getToken()
  },
}
