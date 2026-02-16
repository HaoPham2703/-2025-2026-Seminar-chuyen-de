import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { authService, type User, type SignupCredentials } from '../services/authService'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, tenantId?: string) => Promise<void>
  signup: (credentials: SignupCredentials) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    if (authService.isAuthenticated()) {
      refreshUser().finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Failed to get current user:', error)
      setUser(null)
      authService.logout()
    }
  }

  const login = async (email: string, password: string, tenantId?: string) => {
    const response = await authService.login({ email, password, tenantId })
    setUser(response.user)
  }

  const signup = async (credentials: SignupCredentials) => {
    const response = await authService.signup(credentials)
    setUser(response.user)
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
