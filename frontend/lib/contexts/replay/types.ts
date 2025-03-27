import { Session } from '../session/types'
import { Player } from '../player/types'
import { Deck } from '../deck/types'
import { ReplayResponse } from '@/lib/graphql/types/replays'

export interface RpsChoice {
  id: string
  playerId: string
  replayId: string
  choice: string
  won: boolean
  createdAt: string
  updatedAt: string
}

export interface Replay {
  id: string
  replayUrl: string
  sessionId: string
  player1Id: string
  player2Id: string
  winnerPlayerId: string | null
  session: Session
  player1: Player
  player2: Player
  winner: Player | null
  userId: string | null
  decks: Deck[]
  rpsChoices: RpsChoice[]
  createdAt: string
  updatedAt: string
}

export interface ReplayContextType {
  replays: Replay[]
  loading: boolean
  error?: Error
  refetchReplay: (id: string) => Promise<Replay | null>
  refetchSessionReplays: (sessionId: string) => Promise<Replay[]>
  fetchReplayData: (urls: string[]) => Promise<ReplayResponse[]>
} 