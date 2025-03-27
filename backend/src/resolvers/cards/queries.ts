import { prisma }from "../../lib/prisma"
import { fetchYGOCardInfo } from '../../services/ygoCardService'
import { CardsQueryArgs } from "./types"

export const cards = async (_parent: any, { serialNumbers, skip = 0, take = 50 }: CardsQueryArgs) => {
    const where = {
        deletedAt: null,
        ...(serialNumbers && {
            serialNumber: {
                in: serialNumbers
            }
        })
    }

    const [nodes, totalCount] = await Promise.all([
        prisma.card.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.card.count({ where })
    ])

    // Fetch YGO info for all cards
    const ygoInfo = await fetchYGOCardInfo(nodes.map(node => node.serialNumber))
    const cardsWithYGOInfo = nodes.map(card => ({
        ...card,
        ygoInfo: ygoInfo[card.serialNumber] || null
    }))

    return { nodes: cardsWithYGOInfo, totalCount }
}

export const card = async (_: any, { id }: { id: string }) => {
    return prisma.card.findUnique({ where: { id } })
}


