export interface RpsChoice {
  id: string
  playerId: string
  replayId: string
  choice: string
  won: boolean
  createdAt: string
  updatedAt: string
}

export interface Player {
  id: string
  dbName: string
  createdAt?: string
  updatedAt?: string
  rpsChoices: RpsChoice[]
}

export interface PlayerContextType {
  players: Player[]
  loading: boolean
  error?: Error
  getPlayer: (id: string) => Promise<Player | null>
  getPlayers: () => Promise<Player[]>
}
