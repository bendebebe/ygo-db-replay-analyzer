"use client"

import { createContext, useContext } from 'react'
import { PlayerContextType } from './types'

export const PlayerContext = createContext<PlayerContextType>({
  players: [],
  loading: false,
  error: undefined,
  getPlayer: async () => null,
  getPlayers: async () => []
})

export function usePlayer() {
  return useContext(PlayerContext)
}