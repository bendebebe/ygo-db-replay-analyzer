export interface User {
  id: string
  email: string
  username?: string
}

export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isLoadingAuth: boolean
  isInitialized: boolean
}
