"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ChevronDown, ChevronRight, MoreVertical } from "lucide-react"
import { AdminReplay, AdminSession, AdminPlayer, AdminDeck } from '@/lib/types/admin'

export interface Column {
  key: string
  label: string
  sortable?: boolean
}

export type AdminTableData = AdminReplay | AdminSession | AdminPlayer | AdminDeck

interface AdminTableProps {
  columns: Column[]
  data: AdminTableData[]
  expandableContent?: (item: AdminTableData) => React.ReactNode
  onDelete?: (id: string) => Promise<void>
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (column: string) => void
  page: number
  pageSize: number
  totalCount: number
  onPageChangeAction: (page: number) => void,
  onRowClickAction?: (item: AdminTableData) => void
}

export function AdminTable({
  columns,
  data,
  expandableContent,
  onDelete,
  sortColumn,
  sortDirection,
  onSort,
  page,
  pageSize,
  totalCount,
  onPageChangeAction,
  onRowClickAction
}: AdminTableProps) {
  const [expandedRows, setExpandedRows] = React.useState<string[]>([])
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    )
  }

  const handleDelete = async () => {
    if (itemToDelete && onDelete) {
      await onDelete(itemToDelete)
      setItemToDelete(null)
    }
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            {expandableContent && <TableHead className="w-[50px]" />}
            {columns.map((column) => (
              <TableHead 
                key={column.key}
                className={column.sortable ? "cursor-pointer" : ""}
                onClick={() => column.sortable && onSort?.(column.key)}
              >
                {column.label}
                {column.sortable && sortColumn === column.key && (
                  <span className="ml-2">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </TableHead>
            ))}
            {onDelete && <TableHead className="w-[50px]" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <React.Fragment key={item.id}>
              <TableRow onClick={() => onRowClickAction?.(item)}>
                {expandableContent && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(item.id)}
                    >
                      {expandedRows.includes(item.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell key={column.key}>{item[column.key as keyof AdminTableData]}</TableCell>
                ))}
                {onDelete && (
                  <TableCell>
                    <AlertDialog open={itemToDelete === item.id} onOpenChange={(open) => !open && setItemToDelete(null)}>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setItemToDelete(item.id)}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this item and remove it from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                )}
              </TableRow>
              {expandableContent && expandedRows.includes(item.id) && (
                <TableRow>
                  <TableCell colSpan={columns.length + (onDelete ? 2 : 1)}>
                    {expandableContent(item)}
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Showing {Math.min((page - 1) * pageSize + 1, totalCount)} to{" "}
          {Math.min(page * pageSize, totalCount)} of {totalCount} results
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChangeAction(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChangeAction(page + 1)}
            disabled={page * pageSize >= totalCount}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
} 