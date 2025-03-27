import { Replay } from "./replays"

export interface Session {
  id: string
  userId: string | null
  isPublic: boolean
  shareableId: string | null
  createdAt: string
  replays: Replay[]
}

export interface SessionsResponse {
  sessions: {
    nodes: Session[]
    totalCount: number
  }
}

export interface SessionsQueryVariables {
  skip?: number
  take?: number
} 