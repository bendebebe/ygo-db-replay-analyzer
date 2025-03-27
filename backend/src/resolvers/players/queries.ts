import { prisma } from "../../lib/prisma"

export const player = async (_: any, { id }: { id: string }) => {
  return prisma.player.findUnique({ 
    where: { id },
    include: {
      replays1: true,
      replays2: true,
      wonReplays: true,
      rpsChoices: true
    }
  })
}

export const playerByPlayerId = async (_: any, { playerId }: { playerId: string }) => {
  const player = await prisma.player.findUnique({ 
    where: { 
      playerId,
      deletedAt: null
    },
    include: {
      replays1: true,
      replays2: true,
      wonReplays: true,
      rpsChoices: true,
      decks: true
    }
  });
  return player
}

export const searchPlayers = async (_: any, { dbName, skip, take }: { dbName: string, skip: number, take: number }) => {
  const [players, totalCount] = await Promise.all([
    prisma.player.findMany({
      where: {
        dbName: {
          contains: dbName,
          mode: 'insensitive'
        },
        deletedAt: null
      },
      skip,
      take,
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        replays1: true,
        replays2: true,
        wonReplays: true,
        rpsChoices: true,
        decks: true
      }
    }),
    prisma.player.count({
      where: {
        dbName: {
          contains: dbName,
          mode: 'insensitive'
        },
        deletedAt: null
      }
    })
  ])

  return {
    players,
    totalCount
  }
} 