import axios from 'axios';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const YGO_API_BASE_URL = process.env.YGOPRO_API_URL || 'https://db.ygoprodeck.com/api/v7';

interface YGOCardResponse {
  id: number;
  name: string;
  serial_number: string;
  card_images: Array<{
    image_url: string;
  }>;
}

interface YGOAPIResponse {
  data: YGOCardResponse[];
}

async function fetchAllCards(): Promise<YGOCardResponse[]> {
  try {
    const response = await axios.get<YGOAPIResponse>(`${YGO_API_BASE_URL}/cardinfo.php`, {
      timeout: 10000 // 10 second timeout
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching cards:', error);
    return [];
  }
}

function transformSerialNumber(serialNumber: string) {
  return serialNumber.replace(/^0+/, '');
}

async function transformYGOCard(cardData: YGOCardResponse) {
  return {
    name: cardData.name,
    serialNumber: transformSerialNumber(cardData.id.toString()),
    imageUrl: cardData.card_images[0]?.image_url || '',
  };
}

async function updateAllCards(): Promise<void> {
  try {
    // First check if we have any cards
    const cardCount = await prisma.card.count();
    
    // Only proceed with sync if we have no cards
    if (cardCount === 0) {
      console.log('No cards found in database. Starting initial sync...');
      const cards = await fetchAllCards();
      console.log(`Found ${cards.length} cards. Updating database...`);
      
      let created = 0;
      
      for (const card of cards) {
        const transformedCard = await transformYGOCard(card);
        await prisma.card.create({
          data: transformedCard
        });
        created++;
      }
      
      console.log(`Initial sync complete! Created: ${created} cards`);
    } else {
      console.log(`Found ${cardCount} existing cards, skipping sync`);
    }
  } catch (error) {
    console.error('Error during card sync:', error);
  }
}

// Set up the cron job to run daily at midnight
export function startCardSync() {
  // Do initial check
  updateAllCards();
  
  // Schedule daily updates
  cron.schedule('0 0 * * *', () => {
    updateAllCards();
  });
} 