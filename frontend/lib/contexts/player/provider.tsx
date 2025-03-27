"use client"

import { useState } from 'react'
import { PlayerContext } from './context'
import { Player } from './types'
import { 
  useLazyPlayerQuery, 
  useLazyPlayersQuery 
} from '@/lib/hooks/player/queries'

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error>()

  const [getPlayerQuery] = useLazyPlayerQuery()
  const [getPlayersQuery] = useLazyPlayersQuery()

  const getPlayer = async (id: string): Promise<Player | null> => {
    try {
      setLoading(true)
      const { data } = await getPlayerQuery({ variables: { id } })
      return data?.player || null
    } catch (error) {
      console.error('Error fetching player:', error)
      setError(error as Error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getPlayers = async (): Promise<Player[]> => {
    try {
      setLoading(true)
      const { data } = await getPlayersQuery()
      const fetchedPlayers = data?.players || []
      setPlayers(fetchedPlayers)
      return fetchedPlayers
    } catch (error) {
      console.error('Error fetching players:', error)
      setError(error as Error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <PlayerContext.Provider value={{
      players,
      loading,
      error,
      getPlayer,
      getPlayers
    }}>
      {children}
    </PlayerContext.Provider>
  )
}