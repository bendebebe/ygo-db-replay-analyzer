"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth/context"

export default function LogoutPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const { logout, isAuthenticated } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch {
      setError("Failed to logout. Please try again.")
    }
  }

  const handleCancel = () => {
    router.back()
  }

  // If user is already logged out, redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md rounded-xl">
        <CardHeader className="relative rounded-t-xl">
          <div className="absolute right-4 top-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/" className="w-full">
                    Home
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Logout</CardTitle>
          <CardDescription className="text-center">
            Are you sure you want to logout?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <div className="flex gap-4 justify-center">
              <Button onClick={handleLogout} variant="destructive">
                Logout
              </Button>
              <Button onClick={handleCancel} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 