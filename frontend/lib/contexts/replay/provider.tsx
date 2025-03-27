"use client"

import { useState } from 'react'
import { ReplayContext } from './context'
import { Replay } from './types'
import { ReplayResponse } from '@/lib/graphql/types/replays'
import { useLazyReplayQuery, useLazySessionReplaysQuery } from '@/lib/hooks/replay/queries'
import { useFetchReplayData, useSubmitReplayJobs } from '@/lib/hooks/replay/mutations'

export function ReplayProvider({ children }: { children: React.ReactNode }) {
  const [replays, setReplays] = useState<Replay[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | undefined>()

  const [getReplayQuery] = useLazyReplayQuery()
  const [getSessionReplaysQuery] = useLazySessionReplaysQuery()
  const [fetchReplayDataMutation] = useFetchReplayData()
  const [submitReplayJobsMutation] = useSubmitReplayJobs()

  const refetchReplay = async (id: string): Promise<Replay | null> => {
    try {
      setLoading(true)
      const { data, error } = await getReplayQuery({ variables: { id } })
      if (error) {
        throw error
      }
      const replay = data?.replay || null
      if (replay) {
        setReplays(prev => {
          const exists = prev.some(r => r.id === replay.id)
          if (exists) {
            return prev.map(r => r.id === replay.id ? replay : r)
          } else {
            return [...prev, replay]
          }
        })
      }
      return replay
    } catch (e) {
      console.error('Error refetching replay:', e)
      setError(e as Error)
      throw e
    } finally {
      setLoading(false)
    }
  }

  const refetchSessionReplays = async (sessionId: string): Promise<Replay[]> => {
    try {
      setLoading(true)
      const { data, error } = await getSessionReplaysQuery({ variables: { sessionId } })
      if (error) {
        throw error
      }
      const fetchedReplays = data?.sessionReplays || []
      setReplays(prev => {
        const newReplays = fetchedReplays.filter(r => !prev.some(pr => pr.id === r.id))
        return [...prev, ...newReplays]
      })
      return fetchedReplays
    } catch (e) {
      console.error('Error fetching session replays:', e)
      setError(e as Error)
      throw e
    } finally {
      setLoading(false)
    }
  }

  const fetchReplayData = async (urls: string[]): Promise<ReplayResponse[]> => {
    try {
      setLoading(true)
      const { data, errors } = await fetchReplayDataMutation({ variables: { urls } })
      if (errors) {
        throw errors
      }
      return data?.fetchReplayData || []
    } catch (error) {
      console.error('Error fetching replay data:', error)
      setError(error as Error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const submitReplayJobs = async (urls: string[]): Promise<string> => {
    try {
      setLoading(true)
      const { data, errors } = await submitReplayJobsMutation({ variables: { urls } })
      if (errors) {
        throw errors
      }
      return data?.submitReplayJobs || ''
    } catch (error) {
      console.error('Error submitting replay jobs:', error)
      setError(error as Error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <ReplayContext.Provider value={{
      replays,
      loading,
      error,
      refetchReplay,
      refetchSessionReplays,
      fetchReplayData,
      submitReplayJobs
    }}>
      {children}
    </ReplayContext.Provider>
  )
}