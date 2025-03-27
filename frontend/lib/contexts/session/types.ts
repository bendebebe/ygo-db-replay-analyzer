import { Replay } from '../replay/types'
import { User } from '../auth/types'

export interface Session {
  id: string
  userId: string | null
  user: User | null
  replays: Replay[]
  replayCount?: number
  isPublic: boolean
  shareableId: string | null
  createdAt: string
  updatedAt: string
}

export interface SessionContextType {
  sessions: Session[]
  loading: boolean
  error?: Error
  getSession: (id: string) => Promise<Session | null>
  getSessionByShareableId: (shareableId: string) => Promise<Session | null>
  createSession: (urls: string[]) => Promise<Session>
  updateSession: (id: string, isPublic: boolean) => Promise<Session>
  attachUserToSession: (sessionId: string) => Promise<Session>
}





