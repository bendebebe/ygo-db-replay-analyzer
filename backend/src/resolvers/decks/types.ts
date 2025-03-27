export interface DeckAnalysisPlayer {
    playerId: string;
    userId: string;
    dbName: string;
    cards: Record<string, {
      gamesUsed: Record<string, {
        adjustedCount: number;
        rawCount: number;
      }>;
    }>;
    won: boolean;
  }


export interface RpsChoice {
    choice: string;
    opponent: string;
    won: boolean;
  }
  export interface PlayerRPSTracker {
    [username: string]: RpsChoice;
  }

// Update the DeckAnalysis interface to use the new Play type
export interface DeckAnalysis {
    player1: DeckAnalysisPlayer;
    player2: DeckAnalysisPlayer;
    rpsChoices: PlayerRPSTracker;
    lastSeenCards?: Record<string, {
      name: string;
    }>;
} 

export interface CreateDeckInput {
  name: string;
  gameNumber: number;
  playerId: string;
  replayId: string;
  cardIds: string[];
}

export interface UpdateDeckInput {
  id: string;
  name?: string;
  gameNumber?: number;
  cardIds?: string[];
}