import { bullQueueService } from '../../services/bullQueueService'
import { prisma } from '../../lib/prisma'
import { ReplayPaginationArgs } from './types'

export const replays = async (_: any, { skip = 0, take = 10, sortBy = 'createdAt', sortOrder = 'desc' }: ReplayPaginationArgs) => {
    const [nodes, totalCount] = await Promise.all([
      prisma.replay.findMany({
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          player1: {
            include: {
              rpsChoices: true,
              decks: {
                include: {
                  cards: true
                }
              }
            }
          },
          player2: {
            include: {
              rpsChoices: true,
              decks: {
                include: {
                  cards: true
                }
              }
            }
          }
        }
      }),
      prisma.replay.count()
    ])
    return { nodes, totalCount }
  }

  export const replay = async (_: any, { id }: { id: string }) => {
    return prisma.replay.findUnique({ 
      where: { id }, 
      include: {
        decks: {
          include: {
            cards: {
              include: {
                card: true
              }
            }
          }
        } 
      }
    })
  }

export const replayUser = (parent: { userId: string }) => 
  prisma.user.findUnique({ where: { id: parent.userId } })

export const replaySession = (parent: { sessionId: string }) => 
  prisma.session.findUnique({ where: { id: parent.sessionId } })

export const replayDecks = (parent: { id: string }) => 
  prisma.deck.findMany({ 
    where: {
        replayId: parent.id,
      },
      orderBy: {
        gameNumber: 'asc'
      },
      include: {
        cards: {
          include: {
            card: true
          }
        }
      }
    })
  
export const replayRpsChoices = (parent: { id: string }) =>
    prisma.rpsChoice.findMany({
      where: { replayId: parent.id },
      include: { player: true }
    })


export const getJobStatus = async (_: any, { id }: { id: string }) => {
  return await bullQueueService.getJobStatus(id);
};

export const getJobsStatus = async (_: any, { ids }: { ids: string[] }) => {
  return await bullQueueService.getJobsStatus(ids);
};

export const getQueueStats = async () => {
  return await bullQueueService.getQueueStats();
};



