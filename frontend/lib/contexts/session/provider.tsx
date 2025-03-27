"use client"

import { useState } from 'react'
import { SessionContext } from './context'
import { Session } from './types'
import { 
  useLazySessionQuery, 
  useLazySessionByShareableIdQuery 
} from '@/lib/hooks/session/queries'
import { 
  useCreateSession, 
  useUpdateSession, 
  useAttachUserToSession 
} from '@/lib/hooks/session/mutations'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error>()

  const [getSessionQuery] = useLazySessionQuery()
  const [getSessionByShareableIdQuery] = useLazySessionByShareableIdQuery()
  const [createSessionMutation] = useCreateSession()
  const [updateSessionMutation] = useUpdateSession()
  const [attachUserToSessionMutation] = useAttachUserToSession()

  const getSession = async (id: string): Promise<Session | null> => {
    try {
      setLoading(true)
      const { data } = await getSessionQuery({ variables: { id } })
      return data?.session || null
    } catch (error) {
      console.error('Error fetching session:', error)
      setError(error as Error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getSessionByShareableId = async (shareableId: string): Promise<Session | null> => {
    try {
      setLoading(true)
      const { data } = await getSessionByShareableIdQuery({ variables: { shareableId } })
      return data?.sessionByShareableId || null
    } catch (error) {
      console.error('Error fetching session by shareable ID:', error)
      setError(error as Error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const createSession = async (urls: string[]): Promise<Session> => {
    try {
      setLoading(true)
      const { data, errors } = await createSessionMutation({
        variables: { urls }
      })
      if (!data) {
        if (errors) {
          throw new Error(errors[0].message)
        } else {
          throw new Error('Failed to create session')
        }
      }
      const newSession = data?.createSession || null
      if (newSession) {
        setSessions(prev => [...prev, newSession])
      }
      return newSession || null
    } catch (error) {
      console.error('Error creating session:', error)
      setError(error as Error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateSession = async (id: string, isPublic: boolean): Promise<Session> => {
    try {
      setLoading(true)
      const { data, errors } = await updateSessionMutation({
        variables: { id, isPublic }
      })
      if (!data) {
        if (errors) {
          throw new Error(errors[0].message)
        } else {
          throw new Error('Failed to update session')
        }
      }
      const updatedSession = data?.updateSession
      if (updatedSession) {
        setSessions(prev => prev.map(session => 
          session.id === id ? updatedSession : session
        ))
      }
      return updatedSession 
    } catch (error) {
      console.error('Error updating session:', error)
      setError(error as Error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const attachUserToSession = async (sessionId: string): Promise<Session> => {
    try {
      setLoading(true)
      const { data, errors } = await attachUserToSessionMutation({
        variables: { sessionId }
      })
      if (!data) {
        if (errors) {
          throw new Error(errors[0].message)
        } else {
          throw new Error('Failed to attach user to session')
        }
      }
      const updatedSession = data?.attachUserToSession
      if (updatedSession) {
        setSessions(prev => prev.map(session => 
          session.id === sessionId ? updatedSession : session
        ))
      }
      return updatedSession
    } catch (error) {
      console.error('Error attaching user to session:', error)
      setError(error as Error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <SessionContext.Provider value={{
      sessions,
      loading,
      error,
      getSession,
      getSessionByShareableId,
      createSession,
      updateSession,
      attachUserToSession
    }}>
      {children}
    </SessionContext.Provider>
  )
}




