"use client"

import React, { useState } from 'react'
import { useQuery } from '@apollo/client'
import { GET_SESSION_DETAILS } from '@/lib/graphql/queries/sessions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ReplaySessionAnalysis } from '@/components/ReplaySessionAnalysis'
import { ReplayResponse } from '@/lib/graphql/types/replays'
import { YgoCardInfo } from '@/lib/graphql/types/cards'

// Define interfaces for our optimized session data
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
  rpsData: RpsData | null;
  decks: ReplayDeck[];
}

interface ReplayAnalysis {
  id: string;
  replayUrl: string;
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

export default function SessionDetail() {
  // Use the useParams hook to get the id parameter
  const params = useParams();
  const sessionId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  const { data, loading, error } = useQuery(GET_SESSION_DETAILS, {
    variables: { id: sessionId },
    fetchPolicy: 'no-cache'
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !data?.sessionDetails) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-black border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl font-bold text-white">Session Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white">Sorry, we couldn&apos;t find this session.</p>
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

  const session: SessionDetails = data.sessionDetails
  const { replayAnalysis } = session
  
  // Format date correctly - handles ISO strings, Unix timestamps in seconds or milliseconds
  let formattedDate = "Invalid date"
  
  if (session.createdAt) {
    const timestamp = Number(session.createdAt);
    const date = !isNaN(timestamp) 
      ? new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp) 
      : new Date(session.createdAt);
      
    if (!isNaN(date.getTime())) {
      formattedDate = date.toLocaleString();
    }
  }

  // Map the replay analysis data to the format expected by ReplaySessionAnalysis
  const replayResponses: ReplayResponse[] = replayAnalysis.map((replay: ReplayAnalysis) => {
    const response = {
      url: replay.replayUrl,
      player1: {
        dbName: replay.player1.dbName,
        rpsData: {
          playerId: replay.player1.id,
          choice: replay.player1.rpsData?.choice || '',
          won: replay.player1.rpsData?.won || false
        },
        decks: replay.player1.decks.map(deck => ({
          ...deck,
          cards: deck.cards.map(card => ({
            ...card,
            ygoInfo: card.ygoInfo!
          }))
        }))
      },
      player2: {
        dbName: replay.player2.dbName,
        rpsData: {
          playerId: replay.player2.id,
          choice: replay.player2.rpsData?.choice || '',
          won: replay.player2.rpsData?.won || false
        },
        decks: replay.player2.decks.map(deck => ({
          ...deck,
          cards: deck.cards.map(card => ({
            ...card,
            ygoInfo: card.ygoInfo!
          }))
        }))
      }
    }
    return response
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="bg-black border-white/20 mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl md:text-3xl font-bold text-white">
              Session Details
            </CardTitle>
            <p className="text-gray-400 mt-2">Created: {formattedDate}</p>
          </div>
          <Button 
            onClick={() => router.back()} 
            variant="outline"
            size="sm"
          >
            Back to Sessions
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Session Info</h3>
              <div className="space-y-2">
                <p className="text-gray-300">
                  <span className="text-gray-500">ID:</span> {session.id}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-500">Public:</span> {session.isPublic ? 'Yes' : 'No'}
                </p>
                {session.shareableId && (
                  <p className="text-gray-300">
                    <span className="text-gray-500">Shareable Link:</span>{' '}
                    <a 
                      href={`${process.env.NEXT_PUBLIC_BASE_URL}/sessions/${session.shareableId}`}
                      className="text-blue-400 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Shareable Session
                    </a>
                  </p>
                )}
              </div>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Replay Statistics</h3>
              <div className="space-y-2">
                <p className="text-gray-300">
                  <span className="text-gray-500">Total Replays:</span> {replayAnalysis.length}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-500">Players:</span>{' '}
                  {Array.from(new Set(replayAnalysis.flatMap(r => [r.player1.dbName, r.player2.dbName]))).join(', ')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full mb-6">
          <TabsTrigger value="overview">Replay Overview</TabsTrigger>
          <TabsTrigger value="analysis">Replay Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card className="bg-black border-white/20">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">Replays</CardTitle>
            </CardHeader>
            <CardContent>
              {replayAnalysis.length > 0 ? (
                <div className="divide-y divide-gray-800">
                  {replayAnalysis.map(replay => (
                    <div key={replay.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-col md:flex-row gap-4 justify-between">
                        <div>
                          <h3 className="font-semibold text-white">
                            {replay.player1.dbName} vs {replay.player2.dbName}
                          </h3>
                          <a
                            href={replay.replayUrl}
                            className="text-blue-400 hover:underline text-sm"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {replay.replayUrl}
                          </a>
                        </div>
                        <div className="text-right">
                          <span className="bg-green-900 text-green-300 text-sm py-1 px-2 rounded">
                            Winner: {
                              (replay.player1.rpsData && replay.player1.rpsData.won) 
                                ? replay.player1.dbName 
                                : replay.player2.dbName
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No replays found for this session.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analysis" className="space-y-4">
          {replayResponses.length > 0 ? (
            <ReplaySessionAnalysis 
              replayResponse={replayResponses}
              sessionId={sessionId}
              isExpanded={true}
            />
          ) : (
            <Card className="bg-black border-white/20">
              <CardContent className="p-6">
                <p className="text-gray-400">No replay data available for analysis.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 