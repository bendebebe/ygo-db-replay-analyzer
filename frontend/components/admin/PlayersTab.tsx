"use client"

import * as React from "react"
import { AdminTable } from "./AdminTable"
import { useAdminPlayers } from "@/lib/hooks/admin"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlayerSearch } from "@/components/PlayerSearch"
import { Loader2 } from "lucide-react"
import { AdminPlayer, AdminReplay } from "@/lib/types/admin"
const PLAYERS_PAGE_SIZE = 10

export function PlayersTab() {
  const [page, setPage] = React.useState(1)
  const [sortColumn, setSortColumn] = React.useState<string>('createdAt')
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc')
  const [selectedPlayer, setSelectedPlayer] = React.useState<AdminPlayer | null>(null)

  const { players, totalCount, loading, deletePlayer } = useAdminPlayers({
    skip: (page - 1) * PLAYERS_PAGE_SIZE,
    take: PLAYERS_PAGE_SIZE,
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
      await deletePlayer(id)
    } catch (error) {
      console.error('Failed to delete player:', error)
    }
  }

  const handleRowClick = (player: AdminPlayer) => {
    setSelectedPlayer(player)
  }

  const renderReplaysTable = (player: AdminPlayer) => (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-900">
          <TableHead className="font-semibold">Replay URL</TableHead>
          <TableHead className="font-semibold">Opponent</TableHead>
          <TableHead className="font-semibold">Result</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {player.replays.map((replay: AdminReplay) => {
          const isPlayer1 = replay.player1.dbName === player.dbName
          const opponent = isPlayer1 ? replay.player2 : replay.player1
          const won = isPlayer1 ? replay.player1.rpsChoices[0].won : replay.player2.rpsChoices[0].won

          return (
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
              <TableCell>{opponent.dbName}</TableCell>
              <TableCell>{won ? 'Won' : 'Lost'}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )

  const columns = [
    { key: 'dbName', label: 'Player Name', sortable: true },
    { key: 'matchCount', label: 'Match Count', sortable: true },
    { key: 'winRate', label: 'Win Rate', sortable: true },
    { key: 'createdAt', label: 'Created At', sortable: true }
  ]

  const tableData = players?.map((player: AdminPlayer) => {
    const matchCount = player.replays.length
    const wins = player.replays.filter((replay: AdminReplay) => 
      (replay.player1.dbName === player.dbName && replay.player1.rpsChoices[0].won) ||
      (replay.player2.dbName === player.dbName && replay.player2.rpsChoices[0].won)
    ).length
    const winRate = matchCount > 0 ? ((wins / matchCount) * 100).toFixed(1) + '%' : '0%'

    return {
      ...player,
      matchCount,
      winRate
    }
  }) || []

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <AdminTable
        columns={columns}
        data={tableData}
        expandableContent={(item) => renderReplaysTable(item as AdminPlayer)}
        onDelete={handleDelete}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        page={page}
        pageSize={PLAYERS_PAGE_SIZE}
        totalCount={totalCount}
        onPageChangeAction={setPage}
        onRowClickAction={(item) => handleRowClick(item as AdminPlayer)}
      />
      
      {selectedPlayer && (
        <PlayerSearch initialPlayerId={selectedPlayer.id} />
      )}
    </div>
  )
} 