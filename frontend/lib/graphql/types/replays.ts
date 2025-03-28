import { YgoCardInfo } from './cards';

export interface ReplayDeck {
    id: string;
    name: string;
    gameNumber: number;
    cards: {
        serialNumber: string;
        copies: number;
        imageUrl: string;
        ygoInfo: YgoCardInfo;
    }[];
}

export interface ReplayPlayer {
    dbName: string;
    rpsData: {
        playerId: string;
        choice: string;
        won: boolean;
    }[];
    decks: ReplayDeck[];
}

export interface ReplayResponse {
    url: string;
    player1: ReplayPlayer;
    player2: ReplayPlayer;
    error?: string;
}

export interface PlayerData {
    dbName: string;
    rpsData: RpsChoiceData[];
    decks: DeckData[];
}

export interface RpsChoiceData {
    playerId: string;
    choice: string;
    won: boolean;
}

export interface DeckData {
    id: string;
    name: string;
    gameNumber: number;
    cards: DeckCardData[];
}

export interface DeckCardData {
    serialNumber: string;
    copies: number;
    name: string;
    imageUrl: string;
    type?: string;
    description?: string;
}

// This is used internally by the Analyzer component
export interface ReplayData {
    id: string;
    object: string; // The raw replay data
    data: ReplayResponse;
}

export interface Replay {
    id: string;
    url: string;
    player1: ReplayPlayer;
    player2: ReplayPlayer;
}
