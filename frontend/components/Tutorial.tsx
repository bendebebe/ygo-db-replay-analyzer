"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TutorialStep {
  title: string
  image: string
  description: string
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Step 1: Find Your Replay",
    image: "/placeholder1.jpg",
    description: "Open your Dueling Book replay in a new tab. You can find your replays in your profile section.",
  },
  {
    title: "Step 2: Create New Deck",
    image: "/placeholder2.jpg",
    description: "Click the 'Create New Deck' button in the menu to start analyzing a new opponent's deck.",
  },
]

export function Tutorial(): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [openSteps, setOpenSteps] = useState<Record<number, boolean>>({})

  const toggleStep = (index: number) => {
    setOpenSteps(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  return (
    <Card className="mt-4 bg-black border-white/20 rounded-xl overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex justify-between items-center py-8 px-6 hover:bg-white/5 rounded-none min-h-[100px]"
          >
            <div className="flex flex-col items-start gap-2">
              <CardTitle className="text-3xl text-white text-left">Tutorial</CardTitle>
              <p className="text-gray-400 text-left text-sm">
                Click to learn how to use the replay analyzer
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
          <CardContent className="p-0">
            {tutorialSteps.map((step, index) => (
              <Collapsible
                key={index}
                open={openSteps[index]}
                onOpenChange={() => toggleStep(index)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full flex justify-between items-center py-6 px-6 hover:bg-white/5 rounded-none border-t border-white/20"
                  >
                    <h3 className="text-xl text-white text-left font-semibold">
                      {step.title}
                    </h3>
                    {openSteps[index] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-6 py-4 border-t border-white/20 bg-white/5">
                    <div className="flex justify-center">
                      <div className="relative w-[600px] h-[400px]">
                        <Image
                          src={step.image}
                          alt={`Tutorial step ${index + 1}`}
                          fill
                          className="object-contain rounded-xl border border-white/20"
                        />
                      </div>
                    </div>
                    <p className="text-gray-300 text-left mt-4">
                      {step.description}
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
} 