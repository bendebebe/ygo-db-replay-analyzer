import { prisma } from "../../lib/prisma"
import { Context } from "../../contexts/context"

export const createOrUpdatePlayer = async (_: any, { 
  playerId, 
  dbName 
}: { 
  playerId: string, 
  dbName: string 
}) => {
  return prisma.player.upsert({
    where: { playerId },
    create: {
      playerId,
      dbName
    },
    update: {
      dbName,
      deletedAt: null // Undelete if it was deleted
    },
    include: {
      replays1: true,
      replays2: true,
      wonReplays: true,
      rpsChoices: true
    }
  })
} 