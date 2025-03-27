import { useQuery, useLazyQuery } from '@apollo/client'
import { GET_PLAYER, GET_PLAYERS } from '@/lib/graphql/queries/players'
import { Player } from '@/lib/contexts/player/types'

export const usePlayerQuery = (id?: string) => {
  return useQuery(GET_PLAYER, {
    variables: { id },
    skip: !id
  })
}

export const useLazyPlayerQuery = () => {
  return useLazyQuery<{ player: Player }>(GET_PLAYER)
}

export const usePlayersQuery = () => {
  return useQuery<{ players: Player[] }>(GET_PLAYERS)
}

export const useLazyPlayersQuery = () => {
  return useLazyQuery<{ players: Player[] }>(GET_PLAYERS)
}