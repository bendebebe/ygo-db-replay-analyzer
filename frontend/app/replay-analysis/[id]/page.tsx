"use client"

import React from 'react'
import { useQuery } from '@apollo/client'
import { useParams, useRouter } from 'next/navigation'
import { GET_SESSION_DETAILS } from '@/lib/graphql/queries/sessions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReplaySessionAnalysis } from '@/components/ReplaySessionAnalysis'
import { ReplayResponse } from '@/lib/graphql/types/replays'
import { YgoCardInfo } from '@/lib/graphql/types/cards'

// Define the interfaces needed for type safety
interface ReplayCard {
  serialNumber: string;
  name: string;
  imageUrl: string;
  copies: number;
  ygoInfo: YgoCardInfo;
}

interface ReplayDeck {
  id: string;
  name: string;
  gameNumber: number;
  cards: ReplayCard[];
}

interface RpsData {
  playerId: string;
  choice: string;
  won: boolean;
}

interface ReplayPlayer {
  id: string;
  dbName: string;
  rpsData: RpsData[] | null;
  decks: ReplayDeck[];
}

interface ReplayAnalysis {
  id: string;
  replayUrl: string;
  createdAt: string;
  dbCreatedAt: string;
  player1: ReplayPlayer;
  player2: ReplayPlayer;
}

interface SessionDetails {
  id: string;
  userId: string | null;
  isPublic: boolean;
  shareableId: string | null;
  createdAt: string;
  updatedAt: string;
  replayAnalysis: ReplayAnalysis[];
}

export default function ReplayAnalysisPage() {
  const params = useParams()
  const replayId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : ''
  const router = useRouter()

  // We need to fetch the session that contains this replay
  // In a real implementation, you might have a dedicated query for this
  // For now, we'll reuse the session details query and filter it
  const { data, loading, error } = useQuery(GET_SESSION_DETAILS, {
    variables: { id: replayId.split('-')[0] }, // Assuming the replay ID starts with session ID
    fetchPolicy: 'no-cache'
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !data?.sessionDetails?.replayAnalysis) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-black border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl font-bold text-white">Replay Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white">Sorry, we couldn&apos;t find this replay.</p>
            <Button 
              onClick={() => router.back()} 
              className="mt-4"
              variant="outline"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sessionDetails = data.sessionDetails as SessionDetails;

  // Find the specific replay
  const replayAnalysis = sessionDetails.replayAnalysis.find(
    (replay: ReplayAnalysis) => replay.id === replayId
  )

  if (!replayAnalysis) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-black border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl font-bold text-white">Replay Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white">This replay doesn&apos;t exist in the session.</p>
            <Button 
              onClick={() => router.back()} 
              className="mt-4"
              variant="outline"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Convert to the format expected by ReplaySessionAnalysis
  const replayResponse: ReplayResponse = {
    url: replayAnalysis.replayUrl,
    player1: {
      dbName: replayAnalysis.player1.dbName,
      rpsData: replayAnalysis.player1.rpsData,
      decks: replayAnalysis.player1.decks.map((deck: ReplayDeck) => ({
        ...deck,
        cards: deck.cards.map((card: ReplayCard) => ({
          ...card,
          ygoInfo: card.ygoInfo
        }))
      }))
    },
    player2: {
      dbName: replayAnalysis.player2.dbName,
      rpsData: replayAnalysis.player2.rpsData,
      decks: replayAnalysis.player2.decks.map((deck: ReplayDeck) => ({
        ...deck,
        cards: deck.cards.map((card: ReplayCard) => ({
          ...card,
          ygoInfo: card.ygoInfo
        }))
      }))
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="bg-black border-white/20 mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl md:text-3xl font-bold text-white">
              Replay Analysis
            </CardTitle>
            <p className="text-gray-400 mt-2">
              {replayAnalysis.player1.dbName} vs {replayAnalysis.player2.dbName}
            </p>
          </div>
          <Button 
            onClick={() => router.back()} 
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Replay Information</h3>
            <div className="space-y-2">
              <p className="text-gray-300">
                <span className="text-gray-500">ID:</span> {replayAnalysis.id}
              </p>
              <p className="text-gray-300">
                <span className="text-gray-500">URL:</span>{' '}
                <a 
                  href={replayAnalysis.replayUrl}
                  className="text-blue-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {replayAnalysis.replayUrl}
                </a>
              </p>
              <p className="text-gray-300">
                <span className="text-gray-500">Winner:</span>{' '}
                {replayAnalysis.player1.rpsData?.find(data => data.won)?.playerId 
                  ? replayAnalysis.player1.dbName 
                  : replayAnalysis.player2.rpsData?.find(data => data.won)?.playerId 
                    ? replayAnalysis.player2.dbName 
                    : 'Unknown'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ReplaySessionAnalysis 
        replayResponse={[replayResponse]} 
        sessionId={replayId.split('-')[0]}
      />
    </div>
  )
} 