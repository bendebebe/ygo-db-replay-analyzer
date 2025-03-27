import { Context } from '../../context';
import { prisma } from '../../lib/prisma';
import { transformDeckToCardWithCopies } from '../../utils/transformers';
import { CreateDeckInput, UpdateDeckInput } from './types';

export const createDeck = async (_parent: any, { input }: { input: CreateDeckInput }, context: Context) => {
  const { name, gameNumber, replayId, cardIds, playerId } = input;
  
  const replay = await prisma.replay.findFirst({
    where: {
      id: replayId,
      userId: context.user?.id,
      deletedAt: null
    }
  });
  
  if (!replay) {
    throw new Error('Replay not found or unauthorized');
  }

  const existingDeck = await prisma.deck.findFirst({
    where: {
      replayId,
      gameNumber,
      userId: context.user?.id,
      deletedAt: null
    }
  });

  if (existingDeck) {
    throw new Error(`A deck already exists for game ${gameNumber}`);
  }

  const createdDeck = await prisma.deck.create({
    data: {
      name,
      playerId,
      gameNumber,
      replayId,
      userId: context.user!.id,
      cards: {
        connect: cardIds.map(id => ({ id }))
      }
    },
    include: {
      cards: {
        include: {
          card: true
        }
      }
    }
  });
  
  return {
    ...createdDeck,
    cards: transformDeckToCardWithCopies(createdDeck.cards)
  };
};

export const deleteDeck = async (_: any, { id }: { id: string }) => {
    return prisma.deck.delete({ where: { id } })
}

export const updateDeck = async (_parent: any, { input }: { input: UpdateDeckInput }, context: Context) => {
  const { id, name, gameNumber, cardIds } = input;

  const deck = await prisma.deck.findFirst({
    where: {
      id,
      userId: context.user?.id,
      deletedAt: null
    }
  });

  if (!deck) {
    throw new Error('Deck not found or unauthorized');
  }

  if (gameNumber && gameNumber !== deck.gameNumber) {
    const existingDeck = await prisma.deck.findFirst({
      where: {
        replayId: deck.replayId,
        gameNumber,
        userId: context.user?.id,
        deletedAt: null,
        NOT: {
          id: deck.id
        }
      }
    });

    if (existingDeck) {
      throw new Error(`A deck already exists for game ${gameNumber}`);
    }
  }

  const updatedDeck = await prisma.deck.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(gameNumber && { gameNumber }),
      ...(cardIds && {
        cards: {
          set: cardIds.map(id => ({ id }))
        }
      })
    },
    include: {
      cards: {
        include: {
          card: true
        }
      }
    }
  });
  
  return {
    ...updatedDeck,
    cards: transformDeckToCardWithCopies(updatedDeck.cards)
  };
};