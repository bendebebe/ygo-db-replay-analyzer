"use client"

import * as React from "react"
import { useQuery } from "@apollo/client"
import { SEARCH_PLAYERS, GET_PLAYER_PROFILE } from "@/lib/graphql/queries/players"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RPSStatsCard } from "./RPSStatsCard"
import { ReplayList } from "./ReplayList"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { usePlayer } from "@/lib/contexts/player"
import { Player } from "@/lib/contexts/player/types"
import { AppCard } from "@/components/ui/app-card"

interface Replay {
  id: string
  replayUrl: string
}

interface RpsChoice {
  choice: string
  won: boolean
}

interface PlayerProfile {
  playerId: string
  dbName: string
  replays1: Replay[]
  replays2: Replay[]
  wonReplays: Replay[]
  rpsChoices: RpsChoice[]
}

interface SearchPlayer {
  playerId: string
  dbName: string
}

interface SearchPlayersResponse {
  players: SearchPlayer[]
  totalCount: number
}

interface PlayerSearchProps {
  initialPlayerId?: string
}

const RESULTS_PER_PAGE = 5

export function PlayerSearch({ initialPlayerId }: PlayerSearchProps) {
  const { loading: contextLoading } = usePlayer()
  const [search, setSearch] = React.useState("")
  const [selectedPlayerId, setSelectedPlayerId] = React.useState<string>(initialPlayerId || "")
  const [showLoader, setShowLoader] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [isExpanded, setIsExpanded] = React.useState(true)
  const [isOpen, setIsOpen] = React.useState(false)
  const [isReplaysExpanded, setIsReplaysExpanded] = React.useState(false)

  const { data: searchData, loading: searchLoading } = useQuery<{ searchPlayers: SearchPlayersResponse }>(SEARCH_PLAYERS, {
    variables: { 
      dbName: search,
      skip: (page - 1) * RESULTS_PER_PAGE,
      take: RESULTS_PER_PAGE
    },
    skip: search.length < 2
  })

  const { data: playerData } = useQuery<{ playerByPlayerId: PlayerProfile | null }>(GET_PLAYER_PROFILE, {
    variables: { playerId: selectedPlayerId },
    skip: !selectedPlayerId
  })

  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setPage(1) // Reset pagination when search changes
  }, [search])

  React.useEffect(() => {
    let timeout: NodeJS.Timeout
    if (searchLoading) {
      timeout = setTimeout(() => {
        setShowLoader(true)
      }, 1000)
    } else {
      setShowLoader(false)
    }
    return () => clearTimeout(timeout)
  }, [searchLoading])

  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const player = playerData?.playerByPlayerId
  const { players = [] } = searchData?.searchPlayers || {}

  const loading = contextLoading || searchLoading

  return (
    <AppCard 
      title="Player Lookup"
      description="Search for a player to view their match history, RPS statistics, and replay analysis."
      className="mt-4 rounded-xl overflow-hidden"
      collapsible={true}
    >
      <div className="space-y-6">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <div className="pt-4">
              <Input
                ref={inputRef}
                placeholder="Search for a player..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setIsOpen(e.target.value.length >= 2)
                }}
                className="bg-white/5 border-white/20 text-white"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[--radix-popover-trigger-width] p-0 bg-black border-white/20"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {showLoader && (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-white/70" />
              </div>
            )}

            {!loading && search.length >= 2 && players.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-white/70">No players found</p>
              </div>
            )}

            {!loading && players.length > 0 && (
              <div className="py-2">
                {players.map((searchPlayer) => (
                  <button
                    key={searchPlayer.playerId}
                    onClick={() => {
                      setSelectedPlayerId(searchPlayer.playerId)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 transition-colors",
                      selectedPlayerId === searchPlayer.playerId
                        ? "bg-white/20 text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {searchPlayer.dbName}
                  </button>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>

        {player && (
          <div className="space-y-4">
            <Card className="bg-white/5 border-white/20">
              <CardHeader className="app-card-header">
                <CardTitle className="app-title">{player.dbName}'s Profile</CardTitle>
                <p className="app-description">Viewing player statistics and replays</p>
              </CardHeader>
            </Card>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-white/5 border-white/20">
                <CardHeader className="pb-2 border-b border-white/10">
                  <CardTitle className="text-lg">Player Info</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/70">DuelingBook Name</span>
                      <span>{player.dbName}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-white/70">Total Match Win Rate</span>
                      <span>
                        {player.replays1.length + player.replays2.length > 0
                          ? ((player.wonReplays.length / (player.replays1.length + player.replays2.length)) * 100).toFixed(1)
                          : "0.0"}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Total Match Wins</span>
                      <span>{player.wonReplays.length} / {player.replays1.length + player.replays2.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">RPS Win Rate</span>
                      <span>
                        {player.rpsChoices.length > 0
                          ? ((player.rpsChoices.filter(c => c.won).length / player.rpsChoices.length) * 100).toFixed(1)
                          : "0.0"}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">RPS Wins</span>
                      <span>
                        {player.rpsChoices.filter(c => c.won).length} / {player.rpsChoices.length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {player.rpsChoices.length > 0 && (
                <Card className="bg-white/5 border-white/20">
                  <CardHeader className="pb-2 border-b border-white/10">
                    <CardTitle className="text-lg">Choice Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <RPSStatsCard 
                      rpsChoices={player.rpsChoices} 
                      playerName={player.dbName}
                      showWinRate={false}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {player && player.replays1 && player.replays2 && (
              <AppCard
                title="Match History"
                description={`${player.replays1.length + player.replays2.length} ${
                  player.replays1.length + player.replays2.length === 1 ? 'Match' : 'Matches'
                } Recorded`}
                className="bg-white/5 border-white/20 mt-4"
                collapsible={true}
                contentClassName="p-0"
              >
                {player?.replays1 && player?.replays2 ? (
                  <div className="overflow-hidden">
                    <ReplayList 
                      replays1={player.replays1}
                      replays2={player.replays2}
                      wonReplays={player.wonReplays}
                    />
                  </div>
                ) : (
                  <div className="p-6">
                    <p className="text-white/70">No replays found</p>
                  </div>
                )}
              </AppCard>
            )}
          </div>
        )}
      </div>
    </AppCard>
  )
} 