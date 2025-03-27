"use client"

import * as React from "react"
import { AdminTable, AdminTableData } from "./AdminTable"
import { useAdminSessions } from "@/lib/hooks/admin"
import { AdminSession } from '@/lib/types/admin'

const SESSIONS_PAGE_SIZE = 10

// Define the session type as it comes from the server
interface SessionFromServer {
  id: string
  createdAt: string
  isPublic: boolean
  replayCount?: number
  userId: string
  shareableId: string
}

export function SessionsTab() {
  const [page, setPage] = React.useState(1)
  const [sortColumn, setSortColumn] = React.useState<string>('createdAt')
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc')

  const { sessions, totalCount, deleteSession } = useAdminSessions({
    skip: (page - 1) * SESSIONS_PAGE_SIZE,
    take: SESSIONS_PAGE_SIZE,
    sortBy: sortColumn,
    sortOrder: sortDirection
  })

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSession(id)
    } catch (error) {
      console.error('Failed to delete session:', error)
      // TODO: Add error toast notification
    }
  }

  const handleRowClick = (item: AdminTableData) => {
    const session = item as AdminSession
    // Open the session detail page in a new tab
    window.open(`/sessions/${session.id}`, '_blank')
  }

  const columns = [
    { 
      key: 'createdAt', 
      label: 'Timestamp', 
      sortable: true,
    },
    { key: 'isPublic', label: 'Public' },
    { key: 'replayCount', label: 'Replay Count', sortable: true }
  ]

  const tableData: AdminSession[] = sessions?.map((session: SessionFromServer) => {
    // Parse the timestamp correctly - handles ISO strings, Unix timestamps in seconds or milliseconds
    let formattedDate = "Invalid date"
    
    if (session.createdAt) {
      const timestamp = Number(session.createdAt);
      const date = !isNaN(timestamp) 
        ? new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp) 
        : new Date(session.createdAt);
        
      if (!isNaN(date.getTime())) {
        formattedDate = date.toLocaleString();
      }
    }

    return {
      id: session.id,
      createdAt: formattedDate,
      isPublic: session.isPublic ? 'Yes' : 'No',
      replayCount: session.replayCount || 0,
      userId: session.userId || '',
      shareableId: session.shareableId || '',
      replays: [] 
    }
  }) || []

  return (
    <AdminTable
      columns={columns}
      data={tableData}
      expandableContent={undefined} // Remove expandable content
      onDelete={handleDelete}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={handleSort}
      page={page}
      pageSize={SESSIONS_PAGE_SIZE}
      totalCount={totalCount}
      onPageChangeAction={setPage}
      onRowClickAction={handleRowClick} // Add row click handler
    />
  )
} 