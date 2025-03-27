"use client"

import React from 'react'
import { AuthProvider } from '@/lib/contexts/auth/provider'
import { PlayerProvider } from '@/lib/contexts/player/provider'
import { ReplayProvider } from '@/lib/contexts/replay/provider'
import { SessionProvider } from '@/lib/contexts/session/provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PlayerProvider>
        <ReplayProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ReplayProvider>
      </PlayerProvider>
    </AuthProvider>
  )
} 