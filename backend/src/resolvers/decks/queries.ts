import { prisma } from "../../lib/prisma"
import { PaginationArgs } from "../types"
import { Context } from '../../context';
import { transformDeckToCardWithCopies } from '../../utils/transformers';

export const decks = async (_: any, { skip = 0, take = 50 }: PaginationArgs) => {
  const decksWithCards = await prisma.deck.findMany({
    skip,
    take,
    orderBy: { createdAt: 'desc' },
    include: {
      cards: {
        include: {
          card: true
        }
      }
    }
  });
  
  // Transform the data to use CardWithCopies format
  return decksWithCards.map(deck => ({
    ...deck,
    cards: transformDeckToCardWithCopies(deck.cards)
  }));
}

export const deck = (parent: { id: string }) => 
  prisma.deck.findUnique({ where: { id: parent.id }, include: {
    cards: {
      include: {
        card: true
      }
    }
  } })

export const deckUser = (parent: { userId: string }) => 
  prisma.user.findUnique({ where: { id: parent.userId } })

export const deckReplays = (parent: { id: string }) => 
  prisma.replay.findMany({ where: { decks: { some: { id: parent.id } } } })

export const decksByReplay = async (_parent: any, { replayId }: { replayId: string }, _context: Context) => {
  const decks = await prisma.deck.findMany({
    where: {
      replay: {
        id: replayId
      },
      deletedAt: null
    },
    include: {
      replay: true,
      cards: {
        include: {
          card: true
        }
      }
    },
    orderBy: {
      gameNumber: 'asc'
    }
  });
  
  // Transform the data to use CardWithCopies format
  return decks.map(deck => ({
    ...deck,
    cards: transformDeckToCardWithCopies(deck.cards)
  }));
};

export const decksByPlayer = async (_parent: any, { playerId }: { playerId: string }) => {
  const derivedPlayerId = playerId || _parent.playerId;
  const decks = await prisma.deck.findMany({
    where: {
      playerId: derivedPlayerId
    },
    include: {
      replay: true,
      cards: {
        include: {
          card: true
        }
      }
    }
  });
  
  // Transform the data to use CardWithCopies format
  return decks.map(deck => ({
    ...deck,
    cards: transformDeckToCardWithCopies(deck.cards)
  }));
};