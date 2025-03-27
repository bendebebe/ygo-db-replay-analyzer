export interface CardWithCopies {
  serialNumber: string;
  copies: number;
  name: string;
  imageUrl: string;
  ygoInfo?: YgoCardInfo;
}

export interface YgoCardInfo {
  id: string;
  name: string;
  type: string;
  desc: string;
  atk: number;
  def: number;
  level: number;
  race: string;
  attribute: string;
  archetype: string;
  scale: number;
  linkval: number;
  linkmarkers: string[];
  card_sets: CardSet[];
  card_images: CardImage[];
  card_prices: CardPrice[];
  frameType: string;
  isExtraDeck: boolean;
  serialNumber: string;
}

export interface CardSet {
  set_code: string;
  set_name: string;
  set_price: string;
  set_rarity: string;
}

export interface CardImage {
  image_url: string;
}

export interface CardPrice {
  tcgplayer_price: string;
  cardmarket_price: string;
}