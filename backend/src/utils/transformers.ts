/**
 * Utility functions for transforming data structures in resolvers
 */

/**
 * Transforms DeckToCard junction records to CardWithCopies format
 * This eliminates the need to expose the junction table in GraphQL responses
 * 
 * @param deckToCards Array of DeckToCard records with included card data
 * @returns Array of CardWithCopies objects
 */
export function transformDeckToCardWithCopies(deckToCards: any[]) {
  // Group cards by serialNumber to count copies
  const cardMap = new Map();
  
  for (const deckToCard of deckToCards) {
    if (!deckToCard.card) continue; // Skip if card is null
    
    const { card, copiesOfCard = 1 } = deckToCard;
    const key = card.serialNumber;
    
    if (cardMap.has(key)) {
      const existingCard = cardMap.get(key);
      existingCard.copies += copiesOfCard;
    } else {
      cardMap.set(key, {
        name: card.name,
        imageUrl: card.imageUrl,
        serialNumber: card.serialNumber,
        ygoInfo: card.ygoInfo,
        copies: copiesOfCard
      });
    }
  }
  
  return Array.from(cardMap.values());
} 