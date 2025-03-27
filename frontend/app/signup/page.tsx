"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from '@apollo/client'
import Link from "next/link"
import { REGISTER_MUTATION } from '@/lib/graphql/mutations/auth'
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

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [register] = useMutation(REGISTER_MUTATION)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      const { data } = await register({
        variables: {
          email: formData.get('email'),
          password: formData.get('password'),
          username: formData.get('username')
        }
      })

      if (data?.register) {
        router.push('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    }
  }

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
                <DropdownMenuItem asChild>
                  <Link href="/login" className="w-full">
                    Sign In
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Enter your details to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" type="text" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <Button type="submit">Create Account</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

