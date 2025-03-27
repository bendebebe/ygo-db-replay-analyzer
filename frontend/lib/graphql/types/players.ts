import { Deck } from './decks';

export interface PlayerRPSData {
  choice: string;
  playerId: string;
  won: boolean;
}

export interface PlayerData {
  dbName: string;
  rpsData: PlayerRPSData;
  decks: Deck[];
}
