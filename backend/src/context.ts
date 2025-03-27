import { PrismaClient } from '@prisma/client'
import { Request } from 'express'

export interface Context {
  prisma: PrismaClient
  user?: {
    id: string
  }
  req: Request
} 