"use client"

import { createContext, useContext } from 'react'
import { DeckContextType } from './types'

export const DeckContext = createContext<DeckContextType>({
  decks: [],
  loading: false,
  createDeck: async () => {},
  updateDeck: async () => {}
})

export function useDeck() {
  return useContext(DeckContext)
}

