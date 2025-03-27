import { prisma } from '../../lib/prisma';
import { bullQueueService } from '../../services/bullQueueService';
import { replayService } from '../../services/replayService';
import { FetchReplayDataArgs } from "./types";

// Helper function to simplify Duelingbook URLs
const simplifyUrl = (url: string): string => {
  const match = url.match(/(?:https?:\/\/)?(?:www\.)?duelingbook\.com\/replay\?id=(\d+)-(\d+)/)
  if (!match) return url
  // Keep only the replay ID part
  return `https://www.duelingbook.com/replay?id=${match[2]}`
}

export const fetchReplayData = async (_: any, { urls, sessionId }: FetchReplayDataArgs) => {
  // Simplify URLs before processing
  const simplifiedUrls = urls.map(url => simplifyUrl(url));
  
  const results = await Promise.all(
    simplifiedUrls.map(url => replayService.fetchReplay(url, sessionId))
  );
  return results;
};

export const submitReplayJobs = async (_: any, { urls, sessionId }: FetchReplayDataArgs) => {
  // Simplify URLs before processing
  const simplifiedUrls = urls.map(url => simplifyUrl(url));
  
  // Create a single session if none was provided
  if (!sessionId) {
    const session = await prisma.session.create({ data: {} });
    sessionId = session.id;
    console.log(`[SUBMIT] Created new session ${sessionId} for batch of ${urls.length} URLs`);
  } else {
    console.log(`[SUBMIT] Using provided session ${sessionId} for batch of ${urls.length} URLs`);
  }
  
  // Add jobs to queue with the SAME sessionId
  const jobIds = await bullQueueService.addReplayJobs(simplifiedUrls, sessionId);
  
  // Return sessionId instead of jobIds
  return sessionId;
};

// Add this new mutation to your existing mutations file
export const deleteAllReplays = async (_: any, __: any) => {
  try {
    console.log('Starting deletion of all replay data...');
    
    // Use a transaction to ensure all related data is deleted in the correct order
    const result = await prisma.$transaction(async (tx) => {
      // First, count everything to see what we're deleting
      const initialCounts = await countAllEntities(tx);
      console.log('Initial counts:', initialCounts);
      
      // Start with the most dependent entities
      
      // 1. Delete RPS choices (they reference players and replays)
      const rpsResult = await tx.rpsChoice.deleteMany({});
      console.log(`Deleted ${rpsResult.count} RPS choices`);
      
      // 2. Delete deck cards (many-to-many relationship between decks and cards)
      // Important: This preserves the actual cards, just removes their association with decks
      const deckCardsResult = await tx.deckToCard.deleteMany({});
      console.log(`Deleted ${deckCardsResult.count} deck-to-card associations`);
      
      // 3. Delete all deck entities
      const decksResult = await tx.deck.deleteMany({});
      console.log(`Deleted ${decksResult.count} decks`);
      
      // 4. Delete replays (must be done after decks are deleted since decks reference replays)
      const replaysResult = await tx.replay.deleteMany({});
      console.log(`Deleted ${replaysResult.count} replays`);
      
      // 5. Only delete players after replays are gone
      const playersResult = await tx.player.deleteMany({});
      console.log(`Deleted ${playersResult.count} players`);
      
      // Final check to verify everything was deleted
      const finalCounts = await countAllEntities(tx);
      console.log('Final counts:', finalCounts);
      
      return { 
        count: replaysResult.count,
        rpsCount: rpsResult.count,
        deckCardsCount: deckCardsResult.count,
        decksCount: decksResult.count,
        playersCount: playersResult.count
      };
    });

    console.log(`Successfully deleted ${result.count} replays and all related data`);
    
    return {
      success: true,
      message: `Successfully deleted: ${result.count} replays, ${result.playersCount} players, ${result.decksCount} decks, ${result.deckCardsCount} deck cards, ${result.rpsCount} RPS choices`,
      count: result.count
    };
  } catch (error) {
    console.error('Error deleting all replays:', error);
    return {
      success: false,
      message: `Error deleting replays: ${error instanceof Error ? error.message : String(error)}`,
      count: 0
    };
  }
};

// Helper function to count all entities
async function countAllEntities(tx: any) {
  return {
    replays: await tx.replay.count(),
    players: await tx.player.count(),
    decks: await tx.deck.count(),
    deckCards: await tx.deckToCard.count(),
    rpsChoices: await tx.rpsChoice.count()
  };
}