"use client"

import * as React from "react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TestReplayData {
  type: 'REPLAY_DATA'
  number: number
  letter: string
}

export function AnalyzerTest(): React.ReactElement {
  const [isOpen, setIsOpen] = React.useState<boolean>(false)

  const sendTestData = React.useCallback(() => {
    const testData: TestReplayData = {
      type: 'REPLAY_DATA',
      number: Math.floor(Math.random() * 100),
      letter: String.fromCharCode(65 + Math.floor(Math.random() * 26))
    }

    // Simulate extension sending message
    window.postMessage(testData, '*')
    console.log('Sent test data:', testData)
  }, [])

  return (
    <Card className="mt-4 bg-black border-white/20 rounded-xl overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex justify-between items-center py-8 px-6 hover:bg-white/5 rounded-none min-h-[100px]"
          >
            <div className="flex flex-col items-start gap-2">
              <CardTitle className="text-3xl text-white text-left">Test Tools</CardTitle>
              <p className="text-gray-400 text-left text-sm">
                Simulate extension behavior
              </p>
            </div>
            {isOpen ? (
              <ChevronUp className="h-6 w-6" />
            ) : (
              <ChevronDown className="h-6 w-6" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-6 space-y-6">
            <Button
              onClick={sendTestData}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Send Test Data
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
} 