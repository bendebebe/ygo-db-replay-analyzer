"use client"

import { createContext, useContext } from 'react'
import { Replay } from './types'
import { ReplayResponse } from '@/lib/graphql/types/replays'

interface ReplayContextType {
  replays: Replay[]
  loading: boolean
  error: Error | undefined
  refetchReplay: (id: string) => Promise<Replay | null>
  refetchSessionReplays: (sessionId: string) => Promise<Replay[]>
  fetchReplayData: (urls: string[]) => Promise<ReplayResponse[]>
  submitReplayJobs: (urls: string[]) => Promise<string>
}

export const ReplayContext = createContext<ReplayContextType>({
  replays: [],
  loading: false,
  error: undefined,
  refetchReplay: async () => null,
  refetchSessionReplays: async () => [],
  fetchReplayData: async () => [],
  submitReplayJobs: async () => '',
})

export const useReplay = () => useContext(ReplayContext)