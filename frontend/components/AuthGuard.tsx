"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/contexts/auth/context"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoadingAuth, isInitialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if we've completed the initial auth check
    if (isInitialized && !isLoadingAuth && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoadingAuth, router, isInitialized])

  // Don't render anything until we've completed the initial auth check
  if (!isInitialized) {
    return null
  }

  return isAuthenticated ? children : null
} 