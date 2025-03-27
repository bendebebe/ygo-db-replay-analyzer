"use client"

import { PlayerSearch } from "@/components/PlayerSearch"
import { Analyzer } from "@/components/Analyzer"
import { useSearchParams } from "next/navigation"
import { useReplay } from "@/lib/contexts/replay/context"
import { AppCard } from "@/components/ui/app-card"
import { PageContainer } from "@/components/ui/page-container"
import React, { useEffect } from "react"

export default function ReplayRecorder() {
  const [isAnalyzerExpanded, setIsAnalyzerExpanded] = React.useState(true)
  const [initialUrl, setInitialUrl] = React.useState<string | null>(null)
  const searchParams = useSearchParams()
  const { submitReplayJobs } = useReplay()
  
  // Check if URL parameter is present and trigger analysis
  useEffect(() => {
    const url = searchParams.get('url')
    if (url) {
      setInitialUrl(url)
      
      // Auto-analyze if URL is provided
      const analyzeUrlFromParam = async () => {
        try {
          // Submit the job and get the session ID
          const sessionId = await submitReplayJobs([url])
          if (sessionId) {
            // Redirect to the session page
            window.location.href = `/sessions/${sessionId}`
          }
        } catch (error) {
          console.error('Error submitting replay job:', error)
        }
      }
      
      analyzeUrlFromParam()
    }
  }, [searchParams, submitReplayJobs])

  return (
    <PageContainer>
      <AppCard title="Yu-Gi-Oh! FYI Replay Analyzer">
        <p className="text-gray-300 mt-4 max-w-2xl text-left">
          This tool allows you to aggregate replays and get an approximation
          of what cards an opponent is running in their main deck, side deck, and extra deck.
          You may choose to login, or you can do a temporary session.
        </p>
      </AppCard>

      <PlayerSearch />
      <Analyzer 
        isExpanded={isAnalyzerExpanded && !initialUrl}
        onToggleExpand={setIsAnalyzerExpanded}
        initialUrl={initialUrl}
      />
    </PageContainer>
  )
} 