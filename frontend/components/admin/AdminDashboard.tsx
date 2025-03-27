"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SessionsTab } from "./SessionsTab"
import { ReplaysTab } from "./ReplaysTab"
import { PlayersTab } from "./PlayersTab"
import { DecksTab } from "./DecksTab"

export function AdminDashboard() {
  const [activeTab, setActiveTab] = React.useState("sessions")

  return (
    <Tabs defaultValue="sessions" className="space-y-4" onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="sessions">Sessions</TabsTrigger>
        <TabsTrigger value="replays">Replays</TabsTrigger>
        <TabsTrigger value="players">Players</TabsTrigger>
        <TabsTrigger value="decks">Decks</TabsTrigger>
      </TabsList>

      <TabsContent value="sessions" className="space-y-4">
        <SessionsTab />
      </TabsContent>

      <TabsContent value="replays" className="space-y-4">
        <ReplaysTab />
      </TabsContent>

      <TabsContent value="players" className="space-y-4">
        <PlayersTab />
      </TabsContent>

      <TabsContent value="decks" className="space-y-4">
        <DecksTab />
      </TabsContent>
    </Tabs>
  )
} 