import type React from "react"
import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return <div className={cn("container mx-auto px-4 py-8 max-w-4xl", className)}>{children}</div>
}

