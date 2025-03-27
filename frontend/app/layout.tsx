'use client'

import "./globals.css"
import { Inter } from "next/font/google"
import { ApolloWrapper } from "@/lib/apollo/ApolloWrapper"
import { Providers } from '@/lib/providers'
import { Sidebar } from "@/components/Sidebar"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-foreground min-h-screen`}>
        <ApolloWrapper>
          <Providers>
            <Sidebar />
            {children}
          </Providers>
        </ApolloWrapper>
      </body>
    </html>
  )
}

