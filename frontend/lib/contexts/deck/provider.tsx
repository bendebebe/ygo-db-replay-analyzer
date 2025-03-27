"use client"

import { useState, useEffect } from 'react'
import { DeckContext } from './context'
import { Deck } from './types'
import { useCreateDeck, useUpdateDeck } from '@/lib/hooks/deck/mutations'
import { useUserDecks } from '@/lib/hooks/deck/queries'
import { useAuth } from '../auth'

export function DeckProvider({ children }: { children: React.ReactNode }) {
  const [decks, setDecks] = useState<Deck[]>([])
  const { user } = useAuth()
  
  const { loading, error, data } = useUserDecks(user?.id)
  
  // Update decks when data changes
  useEffect(() => {
    if (data?.userDecks) {
      setDecks(data.userDecks)
    }
  }, [data])
  
  const [createDeckMutation] = useCreateDeck()
  const [updateDeckMutation] = useUpdateDeck()

  const createDeck = async (name: string, gameNumber: number, cards: { cardId: string, copies: number }[]) => {
    try {
      const { data } = await createDeckMutation({
        variables: { name, gameNumber, cards }
      })
      if (data?.createDeck) {
        setDecks(prev => [...prev, data.createDeck])
      }
    } catch (error) {
      console.error('Error creating deck:', error)
      throw error
    }
  }

  const updateDeck = async (id: string, name: string, cards: { cardId: string, copies: number }[]) => {
    try {
      const { data } = await updateDeckMutation({
        variables: { id, name, cards }
      })
      if (data?.updateDeck) {
        setDecks(prev => prev.map(deck => deck.id === id ? data.updateDeck : deck))
      }
    } catch (error) {
      console.error('Error updating deck:', error)
      throw error
    }
  }

  return (
    <DeckContext.Provider value={{ decks, loading, error, createDeck, updateDeck }}>
      {children}
    </DeckContext.Provider>
  )
}

