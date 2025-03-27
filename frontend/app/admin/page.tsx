"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { AdminDashboard } from "@/components/admin/AdminDashboard"

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="bg-black border-white/20">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminDashboard />
        </CardContent>
      </Card>
    </div>
  )
} 