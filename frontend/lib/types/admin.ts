import { Replay } from '@/lib/contexts/replay/types'
import { Player } from '@/lib/contexts/player/types'

export interface AdminReplay extends Replay {
  players: Player[]
  winner: Player
}

export interface AdminSession {
  id: string
  createdAt: string
  isPublic: boolean
  shareableId: string
  userId: string
  replays: Replay[]
  replayCount: number
}

export interface AdminPlayer {
  id: string
  dbName: string
  createdAt: string
  matchCount: number
  winRate: string
  replays: AdminReplay[]
}

export interface AdminDeck {
  id: string
  game: string
  cards: Array<{
    cardId: string
    copies: number
  }>
  replays: Replay[]
  cardCount: number
  usageCount: number
  createdAt: string
} 