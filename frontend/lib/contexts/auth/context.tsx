"use client"

import { createContext, useContext } from 'react'
import { AuthContextType } from './types'

export const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  login: async () => {}, 
  logout: async () => {},
  isAuthenticated: false,
  isLoadingAuth: false,
  isInitialized: false
})

export function useAuth() {
  return useContext(AuthContext)
} 