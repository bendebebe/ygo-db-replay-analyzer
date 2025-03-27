"use client"

import * as React from "react"
import { AdminTable } from "./AdminTable"
import { useAdminReplays } from "@/lib/hooks/admin"
import { ReplaySessionAnalysis } from "@/components/ReplaySessionAnalysis"
import { Loader2 } from "lucide-react"
import { AdminReplay } from '@/lib/types/admin'

const REPLAYS_PAGE_SIZE = 10

export function ReplaysTab() {
  const [page, setPage] = React.useState(1)
  const [sortColumn, setSortColumn] = React.useState<string>('createdAt')
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedReplay, setSelectedReplay] = React.useState<any>(null)

  const { replays, totalCount, loading,deleteReplay } = useAdminReplays({
    skip: (page - 1) * REPLAYS_PAGE_SIZE,
    take: REPLAYS_PAGE_SIZE,
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
      await deleteReplay(id)
    } catch (error) {
      console.error('Failed to delete replay:', error)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRowClick = (replay:any) => {
    setSelectedReplay(replay)
  }

  const columns = [
    { key: 'replayUrl', label: 'Replay URL', sortable: true },
    { key: 'players', label: 'Players' },
    { key: 'winner', label: 'Winner' },
    { key: 'createdAt', label: 'Timestamp', sortable: true }
  ]

  const tableData = replays?.nodes?.map((replay: AdminReplay) => ({
    ...replay,
    players: `${replay.player1.dbName} vs ${replay.player2.dbName}`,
    winner: replay.player1.rpsChoices[0].won ? replay.player1.dbName : replay.player2.dbName,
  })) || []

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
        onDelete={handleDelete}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        page={page}
        pageSize={REPLAYS_PAGE_SIZE}
        totalCount={totalCount}
        onPageChangeAction={setPage}
        onRowClickAction={handleRowClick}
      />
      
      {selectedReplay && (
        <ReplaySessionAnalysis 
          replayResponse={[{
            url: selectedReplay.replayUrl,
            player1: {
              dbName: selectedReplay.player1.dbName,
              decks: selectedReplay.player1.decks,
              rpsData: selectedReplay.player1.rpsChoices
            },
            player2: {
              dbName: selectedReplay.player2.dbName,
              decks: selectedReplay.player2.decks,
              rpsData: selectedReplay.player2.rpsChoices
            }
          }]}
          isExpanded={true}
        />
      )}
    </div>
  )
} 