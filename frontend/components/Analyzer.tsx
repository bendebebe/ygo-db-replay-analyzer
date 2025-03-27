"use client"

import * as React from "react"
import { CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/contexts/auth/context"
import { useEffect, useState } from "react"
import { URLInput } from './URLInput'
import { useReplay } from "@/lib/contexts/replay/context"
import { AppCard } from "@/components/ui/app-card"
import Link from "next/link"

interface AnalyzerProps {
  isExpanded: boolean
  onToggleExpand?: (expanded: boolean) => void
  initialUrl?: string | null
}

export function Analyzer({
  isExpanded,
  onToggleExpand,
  initialUrl
}: AnalyzerProps) {
  const { isAuthenticated, isLoadingAuth } = useAuth()
  const { submitReplayJobs, loading, error } = useReplay()
  const [isOpen, setIsOpen] = React.useState<boolean>(isExpanded)
  const [manualUrls, setManualUrls] = useState<string[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)

  const handleSave = React.useCallback(() => {
    // Add save logic here
    console.log("Saving session...")
    // TODO: Send API request to database with all the session data
    // API should analyze the data and return a deck list and analysis of the replays

    // TODO: Save the deck list and analysis to the database if the user is logged in and clicks the save session button
  }, [])

  const analyzeSession = React.useCallback(async () => {    
    if (manualUrls.length > 0) {
      try {
        console.log("Submitting replay jobs...");
        const newSessionId = await submitReplayJobs(manualUrls);
        console.log("Jobs submitted, session ID:", newSessionId);
        
        // Set the session ID to display the link
        setSessionId(newSessionId);
        
        // We'll just show a link to the session page
        setIsOpen(false);
      } catch (error) {
        console.error('Error submitting replay jobs:', error);
      }
    }
  }, [submitReplayJobs, manualUrls]);

  useEffect(() => {
    setIsOpen(isExpanded)
  }, [isExpanded])

  // Optional: Notify parent of changes
  useEffect(() => {
    onToggleExpand?.(isOpen)
  }, [isOpen, onToggleExpand])

  // Set initial URL if provided
  useEffect(() => {
    if (initialUrl) {
      setManualUrls([initialUrl])
    }
  }, [initialUrl])

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">
            Processing replays... This may take a few moments
          </p>
        </div>
      );
    }

    if (error) {
      return <div>Error: {error.message}</div>;
    }

    if (sessionId) {
      return (
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col items-center justify-center p-4 space-y-4">
            <p className="text-center text-lg">
              Replay analysis jobs submitted successfully!
            </p>
            <Link href={`/sessions/${sessionId}`}>
              <Button 
                variant="default" 
                className="px-8 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 transition-colors"
              >
                View Analysis Session
              </Button>
            </Link>
          </div>
        </CardContent>
      );
    }

    return (
      <CardContent className="p-6 space-y-6">
        <URLInput 
          onUrlsChangeAction={setManualUrls} 
          initialUrls={initialUrl ? [initialUrl] : []}
        />
        <div className="pt-4 border-t border-white/20">
          <div className="flex items-center gap-6">
            {isAuthenticated && !isLoadingAuth ? (
              <div className="flex gap-2 min-w-[300px]">
                <Button
                  onClick={analyzeSession}
                  variant="ghost"
                  disabled={manualUrls.length === 0}
                  className="flex-1 border border-white/20 hover:bg-white/5 disabled:opacity-50"
                >
                  Analyze Session
                </Button>
                <Button
                  onClick={handleSave}
                  variant="ghost"
                  disabled={manualUrls.length === 0}
                  className="flex-1 border border-white/20 hover:bg-white/5 disabled:opacity-50"
                >
                  Save Session
                </Button>
              </div>
            ) : (
              <Button
                onClick={analyzeSession}
                variant="ghost"
                disabled={manualUrls.length === 0}
                className={cn(
                  "min-w-[300px]",
                  "border border-white/20 hover:bg-white/5 disabled:opacity-50"
                )}
              >
                Analyze Session
              </Button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold leading-none">{manualUrls.length}</span>
              <span className="text-gray-400 text-lg leading-none">
                {manualUrls.length === 1 ? 'URL' : 'URLs'} entered
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    );
  };

  return (
    <AppCard
      title="Analyzer"
      description="Start a new replay recording session"
      className="mt-4 rounded-xl overflow-hidden"
      collapsible={true}
    >
      {renderContent()}
    </AppCard>
  );
} 