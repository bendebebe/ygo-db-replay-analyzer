import { PaginationArgs, SortableArgs } from "../types"

export interface SessionUpdateArgs {
    id: string
    isPublic: boolean
}

export interface SesssionsQueryArgs extends PaginationArgs, SortableArgs {
    userId: string
  }