import { prisma }from "../../lib/prisma"
import { PaginationArgs } from "../types"
import { Context } from "./types"

export const users = async (_: any, { skip = 0, take = 50 }: PaginationArgs) => {
  const [nodes, totalCount] = await Promise.all([
    prisma.user.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count()
  ])
  return { nodes, totalCount }
}

export const user = async (_: any, { id }: { id: string }) => {
  return prisma.user.findUnique({ where: { id } })
}

export const userDecks = async (_: any, { userId, skip = 0, take = 50 }: { userId: string } & PaginationArgs) => {
  return prisma.deck.findMany({ 
    where: { userId }, 
    skip, 
    take, 
    orderBy: { createdAt: 'desc' } 
  });
}

export const userSessions = async (_: any, { userId, skip = 0, take = 50 }: { userId: string } & PaginationArgs) => {
  const [nodes, totalCount] = await Promise.all([
    prisma.session.findMany({ where: { userId }, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.session.count({ where: { userId } })
  ])
  return { nodes, totalCount }
}

export const checkAuth = async (_: any, __: any, context: Context) => {
  if (!context.userId) {
    return null
  }
  
  const user = await prisma.user.findUnique({
    where: { id: context.userId }
  })
  
  if (!user) {
    return null
  }
  
  return user
}