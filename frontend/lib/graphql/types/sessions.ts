import { YgoCardInfo } from './cards';

// Types for the sessionPlayerDecks query
export interface CardImage {
  id: number;
  image_url: string;
  image_url_small: string;
}

export interface ReplayCard {
  serialNumber: string;
  name: string;
  imageUrl: string;
  copies: number;
  ygoInfo: YgoCardInfo;
}

export interface ReplayDeck {
  id: string;
  name: string;
  gameNumber: number;
  playerId: string;
  cards: ReplayCard[];
}

export interface RpsData {
  playerId: string;
  choice: string;
  won: boolean;
}

export interface ReplaySessionPlayer {
  id: string;
  dbName: string;
  rpsData: RpsData | null;
  decks: ReplayDeck[];
}

export interface ReplayAnalysis {
  id: string;
  replayUrl: string;
  player1: ReplaySessionPlayer;
}

export interface SessionPlayerDecksResponse {
  sessionPlayerDecks: ReplayAnalysis[];
}

// Type for the transformed data in playerReplays
export interface PlayerReplay {
  url: string;
  decks: ReplayDeck[];
} 