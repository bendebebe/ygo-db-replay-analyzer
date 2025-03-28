import { prisma } from "../../lib/prisma"
import { SesssionsQueryArgs } from "./types"
import { fetchYGOCardInfo } from "../../services/ygoCardService"

export const sessions = async (_: any, args: SesssionsQueryArgs) => {
  const where = {
    userId: args.userId
  }

  const [nodes, totalCount] = await Promise.all([
    prisma.session.findMany({
      where,
      skip: args.skip,
      take: args.take,
      orderBy: { [args.sortBy || 'createdAt']: args.sortOrder || 'desc' },
      include: {
        user: true,
        _count: {
          select: {
            replays: true
          }
        }
      }
    }),
    prisma.session.count({ where })
  ])
  
  const transformedNodes = nodes.map(node => ({
    ...node,
    replayCount: node._count.replays,
    _count: undefined
  }))
  
  return { nodes: transformedNodes, totalCount }
}

export const session = async (_: any, { id }: { id: string }) => {
  return prisma.session.findUnique({
    where: { id },
    include: {
      user: true,
      replays: {
        include: {
          player1: {
            include: {
              rpsChoices: true
            }
          },
          player2: {
            include: {
              rpsChoices: true
            }
          },
          winner: true
        }
      }
    }
  })
}

export const sessionUser = (parent: { userId: string }) => 
  prisma.user.findUnique({ where: { id: parent.userId } })

export const sessionReplays = (parent: { id: string }) => 
  prisma.replay.findMany({ where: { sessionId: parent.id } })

export const sessionDetails = async (_: any, { id }: { id: string }) => {
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      user: true
    }
  });

  if (!session) {
    throw new Error('Session not found');
  }

  const replays = await prisma.replay.findMany({
    where: { sessionId: id },
    include: {
      player1: {
        include: {
          rpsChoices: {
            where: {
              replayId: { not: undefined }
            }
          },
        }
      },
      player2: {
        include: {
          rpsChoices: {
            where: {
              replayId: { not: undefined }
            }
          },
        }
      },
      decks: {
        include: {
          player: true,
          cards: {
            include: {
              card: true
            }
          }
        }
      }
    }
  });

  // Collect all unique card serial numbers
  const allCardSerialNumbers = new Set<string>();
  replays.forEach(replay => {
    replay.decks.forEach(deck => {
      deck.cards.forEach(cardEntry => {
        allCardSerialNumbers.add(cardEntry.card.serialNumber);
      });
    });
  });

  // Fetch YGO info for all cards
  const ygoInfoMap = await fetchYGOCardInfo(Array.from(allCardSerialNumbers));

  const transformedReplays = replays.map(replay => {
    const decksByPlayerId = new Map();
  
    
    replay.decks.forEach((deck: any) => {
      const playerId = deck.playerId;
      if (!decksByPlayerId.has(playerId)) {
        decksByPlayerId.set(playerId, []);
      }
      const cards = deck.cards.map((cardEntry: any) => ({
        serialNumber: cardEntry.card.serialNumber,
        name: cardEntry.card.name,
        imageUrl: cardEntry.card.imageUrl,
        copies: cardEntry.copiesOfCard,
        ygoInfo: ygoInfoMap[cardEntry.card.serialNumber] || null
      }));
      
      decksByPlayerId.get(playerId).push({
        ...deck,
        cards: cards
      });
    });

    // Get RPS choices for both players
    const player1RpsChoices = replay.player1.rpsChoices
      .filter(choice => choice.replayId === replay.id)
      .map(choice => ({
        playerId: choice.playerId,
        choice: choice.choice,
        won: choice.won
      }));
    
    const player2RpsChoices = replay.player2.rpsChoices
      .filter(choice => choice.replayId === replay.id)
      .map(choice => ({
        playerId: choice.playerId,
        choice: choice.choice,
        won: choice.won
      }));

    return {
      id: replay.id,
      replayUrl: replay.replayUrl,
      createdAt: replay.createdAt.toString(),
      dbCreatedAt: replay.createdAt,
      player1: {
        id: replay.player1.id,
        dbName: replay.player1.dbName,
        rpsData: player1RpsChoices.length > 0 ? player1RpsChoices : null,
        decks: decksByPlayerId.get(replay.player1.id) || []
      },
      player2: {
        id: replay.player2.id,
        dbName: replay.player2.dbName,
        rpsData: player2RpsChoices.length > 0 ? player2RpsChoices : null,
        decks: decksByPlayerId.get(replay.player2.id) || []
      }
    };
  });

  return {
    ...session,
    replayAnalysis: transformedReplays
  };
};

export const sessionByShareableId = async (_: any, { shareableId }: { shareableId: string }) => {
  const session = await prisma.session.findUnique({
    where: { shareableId },
    include: {
      user: true,
      replays: {
        include: {
          player1: true,
          player2: true,
          winner: true,
          rpsChoices: true,
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
      }
    }
  });

  if (!session || !session.isPublic) {
    throw new Error('Session not found');
  }

  return session;
};

export const playerDeck = async (_: any, { replayId, playerId, gameNumber }: { replayId: string, playerId: string, gameNumber: number }) => {
  console.log(`[PLAYER_DECK] Fetching deck for replay ${replayId}, player ${playerId}, game ${gameNumber}`);
  
  const deck = await prisma.deck.findFirst({
    where: {
      replayId,
      playerId,
      gameNumber
    },
    include: {
      cards: {
        include: {
          card: true
        }
      }
    }
  });

  if (!deck) {
    console.log(`[PLAYER_DECK] No deck found`);
    return null;
  }

  console.log(`[PLAYER_DECK] Found deck ${deck.id} with ${deck.cards.length} cards`);

  // Only fetch YGO info for the cards in this specific deck
  const cardSerialNumbers = deck.cards.map(c => c.card.serialNumber);
  const ygoInfoMap = await fetchYGOCardInfo(cardSerialNumbers);

  const transformedCards = deck.cards.map(cardEntry => ({
    serialNumber: cardEntry.card.serialNumber,
    name: cardEntry.card.name,
    imageUrl: cardEntry.card.imageUrl,
    copies: cardEntry.copiesOfCard,
    ygoInfo: ygoInfoMap[cardEntry.card.serialNumber] || null
  }));

  return {
    id: deck.id,
    name: deck.name,
    gameNumber: deck.gameNumber,
    cards: transformedCards
  };
};

export const sessionPlayerDecks = async (_: any, { sessionId, playerDbName }: { sessionId: string, playerDbName: string }) => {
  console.log('\n[SESSION_PLAYER_DECKS] ========== START ==========');
  console.log(`[SESSION_PLAYER_DECKS] Query params:`, { sessionId, playerDbName });

  try {
    if (!sessionId || !playerDbName) {
      console.error('[SESSION_PLAYER_DECKS] ❌ Missing required parameters');
      return []; 
    }

    console.log('[SESSION_PLAYER_DECKS] 🔍 Finding replays...');
    const replays = await prisma.replay.findMany({
      where: {
        sessionId,
        OR: [
          { player1: { dbName: playerDbName } },
          { player2: { dbName: playerDbName } }
        ]
      },
      include: {
        player1: {
          include: {
            rpsChoices: true,
          }
        },
        player2: {
          include: {
            rpsChoices: true,
          }
        },
        decks: {
          where: {
            player: {
              dbName: playerDbName
            }
          },
          include: {
            player: true,
            cards: {
              include: {
                card: true
              }
            }
          }
        }
      }
    });

    console.log(`[SESSION_PLAYER_DECKS] Found replays:`, {
      count: replays.length,
      replayIds: replays.map(r => r.id),
      urls: replays.map(r => r.replayUrl)
    });

    replays.forEach(replay => {
      console.log(`\n[SESSION_PLAYER_DECKS] Replay ${replay.id}:`, {
        url: replay.replayUrl,
        player1: replay.player1.dbName,
        player2: replay.player2.dbName,
        deckCount: replay.decks.length,
        decks: replay.decks.map(d => ({
          id: d.id,
          name: d.name,
          gameNumber: d.gameNumber,
          cardCount: d.cards.length,
          playerName: d.player.dbName
        }))
      });
    });
    
    if (replays.length === 0) {
      console.log('[SESSION_PLAYER_DECKS] ⚠️ No replays found, returning empty array');
      return []; 
    }

    console.log('\n[SESSION_PLAYER_DECKS] 🎴 Processing card info...');
    const cardSerialNumbers = new Set<string>();
    replays.forEach(replay => {
      replay.decks.forEach(deck => {
        console.log(`[SESSION_PLAYER_DECKS] Processing deck:`, {
          id: deck.id,
          name: deck.name,
          cardCount: deck.cards.length
        });
        deck.cards.forEach(cardEntry => {
          if (cardEntry?.card?.serialNumber) {
            cardSerialNumbers.add(cardEntry.card.serialNumber);
          }
        });
      });
    });

    console.log(`[SESSION_PLAYER_DECKS] Found ${cardSerialNumbers.size} unique cards`);
    const ygoInfoMap = await fetchYGOCardInfo(Array.from(cardSerialNumbers));
    console.log('[SESSION_PLAYER_DECKS] ✅ YGO info fetched');

    console.log('\n[SESSION_PLAYER_DECKS] 🔄 Transforming replays...');
    const transformedReplays = replays.map(replay => {
      const replayWithPlayer = replay.player1.dbName === playerDbName ? replay.player1 : replay.player2;
      const rpsChoices = replayWithPlayer.rpsChoices
        .filter(choice => choice.replayId === replay.id)
        .map(choice => ({
          playerId: choice.playerId,
          choice: choice.choice,
          won: choice.won
        }));
      
      return {
        id: replay.id,
        replayUrl: replay.replayUrl,
        createdAt: replay.createdAt.toString(),
        dbCreatedAt: replay.createdAt,
        player1: {
          id: replay.player1.id,
          dbName: replay.player1.dbName,
          rpsData: replay.player1.dbName === playerDbName ? rpsChoices : null,
          decks: replay.decks.map(deck => ({
            id: deck.id,
            playerId: deck.playerId,
            name: deck.name || 'Unknown Deck',
            gameNumber: deck.gameNumber || 1,
            cards: deck.cards.map(cardEntry => ({
              serialNumber: cardEntry.card.serialNumber,
              name: cardEntry.card.name || 'Unknown Card',
              imageUrl: cardEntry.card.imageUrl || '',
              copies: cardEntry.copiesOfCard || 1,
              ygoInfo: ygoInfoMap[cardEntry.card.serialNumber] || null
            }))
          }))
        },
        player2: {
          id: replay.player2.id,
          dbName: replay.player2.dbName,
          rpsData: replay.player2.dbName === playerDbName ? rpsChoices : null,
          decks: replay.decks.map(deck => ({
            id: deck.id,
            playerId: deck.playerId,
            name: deck.name || 'Unknown Deck',
            gameNumber: deck.gameNumber || 1,
            cards: deck.cards.map(cardEntry => ({
              serialNumber: cardEntry.card.serialNumber,
              name: cardEntry.card.name || 'Unknown Card',
              imageUrl: cardEntry.card.imageUrl || '',
              copies: cardEntry.copiesOfCard || 1,
              ygoInfo: ygoInfoMap[cardEntry.card.serialNumber] || null
            }))
          }))
        }
      };
    });

    console.log(`\n[SESSION_PLAYER_DECKS] ✅ SUCCESS - Returning ${transformedReplays.length} replays`);
    return transformedReplays;

  } catch (error) {
    console.error('\n[SESSION_PLAYER_DECKS] ❌ ERROR:', error);
    console.error('[SESSION_PLAYER_DECKS] Stack:', error.stack);
    throw error; // Let's throw the error to see what's actually failing
  }
};
