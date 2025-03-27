import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AppCardProps {
  title: string
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

export function AppCard({ title, children, className, contentClassName }: AppCardProps) {
  return (
    <Card className={cn("app-card", className)}>
      <CardHeader className="app-card-header">
        <CardTitle className="app-title">{title}</CardTitle>
      </CardHeader>
      <CardContent className={cn(contentClassName)}>{children}</CardContent>
    </Card>
  )
}

