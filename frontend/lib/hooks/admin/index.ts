import { useQuery, useMutation } from '@apollo/client'
import { 
  GET_ADMIN_SESSIONS, 
  GET_ADMIN_REPLAYS, 
  GET_ADMIN_PLAYERS, 
  GET_ADMIN_DECKS,
  DELETE_SESSION,
  DELETE_REPLAY,
  DELETE_PLAYER,
} from '@/lib/graphql/queries/admin'

interface UseAdminQueryProps {
  skip?: number
  take?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const useAdminSessions = ({ skip = 0, take = 10, sortBy, sortOrder }: UseAdminQueryProps = {}) => {
  const { data, loading, error, refetch } = useQuery(GET_ADMIN_SESSIONS, {
    variables: { skip, take, sortBy, sortOrder },
    fetchPolicy: 'network-only'
  })

  const [deleteSession] = useMutation(DELETE_SESSION, {
    onCompleted: () => refetch()
  })

  return {
    sessions: data?.sessions?.nodes || [],
    totalCount: data?.sessions?.totalCount || 0,
    loading,
    error,
    refetch,
    deleteSession: (id: string) => deleteSession({ variables: { id } })
  }
}

export const useAdminReplays = ({ skip = 0, take = 10 }: UseAdminQueryProps = {}) => {
  const { data, loading, error, refetch } = useQuery(GET_ADMIN_REPLAYS, {
    variables: { skip, take },
    fetchPolicy: 'network-only'
  })

  const [deleteReplay] = useMutation(DELETE_REPLAY, {
    onCompleted: () => refetch()
  })

  return {
    replays: data?.replays || [],
    totalCount: data?.replays?.length || 0,
    loading,
    error,
    refetch,
    deleteReplay: (id: string) => deleteReplay({ variables: { id } })
  }
}

export const useAdminPlayers = ({ skip = 0, take = 10, sortBy, sortOrder }: UseAdminQueryProps = {}) => {
  const { data, loading, error, refetch } = useQuery(GET_ADMIN_PLAYERS, {
    variables: { skip, take, sortBy, sortOrder },
    fetchPolicy: 'network-only'
  })

  const [deletePlayer] = useMutation(DELETE_PLAYER, {
    onCompleted: () => refetch()
  })

  return {
    players: data?.players?.nodes || [],
    totalCount: data?.players?.totalCount || 0,
    loading,
    error,
    refetch,
    deletePlayer: (id: string) => deletePlayer({ variables: { id } })
  }
}

export const useAdminDecks = ({ skip = 0, take = 10, sortBy, sortOrder }: UseAdminQueryProps = {}) => {
  const { data, loading, error, refetch } = useQuery(GET_ADMIN_DECKS, {
    variables: { skip, take, sortBy, sortOrder },
    fetchPolicy: 'network-only'
  })

  return {
    decks: data?.decks || [],
    loading,
    error,
    refetch
  }
} 