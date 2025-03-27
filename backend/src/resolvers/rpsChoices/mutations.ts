import { prisma } from "../../lib/prisma"

export const createRpsChoice = async (_: any, { 
  playerId,
  replayId,
  choice,
  won
}: { 
  playerId: string,
  replayId: string,
  choice: string,
  won: boolean
}) => {
  return prisma.rpsChoice.create({
    data: {
      playerId,
      replayId,
      choice,
      won
    },
    include: {
      player: true,
      replay: true
    }
  })
} 