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
    
    console.log(`\n[SESSION_DETAILS] ==========================================`);
    console.log(`[SESSION_DETAILS] Processing replay ${replay.id}`);
    console.log(`[SESSION_DETAILS] Replay URL: ${replay.replayUrl}`);
    console.log(`[SESSION_DETAILS] Players: ${replay.player1.dbName} vs ${replay.player2.dbName}`);
    
    replay.decks.forEach(deck => {
        console.log(`\n[SESSION_DETAILS] Found deck in replay:`);
        console.log(`  Deck ID: ${deck.id}`);
        console.log(`  Player ID: ${deck.playerId}`);
        console.log(`  Player Name: ${deck.player.dbName}`);
        console.log(`  Game Number: ${deck.gameNumber}`);
        console.log(`  Deck Name: ${deck.name}`);
        console.log(`  Card Count: ${deck.cards.length}`);
        console.log(`  Cards: ${deck.cards.map(c => c.card.name).join(', ')}`);
        
        if (!decksByPlayerId.has(deck.playerId)) {
            decksByPlayerId.set(deck.playerId, []);
        }
        
        const transformedCards = deck.cards.map(cardEntry => ({
            serialNumber: cardEntry.card.serialNumber,
            name: cardEntry.card.name,
            imageUrl: cardEntry.card.imageUrl,
            copies: cardEntry.copiesOfCard,
            ygoInfo: ygoInfoMap[cardEntry.card.serialNumber] || null
        }));
        
        decksByPlayerId.get(deck.playerId).push({
            ...deck,
            cards: transformedCards
        });
    });

    console.log(`\n[SESSION_DETAILS] Final deck assignments for replay ${replay.id}:`);
    console.log(`  Player1 (${replay.player1.dbName}):`);
    const player1Decks = decksByPlayerId.get(replay.player1.id) || [];
    player1Decks.forEach(deck => {
        console.log(`    - Game ${deck.gameNumber}: ${deck.name} (${deck.cards.length} cards)`);
    });
    
    console.log(`  Player2 (${replay.player2.dbName}):`);
    const player2Decks = decksByPlayerId.get(replay.player2.id) || [];
    player2Decks.forEach(deck => {
        console.log(`    - Game ${deck.gameNumber}: ${deck.name} (${deck.cards.length} cards)`);
    });

    const player1RpsChoice = replay.player1.rpsChoices.find(
      choice => choice.replayId === replay.id
    );
    
    const player2RpsChoice = replay.player2.rpsChoices.find(
      choice => choice.replayId === replay.id
    );

    return {
      id: replay.id,
      replayUrl: replay.replayUrl,
      player1: {
        id: replay.player1.id,
        dbName: replay.player1.dbName,
        rpsData: player1RpsChoice ? {
          playerId: player1RpsChoice.playerId,
          choice: player1RpsChoice.choice,
          won: player1RpsChoice.won
        } : null,
        decks: decksByPlayerId.get(replay.player1.id) || []
      },
      player2: {
        id: replay.player2.id,
        dbName: replay.player2.dbName,
        rpsData: player2RpsChoice ? {
          playerId: player2RpsChoice.playerId,
          choice: player2RpsChoice.choice,
          won: player2RpsChoice.won
        } : null,
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
      const player = replay.player1.dbName === playerDbName ? replay.player1 : replay.player2;
      const rpsChoice = player.rpsChoices.find(choice => choice.replayId === replay.id);

      console.log(`[SESSION_PLAYER_DECKS] Transforming replay ${replay.id}:`, {
        player: player.dbName,
        deckCount: replay.decks.length,
        hasRpsChoice: !!rpsChoice
      });

      const result = {
        id: replay.id,
        replayUrl: replay.replayUrl,
        player1: {
          id: player.id,
          dbName: player.dbName,
          rpsData: rpsChoice ? {
            playerId: rpsChoice.playerId,
            choice: rpsChoice.choice,
            won: rpsChoice.won
          } : null,
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

      console.log(`[SESSION_PLAYER_DECKS] Transformed replay result:`, {
        id: result.id,
        url: result.replayUrl,
        deckCount: result.player1.decks.length,
        cardCounts: result.player1.decks.map(d => d.cards.length)
      });

      return result;
    });

    console.log(`\n[SESSION_PLAYER_DECKS] ✅ SUCCESS - Returning ${transformedReplays.length} replays`);
    return transformedReplays;

  } catch (error) {
    console.error('\n[SESSION_PLAYER_DECKS] ❌ ERROR:', error);
    console.error('[SESSION_PLAYER_DECKS] Stack:', error.stack);
    throw error; // Let's throw the error to see what's actually failing
  }
};
