import { PaginationArgs, SortableArgs } from "../types"

export interface ReplayInput {
    name: string
    replayUrl: string
    userId: string
    sessionId: string
    deckId: string
}

export interface FetchReplayDataArgs {
    urls: string[]
    sessionId?: string
}

// admit defeat example
// "over": true,
//             "seconds": 606,
//             "player1": {
//                 "rating": 950,
//                 "experience": 5651,
//                 "points": 13
//             },
//             "log": {
//                 "public_log": "Admitted defeat",
//                 "type": "game",
//                 "username": "TheEdisonGrinder"
//             },
//             "player2": {
//                 "rating": 600,
//                 "experience": 2077,
//                 "points": -12
//             },
//             "action": "Duel",
//             "username": "TheEdisonGrinder"

// Base interface for all plays
export interface BasePlay {
    play: string;
    seconds: number;
    action?: string;
    log?: {
      public_log: string;
      type: string;
      username: string;
    };
  }

// Admit defeat play
export interface AdmitDefeatPlay extends BasePlay {
    play: 'ADMIT_DEFEAT';
    over: boolean;
    username: string;
}

  // Rock Paper Scissors play
  export interface RPSPlay extends BasePlay {
    play: 'RPS';
    player1_choice: 'Rock' | 'Paper' | 'Scissors';
    player2_choice: 'Rock' | 'Paper' | 'Scissors';
    winner: string;
    player1: string;
    player2: string;
  }
  
  // Draw Card play
  export interface DrawPlay extends BasePlay {
    play: 'DRAW';
    player: string;
    cards_drawn: number;
    phase?: string;
  }
  
  // Summon play
  export interface SummonPlay extends BasePlay {
    play: 'SUMMON';
    player: string;
    card: string;
    position: 'attack' | 'defense';
    phase?: string;
  }
  
  // Attack play
  export interface AttackPlay extends BasePlay {
    play: 'ATTACK';
    attacker: string;
    defender?: string;
    attacking_card: string;
    defending_card?: string;
    damage?: number;
    phase: 'Battle';
  }
  
  // Set play
  export interface SetPlay extends BasePlay {
    play: 'SET';
    player: string;
    card: string;
    zone: 'monster' | 'spell/trap';
    phase?: string;
  }
  
  // Activate play
  export interface ActivatePlay extends BasePlay {
    play: 'ACTIVATE';
    player: string;
    card: string;
    target?: string;
    phase?: string;
  }
  
  // Phase Change play
  export interface PhaseChangePlay extends BasePlay {
    play: 'PHASE';
    player: string;
    from: string;
    to: string;
  }
  
  // Union type of all possible plays
  export type Play = 
    | RPSPlay 
    | DrawPlay 
    | SummonPlay 
    | AttackPlay 
    | SetPlay 
    | ActivatePlay 
    | PhaseChangePlay;
    
export interface ReplayPaginationArgs extends PaginationArgs, SortableArgs {}