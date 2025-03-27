export interface Player {
  id: string;
  playerId: string;
  dbName: string;
  replays1: Replay[];
  replays2: Replay[];
  wonReplays: Replay[];
  rpsChoices: RpsChoice[];
  createdAt: string;
  updatedAt: string;
}

export interface RpsChoice {
  id: string;
  playerId: string;
  replayId: string;
  choice: string;
  won: boolean;
  player: Player;
  replay: Replay;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerDeckState {
  dbName: string;
  games: {
    [gameNumber: number]: {
      cards: {
        serialNumber: string;
        count: number;
        name: string;
      }[];
    };
  };
}

export interface DeckAnalysis {
  player1: {
    dbName: string;
    cards: {
      [serialNumber: string]: {
        gamesUsed: {
          [gameNumber: number]: {
            count: number;
            adjustedCount: number;
          };
        };
      };
    };
  };
  player2: {
    dbName: string;
    cards: {
      [serialNumber: string]: {
        gamesUsed: {
          [gameNumber: number]: {
            count: number;
            adjustedCount: number;
          };
        };
      };
    };
  };
  rpsChoices: {
    [dbName: string]: {
      choice: string;
      opponent: string;
      won: boolean;
    }[];
  };
  lastSeenCards?: {
    [serialNumber: string]: {
      serialNumber: string;
      name: string;
    };
  };
} 