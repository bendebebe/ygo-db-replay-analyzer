import { useQuery, useLazyQuery } from '@apollo/client'
import { GET_REPLAY, GET_SESSION_REPLAYS } from '@/lib/graphql/queries/replays'
import { Replay } from '@/lib/contexts/replay/types'

export const useReplayQuery = (id?: string) => {
  return useQuery(GET_REPLAY, {
    variables: { id },
    skip: !id
  })
}

export const useLazyReplayQuery = () => {
  return useLazyQuery<{ replay: Replay }>(GET_REPLAY)
}

export const useSessionReplaysQuery = (sessionId?: string) => {
  return useQuery(GET_SESSION_REPLAYS, {
    variables: { sessionId },
    skip: !sessionId
  })
}

export const useLazySessionReplaysQuery = () => {
  return useLazyQuery<{ sessionReplays: Replay[] }>(GET_SESSION_REPLAYS)
} 