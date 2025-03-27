"use client"

import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Replay {
  id: string
  replayUrl: string
}

interface ReplayListProps {
  replays1: Replay[]
  replays2: Replay[]
  wonReplays: Replay[]
}

const REPLAYS_PER_PAGE = 5

export function ReplayList({ replays1, replays2, wonReplays }: ReplayListProps) {
  const [page, setPage] = React.useState(1)

  const allReplays = React.useMemo(() => {
    const combined = [...replays1, ...replays2]
    const wonReplayIds = new Set(wonReplays.map(r => r.id))
    
    return combined
      .filter((replay, index, self) => 
        // Remove duplicates
        index === self.findIndex(r => r.id === replay.id)
      )
      .map(replay => ({
        ...replay,
        won: wonReplayIds.has(replay.id)
      }))
  }, [replays1, replays2, wonReplays])

  const totalPages = Math.ceil(allReplays.length / REPLAYS_PER_PAGE)
  const paginatedReplays = allReplays.slice(
    (page - 1) * REPLAYS_PER_PAGE,
    page * REPLAYS_PER_PAGE
  )

  return (
    <div className="flex flex-col">
      <div className="overflow-auto" style={{ maxHeight: '400px' }}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-white/5">
              <TableHead className="sticky top-0 bg-black">Replay URL</TableHead>
              <TableHead className="sticky top-0 bg-black w-36">Match Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedReplays.map((replay) => (
              <TableRow key={replay.id} className="hover:bg-white/5">
                <TableCell>
                  <a 
                    href={replay.replayUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {replay.replayUrl}
                  </a>
                </TableCell>
                <TableCell>
                  <span className={`text-sm font-medium px-3 py-1.5 ${replay.won ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"} rounded-full`}>
                    {replay.won ? "Won" : "Lost"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center p-4 border-t border-white/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-white/70 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-white/70">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-white/70 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
} 