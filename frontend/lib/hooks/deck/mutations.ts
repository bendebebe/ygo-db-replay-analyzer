import { useMutation } from '@apollo/client'
import { CREATE_DECK, UPDATE_DECK } from '@/lib/graphql/mutations/decks'
import { Deck } from '@/lib/contexts/deck/types'

export const useCreateDeck = () => {
  return useMutation<{ createDeck: Deck }>(CREATE_DECK)
}

export const useUpdateDeck = () => {
  return useMutation<{ updateDeck: Deck }>(UPDATE_DECK)
}
