export interface Card {
  id: string
  name: string
  imageUrl: string
  serialNumber: string
  copies?: number
}

export interface Deck {
  id: string
  name: string
  userId: string
  gameNumber: number
  cards: Card[]
  createdAt: string
  updatedAt: string
}

export interface DeckContextType {
  decks: Deck[]
  loading: boolean
  error?: Error
  createDeck: (name: string, gameNumber: number, cards: { cardId: string, copies: number }[]) => Promise<void>
  updateDeck: (id: string, name: string, cards: { cardId: string, copies: number }[]) => Promise<void>
}

