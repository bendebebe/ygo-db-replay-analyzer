"use client"

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function PlayerPage() {
  const params = useParams()
  const playerId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : ''
  const router = useRouter()

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="bg-black border-white/20 mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl md:text-3xl font-bold text-white">
              Player Profile
            </CardTitle>
            <p className="text-gray-400 mt-2">Player ID: {playerId}</p>
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
          <div className="bg-gray-900 p-6 rounded-lg text-center">
            <p className="text-white text-lg mb-4">Player profile page coming soon!</p>
            <p className="text-gray-400">
              This page will show player statistics, deck history, and match records.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 