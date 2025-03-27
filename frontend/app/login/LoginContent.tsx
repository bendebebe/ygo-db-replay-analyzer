"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth/context"

export function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const [error, setError] = useState("")
  const auth = useAuth()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      await auth.login(
        formData.get('email') as string,
        formData.get('password') as string
      )

      router.push('/replay-recorder')
      
    } catch (err) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError(err.message as string)
      } else {
        setError("An unexpected error occurred")
      }
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md rounded-xl">
        <CardHeader className="relative rounded-t-xl">
          {message && (
            <div className="mb-4 text-sm text-blue-600 text-center">
              {message}
            </div>
          )}
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
                <DropdownMenuItem asChild>
                  <Link href="/signup" className="w-full">
                    Create Account
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <Button type="submit">Sign In</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 