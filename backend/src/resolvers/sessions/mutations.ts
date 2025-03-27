import { Context } from "../../context"
import { prisma } from "../../lib/prisma"
import { v4 as uuidv4 } from 'uuid'
import { SessionUpdateArgs } from "./types"

export const deleteSession = async (_: any, { id }: { id: string }) => {
    return prisma.session.delete({ where: { id } })
}

export const updateSession = async (_: any, { id, isPublic }: SessionUpdateArgs, context: Context) => {
    // Check if user owns the session
    const session = await prisma.session.findUnique({ where: { id } })
    if (!session) {
        throw new Error('Session not found')
    }
    
    if (session.userId !== context.user?.id) {
        throw new Error('Not authorized to update this session')
    }

    return prisma.session.update({
        where: { id },
        data: {
            isPublic,
            // Generate shareableId if making public, remove if making private
            shareableId: isPublic ? uuidv4() : null
        },
        include: {
            user: true,
            replays: {
                include: {
                    player1: true,
                    player2: true,
                }
            }
        }
    })
}
