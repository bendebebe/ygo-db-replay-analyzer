import { useQuery } from '@apollo/client'
import { GET_USER_DECKS } from '@/lib/graphql/queries/decks'
import { Deck } from '@/lib/contexts/deck/types'

export const useUserDecks = (userId?: string) => {
  return useQuery<{ userDecks: Deck[] }>(GET_USER_DECKS, {
    variables: { userId },
    skip: !userId
  })
}
