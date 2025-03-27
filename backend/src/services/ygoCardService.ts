import axios from 'axios';

const YGO_API_BASE = 'https://db.ygoprodeck.com/api/v7';

interface YGOCardSet {
  set_name: string;
  set_code: string;
  set_rarity: string;
  set_price: string;
}

interface YGOCardImage {
  serialNumber: number;
  image_url: string;
  image_url_small: string;
}

interface YGOCardPrice {
  cardmarket_price: string;
  tcgplayer_price: string;
  ebay_price: string;
  amazon_price: string;
  coolstuff_price: string;
}

export interface YGOCard {
  serialNumber: string;
  name: string;
  type: string;
  desc: string;
  atk?: number;
  def?: number;
  level?: number;
  race: string;
  attribute?: string;
  archetype?: string;
  scale?: number;
  linkval?: number;
  linkmarkers?: string[];
  card_sets?: YGOCardSet[];
  card_images: YGOCardImage[];
  card_prices: YGOCardPrice[];
  frameType: string;
  isExtraDeck: boolean;
}

export async function fetchYGOCardInfo(cardIds: string[]): Promise<Record<string, YGOCard>> {
  try {
    const url = `${YGO_API_BASE}/cardinfo.php`;
    const params = { id: cardIds.join(',') };
    if (cardIds.length === 0) {
      return {};
    }
    const response = await axios.get(url, {
      params,
      timeout: 5000 // 5 second timeout
    });

    const cards = response.data.data;
    // return a mapping of serialNumber to YGOCardInfo
    return cards.reduce((acc: Record<string, YGOCard>, card: any) => {
      acc[card.id.toString()] = {
        serialNumber: card.id.toString(),
        name: card.name,
        type: card.type,
        desc: card.desc,
        atk: card.atk,
        def: card.def,
        level: card.level,
        race: card.race,
        attribute: card.attribute,
        archetype: card.archetype,
        scale: card.scale,
        linkval: card.linkval,
        linkmarkers: card.linkmarkers,
        card_sets: card.card_sets,
        card_images: card.card_images,
        card_prices: card.card_prices,
        frameType: card.frameType,
        isExtraDeck: isExtraDeckCard(card.type)
      };
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching YGO card info:', error);
    if (axios.isAxiosError(error)) {
      console.error('Request details:', {
        url: error.config?.url,
        params: error.config?.params,
        response: error.response?.data
      });
    }
    return {};
  }
}

function isExtraDeckCard(cardType: string): boolean {
  const extraDeckTypes = [
    'Fusion Monster',
    'Synchro Monster',
    'XYZ Monster',
    'Link Monster',
    'Pendulum Effect Fusion Monster',
    'Synchro Pendulum Effect Monster',
    'XYZ Pendulum Effect Monster'
  ];
  return extraDeckTypes.includes(cardType);
} 