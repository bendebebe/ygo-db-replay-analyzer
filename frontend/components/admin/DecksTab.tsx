"use client"

import * as React from "react"
import { AdminTable } from "./AdminTable"
import { useAdminDecks } from "@/lib/hooks/admin"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DeckDisplay } from "@/components/DeckDisplay"
import { Loader2 } from "lucide-react"

const DECKS_PAGE_SIZE = 10

export function DecksTab() {
  const [page, setPage] = React.useState(1)
  const [sortColumn, setSortColumn] = React.useState<string>('createdAt')
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc')

  const { decks, totalCount, loading, error, refetch, deleteDeck } = useAdminDecks({
    skip: (page - 1) * DECKS_PAGE_SIZE,
    take: DECKS_PAGE_SIZE,
    sortBy: sortColumn,
    sortOrder: sortDirection
  })

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDeck(id)
    } catch (error) {
      console.error('Failed to delete deck:', error)
    }
  }

  const renderDeckDetails = (deck: any) => (
    <div className="space-y-4">
      <DeckDisplay 
        playerData={[{
          game: deck.game,
          cards: deck.cards
        }]}
        activeGame={1}
        onGameChange={() => {}}
      />
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-900">
            <TableHead className="font-semibold">Replay URL</TableHead>
            <TableHead className="font-semibold">Players</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deck.replays.map((replay: any) => (
            <TableRow key={replay.id} className="bg-gray-800">
              <TableCell>
                <a
                  href={replay.replayUrl}
                  className="text-blue-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {replay.replayUrl}
                </a>
              </TableCell>
              <TableCell>{`${replay.player1.dbName} vs ${replay.player2.dbName}`}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  const columns = [
    { key: 'game', label: 'Game', sortable: true },
    { key: 'cardCount', label: 'Card Count', sortable: true },
    { key: 'usageCount', label: 'Times Used', sortable: true },
    { key: 'createdAt', label: 'Created At', sortable: true }
  ]

  const tableData = decks?.map(deck => ({
    id: deck.id,
    game: deck.game,
    cardCount: deck.cards.length,
    usageCount: deck.replays.length,
    createdAt: new Date(deck.createdAt).toLocaleString(),
    ...deck
  })) || []

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <AdminTable
      columns={columns}
      data={tableData}
      expandableContent={renderDeckDetails}
      onDelete={handleDelete}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={handleSort}
      page={page}
      pageSize={DECKS_PAGE_SIZE}
      totalCount={totalCount}
      onPageChange={setPage}
    />
  )
} 