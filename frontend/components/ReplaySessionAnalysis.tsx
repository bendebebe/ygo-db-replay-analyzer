"use client"

import * as React from "react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { DeckDisplay } from './DeckDisplay'
import { ReplayPlayer, ReplayResponse } from "@/lib/graphql/types/replays"
import { ReplayDeck } from '../lib/graphql/types/sessions';

interface ReplaySessionAnalysisProps {
  replayResponse: ReplayResponse[]
  sessionId: string
  isExpanded?: boolean
}

export function ReplaySessionAnalysis({ replayResponse, isExpanded = true }: ReplaySessionAnalysisProps) {
  const [isOpen, setIsOpen] = React.useState(isExpanded)
  const [selectedPlayer, setSelectedPlayer] = React.useState<string | null>(null)
  const [activeGames, setActiveGames] = React.useState<Record<string, number>>({})
  const [openStates, setOpenStates] = React.useState({
    player1: isExpanded,
    player2: isExpanded
  })
  const [currentReplayIndex, setCurrentReplayIndex] = React.useState(0)

  // Get unique players from all responses
  const players = React.useMemo(() => {
    const playerSet = new Set<string>()
    replayResponse.forEach(response => {
      playerSet.add(response.player1.dbName)
      playerSet.add(response.player2.dbName)
    })
    return Array.from(playerSet).sort()
  }, [replayResponse])

  // Filter replays for the selected player
  const playerReplays = React.useMemo(() => {
    if (!selectedPlayer) return [];
    
    const filteredReplays = replayResponse.filter(replay =>
      replay.player1.dbName === selectedPlayer || 
      replay.player2.dbName === selectedPlayer
    );
    console.log("Selected player:", selectedPlayer);
    console.log("Filtered replays:", filteredReplays);
    return filteredReplays;
  }, [replayResponse, selectedPlayer]);

  // Get the current replay based on the index from filtered player replays
  const currentReplay = React.useMemo(() => 
    playerReplays[currentReplayIndex],
  [playerReplays, currentReplayIndex]);

  // Simple navigation handlers
  const handlePrevReplay = () => {
    if (currentReplayIndex > 0) {
      setCurrentReplayIndex(prev => prev - 1)
      setActiveGames(prev => ({ ...prev, [selectedPlayer!]: 1 }))
    }
  }

  const handleNextReplay = () => {
    if (currentReplayIndex < playerReplays.length - 1) {
      setCurrentReplayIndex(prev => prev + 1)
      setActiveGames(prev => ({ ...prev, [selectedPlayer!]: 1 }))
    }
  }

  // Effect to log when activeGames changes
  React.useEffect(() => {
    if (selectedPlayer) {
      // Removed console.log for activeGames changes
    }
  }, [activeGames, selectedPlayer]);

  // Effect to sync with parent isExpanded state
  React.useEffect(() => {
    setOpenStates({
      player1: isExpanded,
      player2: isExpanded
    })
  }, [isExpanded])

  // Update handlePlayerSelect to reset the currentReplayIndex
  const handlePlayerSelect = (player: string) => {
    setSelectedPlayer(player);
    setCurrentReplayIndex(0);
  };

  // Add logging when deck is passed to DeckDisplay
  const renderDeckDisplay = (replayResponsePlayer: ReplayPlayer, activeGame: number) => {
    // Removed all console.log statements for deck rendering
    
    // Filter decks by gameNumber
    const playerData: ReplayDeck[] = replayResponsePlayer.decks.map(deck => ({
      id: deck.id,
      name: deck.name,
      gameNumber: deck.gameNumber,
      playerId: replayResponsePlayer.rpsData.playerId,
      cards: deck.cards.map(card => ({
        ...card,
        name: card.ygoInfo.name
      }))
    }));
    
    return (
      <DeckDisplay 
        playerData={playerData}
        activeGame={activeGame}
        onGameChange={(game) => {
          // Removed console.log for game changes
          setActiveGames(prev => ({ ...prev, [selectedPlayer!]: game }));
        }}
      />
    );
  };

  // Render the main content for single replay
  const renderSingleReplay = (response: ReplayResponse) => (
    <CardContent className="p-0">
      {/* Player 1 Section */}
      <Collapsible
        open={openStates?.player1}
        onOpenChange={(open) => setOpenStates(prev => ({ ...prev, player1: open }))}
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex justify-between items-center py-6 px-6 hover:bg-white/5 rounded-none border-t border-white/20"
          >
            <h3 className="text-xl text-white text-left font-semibold">
              {response.player1.dbName}&apos;s Deck
            </h3>
            {openStates?.player1 ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-6 py-4 border-t border-white/20 bg-white/5">
            {renderDeckDisplay(response.player1, activeGames[response.player1.dbName] || 1)}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Player 2 Section */}
      <Collapsible
        open={openStates?.player2}
        onOpenChange={(open) => setOpenStates(prev => ({ ...prev, player2: open }))}
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex justify-between items-center py-6 px-6 hover:bg-white/5 rounded-none border-t border-white/20"
          >
            <h3 className="text-xl text-white text-left font-semibold">
              {response.player2.dbName}&apos;s Deck
            </h3>
            {openStates?.player2 ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-6 py-4 border-t border-white/20 bg-white/5">
            {renderDeckDisplay(response.player2, activeGames[response.player2.dbName] || 1)}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </CardContent>
  )

  const renderMultipleReplays = () => {
    // Removed console.log for deck change detection
    
    return (
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-medium text-white">Player Selection</h3>
          <p className="text-sm text-white/70 mb-2">
            Choose a player to view their decks across all replays
          </p>
          <Select 
            value={selectedPlayer || ''} 
            onValueChange={handlePlayerSelect}
          >
            <SelectTrigger 
              id="player-select"
              className="bg-black/40 border-white/20 text-white w-[300px]"
            >
              <SelectValue placeholder="Select player" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/20">
              {players.map(player => (
                <SelectItem 
                  key={player} 
                  value={player}
                  className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white"
                >
                  {player}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPlayer && currentReplay && (
          <>
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="space-y-2">
                <div className="text-white font-medium">
                  Replay {currentReplayIndex + 1} of {playerReplays.length}
                </div>
                <div className="text-white/70 text-sm truncate max-w-[500px]">
                  {currentReplay.url}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePrevReplay}
                  disabled={currentReplayIndex === 0}
                  className="border-white/20 text-white hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  Previous Replay
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleNextReplay}
                  disabled={currentReplayIndex === playerReplays.length - 1}
                  className="border-white/20 text-white hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  Next Replay
                </Button>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="text-lg font-medium text-white mb-4">
                {selectedPlayer}&apos;s Deck - Replay {currentReplayIndex + 1}
              </h3>
              <div className="mb-4 bg-black/20 p-2 rounded text-white/80 text-sm">
                <p className="mb-1"><strong>Replay URL:</strong> {currentReplay.url}</p>
                <p><strong>Player:</strong> {selectedPlayer}</p>
              </div>
              {/* 
                Directly calculate which player data to use on each render
                This avoids using a separate memo and recalculates from the current replay and selected player
              */}
              {renderDeckDisplay(
                selectedPlayer === currentReplay.player1.dbName 
                  ? currentReplay.player1 
                  : currentReplay.player2, 
                activeGames[selectedPlayer] || 1
              )}
            </div>
          </>
        )}
      </div>
    </CardContent>
  )}

  return (
    <Card className="mt-4 bg-black border-white/20 rounded-xl overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex justify-between items-center py-8 px-6 hover:bg-white/5 rounded-none min-h-[100px]"
          >
            <div className="flex flex-col items-start gap-2">
              <CardTitle className="text-3xl text-white text-left">Replay Analysis</CardTitle>
              <p className="text-gray-400 text-left text-sm">
                View the analyzed deck contents
              </p>
            </div>
            {isOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {/* If there's only one replay in the replayResponse, always use the singleReplay renderer */}
          {/* Otherwise, use the multiple replays renderer which will filter based on selected player */}
          {replayResponse.length === 1 
            ? renderSingleReplay(replayResponse[0])
            : renderMultipleReplays()
          }
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
} 