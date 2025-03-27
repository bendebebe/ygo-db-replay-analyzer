import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "./button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface AppCardProps {
  title: string
  children: React.ReactNode
  className?: string
  contentClassName?: string
  collapsible?: boolean
  description?: string
}

export function AppCard({ title, children, className, contentClassName, collapsible=false, description }: AppCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(true)
  
  return (
    <Card className={cn("app-card", className)}>
      {collapsible ? (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full flex justify-between items-center py-8 px-6 hover:bg-white/5 rounded-none min-h-[100px] border-b border-white/10"
            >
              <div className="flex flex-col items-start gap-2">
                <CardTitle className="app-title">{title}</CardTitle>
                {description && <p className="app-description">
                  {description}
                </p>}
              </div>
              {isExpanded ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className={cn(contentClassName)}>{children}</CardContent>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <>
          <CardHeader className="app-card-header border-b border-white/10">
            <CardTitle className="app-title">{title}</CardTitle>
            {description && <p className="app-description">{description}</p>}
          </CardHeader>
          <CardContent className={cn(contentClassName)}>{children}</CardContent>
        </>
      )}
    </Card>
  )
}

