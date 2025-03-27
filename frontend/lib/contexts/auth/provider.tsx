"use client"

import { useState, useEffect } from 'react'
import { AuthContext } from './context'
import { User } from './types'
import { useLogin, useLogout } from '@/lib/hooks/auth/mutations'
import { useCheckAuth } from '@/lib/hooks/auth/queries'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  
  const [loginMutation] = useLogin()
  const [logoutMutation] = useLogout()
  
  const [checkAuthQuery, { data: authData, loading: isLoadingAuth }] = useCheckAuth()

  useEffect(() => {
    // Execute the auth check when the component mounts
    checkAuthQuery();
  }, [checkAuthQuery]);
  
  useEffect(() => {
    if (!isLoadingAuth && authData !== undefined) {
      setUser(authData?.checkAuth || null)
      setIsInitialized(true)
    }
  }, [authData, isLoadingAuth])

  const handleLogin = async (email: string, password: string) => {
    try {
      const { data } = await loginMutation({ 
        variables: { email, password },
        errorPolicy: 'all'
      })
      
      if (data?.login) {
        setUser(data.login)
      } else {
        throw new Error("Invalid credentials")
      }
    } catch (error) {
      console.error('Login failed:', error)
      if (error && typeof error === 'object' && 'message' in error) {
        throw new Error(error.message as string)
      }
      throw error
    }
  }

  const handleLogout = async () => {
    try {
      await logoutMutation()
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const value = {
    user,
    login: handleLogin,
    logout: handleLogout,
    isAuthenticated: !!user,
    isLoadingAuth,
    isInitialized
  }

  if (!isInitialized) {
    return null
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

