"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthGuard } from "@/components/AuthGuard"

interface Deck {
  id: number
  name: string
  imageCount: number
  lastModified: string
}

export default function DashboardPage() {
  const [decks, setDecks] = useState<Deck[]>([])
  const router = useRouter()

  useEffect(() => {
    // Fetch user's decks from the server
    // This is a placeholder and should be replaced with actual API call
    setDecks([
      { id: 1, name: "Deck 1", imageCount: 10, lastModified: "2023-05-15" },
      { id: 2, name: "Deck 2", imageCount: 15, lastModified: "2023-05-14" },
      { id: 3, name: "Deck 3", imageCount: 5, lastModified: "2023-05-13" },
    ])
  }, [])

  const handleNewDeck = (): void => {
    const deckName = prompt("Enter a name for your new deck:")
    if (deckName) {
      router.push(`/deck?id=new&name=${encodeURIComponent(deckName)}`)
    }
  }

  const handleDeleteDeck = (deckId: number, e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault()
    setDecks(decks.filter((deck) => deck.id !== deckId))
  }

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Your Decks</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleNewDeck} variant="gradient" className="transition-all duration-300 hover:scale-105 mb-4">
              New Deck
            </Button>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deck Name</TableHead>
                  <TableHead>Image Count</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decks.map((deck) => (
                  <TableRow key={deck.id}>
                    <TableCell>{deck.name}</TableCell>
                    <TableCell>{deck.imageCount}</TableCell>
                    <TableCell>{deck.lastModified}</TableCell>
                    <TableCell>
                      <Link href={`/deck?id=${deck.id}`}>
                        <Button variant="gradient" className="transition-all duration-300 hover:scale-105 mr-2">
                          View
                        </Button>
                      </Link>
                      <Button variant="gradient" className="transition-all duration-300 hover:scale-105" onClick={(e) => handleDeleteDeck(deck.id, e)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}

