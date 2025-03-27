"use client"

import { createContext, useContext } from 'react'
import { SessionContextType } from './types'

export const SessionContext = createContext<SessionContextType>({
  sessions: [],
  loading: false,
  getSession: async () => null,
  getSessionByShareableId: async () => null,
  createSession: async () => ({ 
    id: '',
    userId: null,
    user: null,
    replays: [],
    isPublic: false,
    shareableId: null,
    createdAt: '',
    updatedAt: ''
  }),
  updateSession: async () => ({ 
    id: '',
    userId: null,
    user: null,
    replays: [],
    isPublic: false,
    shareableId: null,
    createdAt: '',
    updatedAt: ''
  }),
  attachUserToSession: async () => ({ 
    id: '',
    userId: null,
    user: null,
    replays: [],
    isPublic: false,
    shareableId: null,
    createdAt: '',
    updatedAt: ''
  })
})

export function useSession() {
  return useContext(SessionContext)
}
