"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RpsChoice } from '@/types'

interface RPSStatsCardProps {
  rpsChoices: RpsChoice[]
  playerName: string
  showWinRate?: boolean
}

interface RPSStats {
  total: number
  wins: number
  rock: number
  paper: number
  scissors: number
}

export function RPSStatsCard({ rpsChoices, showWinRate = true }: RPSStatsCardProps) {
  const stats = React.useMemo(() => {
    const initialStats: RPSStats = {
      total: 0,
      wins: 0,
      rock: 0,
      paper: 0,
      scissors: 0
    }

    return rpsChoices.reduce((acc, choice) => {
      acc.total++
      if (choice.won) acc.wins++
      acc[choice.choice.toLowerCase() as 'rock' | 'paper' | 'scissors']++
      return acc
    }, initialStats)
  }, [rpsChoices])

  const getPercentage = React.useCallback((value: number) => {
    return stats.total > 0 ? (value / stats.total) * 100 : 0
  }, [stats])

  const formatPercentage = (value: number) => {
    return value.toFixed(1) + '%'
  }

  return (
    <div className="space-y-4">
      {showWinRate && (
        <Card className="bg-white/5 border-white/20">
          <CardHeader>
            <CardTitle className="text-lg">Rock Paper Scissors Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <p className="text-2xl font-bold">
                {formatPercentage(getPercentage(stats.wins))}
              </p>
              <p className="text-sm text-white/70">
                {stats.wins} RPS wins out of {stats.total} matches played
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <div className="grid grid-cols-[auto_128px_50px] items-center gap-2">
          <span>Rock</span>
          <div className="w-full bg-white/10 rounded-full overflow-hidden h-2">
            <div 
              className="h-full bg-red-500" 
              style={{ width: `${getPercentage(stats.rock)}%` }}
            />
          </div>
          <span className="text-sm text-right">
            {formatPercentage(getPercentage(stats.rock))}
          </span>
        </div>

        <div className="grid grid-cols-[auto_128px_50px] items-center gap-2">
          <span>Paper</span>
          <div className="w-full bg-white/10 rounded-full overflow-hidden h-2">
            <div 
              className="h-full bg-blue-500" 
              style={{ width: `${getPercentage(stats.paper)}%` }}
            />
          </div>
          <span className="text-sm text-right">
            {formatPercentage(getPercentage(stats.paper))}
          </span>
        </div>

        <div className="grid grid-cols-[auto_128px_50px] items-center gap-2">
          <span>Scissors</span>
          <div className="w-full bg-white/10 rounded-full overflow-hidden h-2">
            <div 
              className="h-full bg-green-500" 
              style={{ width: `${getPercentage(stats.scissors)}%` }}
            />
          </div>
          <span className="text-sm text-right">
            {formatPercentage(getPercentage(stats.scissors))}
          </span>
        </div>
      </div>
    </div>
  )
} 