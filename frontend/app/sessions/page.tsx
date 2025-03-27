"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Replay } from "@/lib/contexts/replay/types"
import { useSession } from "@/lib/contexts/session/context"
import { Session } from "@/lib/contexts/session"
import { useLazyQuery } from "@apollo/client"
import { GET_SESSION } from "@/lib/graphql/queries/sessions"

export default function Sessions() {
  const [expandedSessions, setExpandedSessions] = useState<string[]>([])
  const [sessionReplays, setSessionReplays] = useState<Record<string, Replay[]>>({})
  const { sessions, loading, updateSession } = useSession()
  
  // Set up the query outside the callback
  const [fetchSession] = useLazyQuery(GET_SESSION)

  const toggleExpand = async (sessionId: string) => {
    const isExpanding = !expandedSessions.includes(sessionId)
    
    setExpandedSessions((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId],
    )
    
    // Only fetch replay data if we're expanding and haven't loaded it yet
    if (isExpanding && !sessionReplays[sessionId]) {
      try {
        // Fetch the session data with replays when expanded
        const { data } = await fetchSession({ 
          variables: { id: sessionId },
          fetchPolicy: 'network-only'
        })
        
        if (data?.session?.replays) {
          setSessionReplays(prev => ({
            ...prev,
            [sessionId]: data.session.replays
          }))
        }
      } catch {
        toast.error("Failed to load session replays")
      }
    }
  }

  const togglePublic = async (session: Session) => {
    // call the updateSession mutation
    const result = await updateSession(session.id, !session.isPublic)
    if (!result) {
        session.isPublic = !session.isPublic
        toast.error("Session not found")
    } else {
        // copy session link to clipboard: {BASE_URL}/sessions/{session.shareableId}
        navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_BASE_URL}/sessions/${session.shareableId}`)
        toast.success("Session updated")
    }
  }

  const renderContent = () => {
    if (loading) {
        return (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        );
      }
      return (
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Public</TableHead>
                <TableHead>Replay Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session: Session) => (
                <>
                  <TableRow key={session.id} className="cursor-pointer" onClick={() => toggleExpand(session.id)}>
                    <TableCell>
                      {expandedSessions.includes(session.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell>{new Date(session.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Switch
                        checked={session.isPublic}
                        onCheckedChange={() => togglePublic(session)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell>{session.replayCount || session.replays?.length || 0}</TableCell>
                  </TableRow>
                  {expandedSessions.includes(session.id) && (
                    <>
                      <TableRow className="bg-gray-900">
                        <TableCell></TableCell>
                        <TableCell className="font-semibold">Replay URL</TableCell>
                        <TableCell className="font-semibold">Players</TableCell>
                        <TableCell className="font-semibold">Winner</TableCell>
                      </TableRow>
                      {sessionReplays[session.id] ? (
                        sessionReplays[session.id].map((replay: Replay) => (
                          <TableRow key={`${session.id}-${replay.id}`} className="bg-gray-800">
                            <TableCell></TableCell>
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
                            <TableCell>{replay.player1.rpsChoices[0].won ? replay.player1.dbName : replay.player2.dbName}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow className="bg-gray-800">
                          <TableCell colSpan={4} className="text-center">
                            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                            Loading replays...
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
      )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="bg-black border-white/20">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold text-white">Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  )
}

