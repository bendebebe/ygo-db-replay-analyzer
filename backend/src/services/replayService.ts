import puppeteer, { Browser, Page } from 'puppeteer';
import { prisma } from '../lib/prisma'
import { DeckAnalysis, DeckAnalysisPlayer, PlayerRPSTracker } from '../resolvers/decks/types'
import { RPSPlay } from '../resolvers/replays/types'
import { PlayerInfo } from '../resolvers/players/types'
import { fetchYGOCardInfo, YGOCard } from './ygoCardService';
import { transformDeckToCardWithCopies } from '../utils/transformers'
import { rateLimiter } from '../queues/replayQueue';
declare const window: any;

interface PlayerRPSData {
  playerId: string;
  choice: string;
  won: boolean;
}

interface PlayerData {
  dbName: string;
  rpsData: PlayerRPSData;
  decks: DeckWithCards[];
}

interface ReplayResponse {
  url: string;
  player1?: PlayerData;
  player2?: PlayerData;
  error?: string;
  performance?: Record<string, number>;
}

interface Card {
  id?: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  imageUrl: string;
  serialNumber: string;
  ygoInfo: YGOCard;
}

interface CardWithCopies extends Card {
  copies: number;
}

interface DeckWithCards {
  id: string;
  name: string;
  gameNumber: number;
  cards: CardWithCopies[];
}

// Add browser pool and response cache
class BrowserPool {
  private browsers: Browser[] = [];
  private maxSize: number;
  private inUse: Set<Browser> = new Set();
  
  constructor(maxSize = 3) {
    this.maxSize = maxSize;
  }
  
  async getBrowser(): Promise<Browser> {
    // Find an unused browser or create a new one if needed
    for (const browser of this.browsers) {
      if (!this.inUse.has(browser)) {
        this.inUse.add(browser);
        return browser;
      }
    }
    
    // Need to create a new browser
    if (this.browsers.length < this.maxSize) {
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080',
          // Disable automation flags
          '--disable-blink-features=AutomationControlled'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        // Add user agent and other properties
        ignoreDefaultArgs: ['--enable-automation'],
      });
      
      this.browsers.push(browser);
      this.inUse.add(browser);
      return browser;
    }
    
    // Wait for a browser to become available
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        for (const browser of this.browsers) {
          if (!this.inUse.has(browser)) {
            clearInterval(checkInterval);
            this.inUse.add(browser);
            resolve(browser);
            return;
          }
        }
      }, 100);
    });
  }
  
  releaseBrowser(browser: Browser): void {
    this.inUse.delete(browser);
  }
  
  async cleanup(): Promise<void> {
    const closePromises = this.browsers.map(browser => browser.close());
    await Promise.all(closePromises);
    this.browsers = [];
    this.inUse.clear();
  }
}

export class ReplayService {
  private readonly RECAPTCHA_SITE_KEY = '6LcjdkEgAAAAAKoEsPnPbSdjLkf4bLx68445txKj';
  private readonly TIMEOUT = 40000;
  private browserPool = new BrowserPool(3); // Pool of 3 browsers
  private responseCache: Map<string, ReplayResponse> = new Map(); // Response cache

  private async setupPage(browser: Browser): Promise<Page> {
    const page = await browser.newPage();
    
    // Block unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', request => {
      const resourceType = request.resourceType();
      if (resourceType === 'image' || 
          resourceType === 'stylesheet' || 
          resourceType === 'font' ||
          resourceType === 'media') {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.setDefaultNavigationTimeout(this.TIMEOUT);
    return page;
  }

  private async injectRecaptchaHandler(page: Page, token: string): Promise<void> {
    await page.evaluate((injectedToken) => {
      window.loadRecaptchaV3 = function() {
        console.log('Intercepted loadRecaptchaV3');
        (window).recaptcha_version = 3;
        (window).loadReplay(injectedToken);
      };
    }, token);
  }

  async fetchReplay(url: string, sessionId?: string): Promise<ReplayResponse> {
    // Check cache first
    const cachedResponse = this.responseCache.get(url);
    if (cachedResponse) {
      console.log(`[ReplayService] Cache hit for ${url}`);
      return cachedResponse;
    }
    
    // Add performance tracking
    const timing: Record<string, number> = {};
    const startTimer = (label: string) => {
      timing[`${label}_start`] = performance.now();
    };
    const endTimer = (label: string) => {
      timing[`${label}_end`] = performance.now();
      timing[`${label}_duration`] = timing[`${label}_end`] - timing[`${label}_start`];
      console.log(`[Performance] ${label}: ${timing[`${label}_duration`].toFixed(2)}ms`);
    };
    
    startTimer('total');
    
    // check to see if the url is already in the database
    const replay = await prisma.replay.findUnique({
      where: {
        replayUrl: url
      }
    });
    if (replay) {
      const player1 = await prisma.player.findUnique({
        where: {
          id: replay.player1Id
        }
      });
      const player2 = await prisma.player.findUnique({
        where: {
          id: replay.player2Id
        }
      });
      if (!player1 || !player2) {
        throw new Error('Player not found');
      }
      const decks1 = await prisma.deck.findMany({
        where: {
          replayId: replay.id,
          playerId: player1.id
        },
        include: {
          cards: {
            include: {
              card: true
            }
          }
        }
      });
      const decks2 = await prisma.deck.findMany({
        where: {
          replayId: replay.id,
          playerId: player2.id
        },
        include: {
          cards: {
            include: {
              card: true
            }
          }
        }
      });
      console.log('decks1');
      console.log(decks1[0]);
      let decks1Cards: DeckWithCards[] = decks1.map((deck: any) => ({
        id: deck.id,
        name: deck.name,
        gameNumber: deck.gameNumber,
        cards: deck.cards.map((deckToCard: any) => ({
          copies: deckToCard.copiesOfCard,
          ...deckToCard.card
        }))
      }));
      let decks2Cards: DeckWithCards[] = decks2.map((deck: any) => ({
        id: deck.id,
        name: deck.name,
        gameNumber: deck.gameNumber,
        cards: deck.cards.map((deckToCard: any) => ({
          copies: deckToCard.copiesOfCard,
          ...deckToCard.card
        }))
      }));
      const ygoCardInfo = await this.getYgoCardInfo([decks1Cards, decks2Cards]);
      const decks1CardsWithYgoInfo = decks1Cards.map((deck: any) => {
        return this.mapCardsToYgoInfo(deck.cards, ygoCardInfo);
      });
      const decks2CardsWithYgoInfo = decks2Cards.map((deck: any) => {
        return this.mapCardsToYgoInfo(deck.cards, ygoCardInfo);
      });
      console.log('decks1Cards');
      console.log(decks1Cards[0].cards);
      const rpsChoices = await prisma.rpsChoice.findMany({
        where: {
          replayId: replay.id
        }
      });
      const ret = {
        url,
        player1: {
          dbName: player1.dbName,
          rpsData: {
            playerId: player1.playerId,
            choice: rpsChoices.find(choice => choice.playerId === player1.id)?.choice || '',
            won: rpsChoices.find(choice => choice.playerId === player1.id)?.won || false
          },
          decks: decks1.map(deck => {
            return {
              id: deck.id,
              name: deck.name,
              gameNumber: deck.gameNumber,
              cards: decks1CardsWithYgoInfo[deck.gameNumber - 1]
            }
          })
        },
        player2: {
          dbName: player2.dbName,
          rpsData: {
            playerId: player2.playerId,
            choice: rpsChoices.find(choice => choice.playerId === player2.id)?.choice || '',
            won: rpsChoices.find(choice => choice.playerId === player2.id)?.won || false
          },
          decks: decks2.map(deck => {
            return {
              id: deck.id,
              name: deck.name,
              gameNumber: deck.gameNumber,
              cards: decks2CardsWithYgoInfo[deck.gameNumber - 1]
            }
          })
        }
      };
      
      // Add to cache
      this.responseCache.set(url, ret);
      return ret;
    }
    
    startTimer('browser_launch');
    const browser = await this.browserPool.getBrowser();
    endTimer('browser_launch');

    let viewReplayResponse: { status: number; body: string } = { status: 0, body: ''};
    let count = 0;
    try {
      while (count < 3) {
        // Check if we received a valid response
        if (viewReplayResponse.body && 
            JSON.parse(viewReplayResponse.body).player1?.user_id && 
            JSON.parse(viewReplayResponse.body).player2?.user_id) {
          break; // Valid response, exit the loop
        }
        
        // Check for login required message
        if (viewReplayResponse.body && 
            JSON.parse(viewReplayResponse.body)['message'] === 'You must be logged in to view this replay') {
          console.log(`[ReplayService] Detected "login required" message for ${url}`);
          
          // Wait for a distributed rate-limited retry slot
          await rateLimiter.waitForLoginRetrySlot();
          console.log(`[ReplayService] Acquired login retry slot for ${url}`);
        }
        
        count++;
        startTimer('page_setup');
        const page = await this.setupPage(browser);
        endTimer('page_setup');
        
        // Add additional page configurations
        await page.evaluateOnNewDocument(() => {
          // Pass webdriver check
          // @ts-expect-error we don't care about the type of navigator
          Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
          });

          // Pass chrome check
          window.chrome = {
            runtime: {},
            // add other chrome properties as needed
          };

          // Pass notifications check
          const originalQuery = window.navigator.permissions.query;
          window.navigator.permissions.query = (parameters: any): Promise<any> => 
            parameters.name === 'notifications' 
              // @ts-expect-error we don't care about the type of Notification
              ? Promise.resolve({ state: Notification.permission }) 
              : originalQuery(parameters);

          // Overwrite the `plugins` property to use a custom getter
          // @ts-expect-error we don't care about the type of navigator
          Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5],
          });

          // Overwrite the `languages` property
          // @ts-expect-error we don't care about the type of navigator
          Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en'],
          });
        });

        // Set a more realistic user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');

        // Set up response interceptor
        page.on('response', async response => {
          if (response.url().includes('view-replay')) {
            viewReplayResponse = {
              status: response.status(),
              body: await response.text()
            };
          }
        });

        startTimer('initial_navigation');
        // Get reCAPTCHA token
        await page.goto(url, {
          waitUntil: 'networkidle0',
          timeout: this.TIMEOUT 
        });
        endTimer('initial_navigation');
        
        startTimer('recaptcha_token');
        const token = await page.evaluate(async (siteKey) => {
          return await new Promise<string>(resolve => {
            (window).grecaptcha.ready(async () => {
              const token = await (window).grecaptcha.execute(siteKey, {action: 'submit'});
              resolve(token);
            });
          });
        }, this.RECAPTCHA_SITE_KEY);
        endTimer('recaptcha_token');
        
        startTimer('replay_data_fetch');
        // Inject handler and load replay
        await this.injectRecaptchaHandler(page, token);
        
        await page.goto(url, {
          waitUntil: 'networkidle0',
          timeout: this.TIMEOUT
        });
        
        // Wait for response if not already received
        if (!viewReplayResponse.body) {
          await page.waitForResponse(
            response => response.url().includes('view-replay'),
            { timeout: this.TIMEOUT }
          );
        }
        endTimer('replay_data_fetch');
      }

    } catch (error) {
      console.error('[ReplayService] Error:', error instanceof Error ? error.message : 'Unknown error');
      this.browserPool.releaseBrowser(browser);
      return {
        url,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        performance: timing
      };
    } finally {
      startTimer('browser_close');
      // Instead of closing, we release back to pool
      this.browserPool.releaseBrowser(browser);
      endTimer('browser_close');
      console.log('[ReplayService] Browser released to pool');
    }
    
    startTimer('db_operations');
    const result = await this.storeReplayAnalysis(url, viewReplayResponse.body, sessionId);
    endTimer('db_operations');
    
    endTimer('total');
    console.log(`[Performance] Total processing time for ${url}: ${timing['total_duration'].toFixed(2)}ms`);
    
    // Add timing data to result
    const response = {
      ...result,
      performance: timing
    };
    
    // Cache the result
    this.responseCache.set(url, response);
    
    return response;
  }

  async getSession(sessionId?: string): Promise<any> {
    console.log(`[REPLAY_SERVICE] getSession called with sessionId: ${sessionId || 'NONE'}`);
    
    if (!sessionId) {
      throw new Error('No sessionId provided to worker - this should never happen');
    }
    
    // Look up existing session
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });
    
    if (!session) {
      console.error(`[REPLAY_SERVICE] ⚠️ CRITICAL ERROR: Session ${sessionId} not found in database`);
      // We could throw an error here, but for production safety we'll try to recover by creating it
      console.log(`[REPLAY_SERVICE] Attempting recovery by creating session with ID: ${sessionId}`);
      return await prisma.session.create({
        data: { id: sessionId }
      });
    }
    
    console.log(`[REPLAY_SERVICE] Using existing session: ${session.id}`);
    return session;
  }

  async storeReplayAnalysis(url: string, replayJson: string, sessionId?: string): Promise<ReplayResponse> {
    try {
      if (!replayJson) {
        throw new Error('No replay data found');
      }
      const { analysis, rpsPlay } = this.analyzeReplayData(replayJson);
      if (!rpsPlay) {
        throw new Error('No RPS play found in replay');
      }

      const session = await this.getSession(sessionId);
      sessionId = session.id;

      const playerInfo: PlayerInfo = { 
        player1: {
          id: analysis.player1.userId,
          playerId: analysis.player1.playerId,
          dbName: analysis.player1.dbName
        },
        player2: {
          id: analysis.player2.userId,
          playerId: analysis.player2.playerId,
          dbName: analysis.player2.dbName
        }
      }

      // store players
      const [player1, player2] = await this.storePlayers(playerInfo);
      analysis.player1.playerId = player1.playerId;
      analysis.player2.playerId = player2.playerId;
      playerInfo.player1.id = player1.id;
      playerInfo.player2.id = player2.id;

      // Create a lock name based on the URL
      const lockName = `replay:${url}`;
      let lockAcquired = false;
      let replay;

      try {
        // Try to acquire a lock for this specific URL
        lockAcquired = await rateLimiter.acquireLock(lockName, 30000);
        
        if (!lockAcquired) {
          console.log(`Could not acquire lock for URL: ${url}, checking if already exists`);
          
          // Check if replay already exists in database
          const existingReplay = await prisma.replay.findUnique({
            where: { replayUrl: url }
          });
          
          if (existingReplay) {
            console.log(`Found existing replay: ${existingReplay.id}`);
            replay = existingReplay;
          }
        }
        
        // If we have the lock or replay not found after waiting, create it
        if (!replay) {
          // Double-check if replay exists after acquiring lock
          const checkReplay = await prisma.replay.findUnique({
            where: { replayUrl: url }
          });
          
          if (checkReplay) {
            replay = checkReplay;
          } else {
            // Update replay with player info
            replay = await prisma.replay.create({
              data: {
                replayUrl: url,
                sessionId: session.id,
                player1Id: player1.id,
                player2Id: player2.id,
                winnerPlayerId: analysis.player1.won ? player1.id : player2.id
              }
            });
          }
        }
      } finally {
        // Always release the lock if we acquired it
        if (lockAcquired) {
          await rateLimiter.releaseLock(lockName);
          console.log(`Released lock for URL: ${url}`);
        }
      }

      // Debugging verification of sessionId
      console.log(`[REPLAY_SERVICE] ====== SESSION ID VERIFICATION ======`);
      console.log(`[REPLAY_SERVICE] Replay URL: ${url}`);
      console.log(`[REPLAY_SERVICE] Original sessionId passed to function: ${sessionId || 'NONE'}`);
      console.log(`[REPLAY_SERVICE] Session ID after lookup: ${session.id}`);

      // Force explicit verification and throw error if mismatch  
      if (sessionId && sessionId !== session.id) {
        console.error(`[REPLAY_SERVICE] ⚠️ SESSION ID MISMATCH DETECTED ⚠️`);
        console.error(`[REPLAY_SERVICE] Original sessionId: ${sessionId}`);
        console.error(`[REPLAY_SERVICE] Overridden to: ${session.id}`);
        
        // Uncomment this to throw an error when mismatch occurs
        // throw new Error(`Session ID mismatch: original=${sessionId}, new=${session.id}`);
      }

      // The replay should be created with session.id

      // save rps choices
      await this.storeRpsChoices(replay.id, playerInfo, rpsPlay);
      // Store deck data for both players
      const decks = await Promise.all([this.storeDeckForPlayer(replay.id, analysis.player1, player1.id, analysis.player2), this.storeDeckForPlayer(replay.id, analysis.player2, player2.id, analysis.player1)]);

      const ygoCardInfo = await this.getYgoCardInfo(decks);
      const decksWithYgoInfo: DeckWithCards[][] = decks.map(deck => {
        return deck.map(deck => ({
          id: deck.id,
          name: deck.name,
          gameNumber: deck.gameNumber,
          cards: this.mapCardsToYgoInfo(deck.cards, ygoCardInfo)
        }));
      })
      return {
        url,
        player1: {
          dbName: analysis.player1.dbName,
          rpsData: {
            playerId: analysis.player1.userId,
            choice: analysis.rpsChoices[analysis.player1.dbName].choice,
            won: analysis.rpsChoices[analysis.player1.dbName].won
          },
          decks: decksWithYgoInfo[0]
        },
        player2: {
          dbName: analysis.player2.dbName,
          rpsData: {
            playerId: analysis.player2.userId,
            choice: analysis.rpsChoices[analysis.player2.dbName].choice,
            won: analysis.rpsChoices[analysis.player2.dbName].won
          },
          decks: decksWithYgoInfo[1]
        }
      }
    } catch (error) {
      console.error('Error storing analysis:', error);
      throw error;
    }
  }

  mapCardsToYgoInfo(cards: any[], ygoCardInfo: { [key: string]: YGOCard }): CardWithCopies[] {
    return cards.map(card => ({
      imageUrl: card.imageUrl,
      serialNumber: card.serialNumber,
      copies: card.copies || card.copiesOfCard,
      name: card.name,
      ygoInfo: ygoCardInfo[card.serialNumber]
    }));
  }

  async storeRpsChoices(replayId: string, playerInfo: PlayerInfo, rpsPlay: RPSPlay) {
    if (!rpsPlay) {
      throw new Error('No RPS play found in replay');
    }

    const doesMoveWin = (move: string, againstMove: string): boolean => {
      const winningMoves = {
        'Rock': 'Scissors',
        'Paper': 'Rock',
        'Scissors': 'Paper'
      };
      return winningMoves[move as keyof typeof winningMoves] === againstMove;
    };

    const inferRpsWinner = (rpsPlay: RPSPlay, player: "player1" | "player2"): boolean => {
      const move = player === "player1" ? rpsPlay.player1_choice : rpsPlay.player2_choice;
      const opponentMove = player === "player1" ? rpsPlay.player2_choice : rpsPlay.player1_choice;
      return doesMoveWin(move, opponentMove);
    };

    const rpsPlayer1 = await prisma.rpsChoice.create({
      data: {
        playerId: playerInfo.player1.id,
        replayId: replayId,
        choice: rpsPlay.player1_choice,
        won: inferRpsWinner(rpsPlay, "player1")
      }
    });

    const rpsPlayer2 = await prisma.rpsChoice.create({
      data: {
        playerId: playerInfo.player2.id,
        replayId: replayId,
        choice: rpsPlay.player2_choice,
        won: inferRpsWinner(rpsPlay, "player2")
      }
    });

    return { rpsPlayer1, rpsPlayer2 };
  }

  async storePlayers(playerInfo: PlayerInfo) {
    return Promise.all([
      prisma.player.upsert({
        where: { dbName: playerInfo.player1.dbName },
        create: {
          playerId: playerInfo.player1.id,
          dbName: playerInfo.player1.dbName
        },
        update: {}
      }),
      prisma.player.upsert({
        where: { dbName: playerInfo.player2.dbName },
        create: {
          playerId: playerInfo.player2.id,
          dbName: playerInfo.player2.dbName
        },
        update: {}
      })
    ]);
  }

  async storeDeckForPlayer(replayId: string, player: DeckAnalysisPlayer, playerId: string, opponent: DeckAnalysisPlayer): Promise<DeckWithCards[]> {
    const restructureDecks: { [key: number]: string[] } = {1: [], 2: [], 3: []};
    // for each card in the player's cards, build a deck for each game number
    for (const gameNumber of [1,2,3]) {
      for (const card of Object.keys(player.cards)) {
        if (player.cards[card].gamesUsed[gameNumber]?.adjustedCount > 0) {
          restructureDecks[gameNumber].push(card);
        }
      }
    }

    // create a deck for each game number
    const decks: DeckWithCards[] = [];
    for (const gameNumber of ["1", "2", "3"]) {
      // Standardize deck name to ensure consistency regardless of player order
      // Alphabetically sort player names to ensure the same name is used for both players
      const playerNames = [player.dbName, opponent.dbName].sort();
      const deckName = `[G${gameNumber}] - ${playerNames[0]} vs. ${playerNames[1]}`;
      
      // Check if a deck with this name and game number already exists
      const existingDeck = await prisma.deck.findFirst({
        where: {
          replayId: replayId,
          gameNumber: parseInt(gameNumber),
          name: deckName
        }
      });

      if (existingDeck) {
        // Check if this player already has a deck for this game number
        const playerDeck = await prisma.deck.findFirst({
          where: {
            replayId: replayId,
            gameNumber: parseInt(gameNumber),
            playerId: playerId
          }
        });
        
        if (playerDeck) {
          // Deck already exists for this player, fetch and return it
          const deckWithCards = await prisma.deck.findUnique({
            where: { id: playerDeck.id },
            include: {
              cards: { include: { card: true } }
            }
          });
          
          if (deckWithCards) {
            const cards = transformDeckToCardWithCopies(deckWithCards.cards);
            decks.push({
              id: deckWithCards.id,
              name: deckWithCards.name,
              gameNumber: deckWithCards.gameNumber,
              cards: cards
            });
          }
          continue;
        }
      }

      // Create new deck with the standardized name
      const deck = await prisma.deck.create({
        data: {
          replayId: replayId,
          gameNumber: parseInt(gameNumber),
          playerId: playerId,
          name: deckName
        }
      });

      const cardIds = await prisma.card.findMany({
        where: {
          serialNumber: { in: Object.keys(player.cards) }
        }
      });
      // map serial number to card id
      const cardIdMap = cardIds.reduce((acc: { [key: string]: string }, card) => {
        acc[card.serialNumber] = card.id;
        return acc;
      }, {});

      const deckCardPromises = Object.entries(player.cards)
        .map(([serialNumber, _]) => {
          if (player.cards[serialNumber].gamesUsed[gameNumber] && deck.id && cardIdMap[serialNumber]) {
            // Ensure copiesOfCard is at least 1
            const copiesOfCard = Math.max(1, player.cards[serialNumber].gamesUsed[gameNumber].adjustedCount);
            return prisma.deckToCard.create({
              data: {
                deck: { connect: { id: deck.id } },
                card: { connect: { id: cardIdMap[serialNumber] } },
                copiesOfCard: copiesOfCard
              }
            });          
          }
          return null;
        });

      // remove null values from the array
      const filteredDeckCardPromises = deckCardPromises.filter(promise => promise !== null);
      await Promise.all(filteredDeckCardPromises);

      const deckWithCards = await prisma.deck.findUnique({
        where: {
          id: deck.id
        },
        include: {
          cards: {
            include: {
              card: true
            }
          }
        }
      });
      if (deckWithCards) {
        const cards = transformDeckToCardWithCopies(deckWithCards.cards);
        const deck: DeckWithCards = {
          id: deckWithCards.id,
          name: deckWithCards.name,
          gameNumber: deckWithCards.gameNumber,
          cards: cards
        }
        decks.push(deck);
      }
    }
    
    return decks;
  }

  
  analyzeReplayData(replayData: string): { analysis: DeckAnalysis, rpsPlay: RPSPlay | undefined } {
    const data = JSON.parse(replayData);
    if (!data) {
      throw new Error('No data found in replay');
    }
    if (data?.action == 'Error' && data?.message == 'Invalid Token') {
      throw new Error('Invalid Token');
      // retry the request
    }
    if (!data.player1 || !data.player2) {
      console.log(data);
      throw new Error('No player info found in replay');
    }
    // console.log('printing player info');
    // console.log(data.player1);
    // console.log(data.player2);
    // console.log(data);
    // console.log('printing player info end');
    let currentGame = 0;
    const lastSeenCards: { [id: number]: { serialNumber: string, name: string } } = {};
    const rpsChoices: PlayerRPSTracker = {};
    let rpsPlay: RPSPlay | undefined;
    
    const analysis: DeckAnalysis = {
      player1: {
        playerId: '',
        userId: data.player1.user_id.toString(),
        dbName: data.player1.username,
        cards: {},
        won: false
      },
      player2: {
        playerId: '',
        userId: data.player2.user_id.toString(),
        dbName: data.player2.username,
        cards: {},
        won: false
      },
      rpsChoices: {},
      lastSeenCards: {}
    };
  
    // Helper function to strip leading zeros
    const stripLeadingZeros = (serialNumber: string) => serialNumber.replace(/^0+/, '');
  
    const updateCardCount = (username: string, serialNumber: string, isReturnToDeck: boolean = false) => {
      const playerKey = username === data.player1.username ? 'player1' : 'player2';
      
      if (!analysis[playerKey].cards[serialNumber]) {
        analysis[playerKey].cards[serialNumber] = {
          gamesUsed: {}
        };
      }
      
      if (!analysis[playerKey].cards[serialNumber].gamesUsed[currentGame]) {
        analysis[playerKey].cards[serialNumber].gamesUsed[currentGame] = {
          rawCount: 0,
          adjustedCount: 0
        };
      }
      
      if (isReturnToDeck) {
        if (analysis[playerKey].cards[serialNumber].gamesUsed[currentGame].adjustedCount > 1) {
          analysis[playerKey].cards[serialNumber].gamesUsed[currentGame].adjustedCount--;
        }
      } else {
        analysis[playerKey].cards[serialNumber].gamesUsed[currentGame].rawCount++;
        analysis[playerKey].cards[serialNumber].gamesUsed[currentGame].adjustedCount++;
      }
    };
  
    for (const play of data.plays) {
      // Track cards as we see them with stripped serial numbers
      if (play.card?.serial_number) {
        lastSeenCards[play.id] = {
          serialNumber: stripLeadingZeros(play.card.serial_number),
          name: play.card.name
        };
      }
      
      if (play.play === 'To T Deck' && play.log?.public_log?.includes('Returned')) {
        const cardName = play.log.public_log.match(/Returned "([^"]+)"/)?.[1];
        
        // Find the card's serial number from our tracking
        let cardSerialNumber = '';
        for (const [, card] of Object.entries(lastSeenCards)) {
          if (card.name === cardName) {
            cardSerialNumber = card.serialNumber;
            break;
          }
        }
        
        if (cardSerialNumber) {
          updateCardCount(play.username, cardSerialNumber, true);
        }
        continue;
      }
  
      if (play.play === 'Pick first' || play.play === 'Pick second') {
        currentGame++;
        
        if (play.log && Array.isArray(play.log)) {
          for (const logEntry of play.log) {
            if (logEntry.private_log?.includes('Drew')) {
              const cardName = logEntry.private_log.match(/Drew "([^"]+)"/)?.[1];
              if (cardName && play.cards) {
                // ignore implicit any error
                // @ts-expect-error we don't care about the type of the card
                const card = play.cards.find((c) => c.name === cardName);
                if (card) {
                  updateCardCount(logEntry.username, stripLeadingZeros(card.serial_number), card.name);
                }
              }
            }
          }
        }
        continue;
      }
  
      if (play.card?.serial_number) {
        const isFromDeck = play.log?.private_log?.includes('Drew') || 
                          play.log?.private_log?.includes('Added') ||
                          play.log?.private_log?.includes('from Deck') ||
                          play.log?.private_log?.includes('excavated') ||
                          play.log?.private_log?.includes('revealed') ||
                          play.log?.private_log?.includes('banished') ||
                          play.log?.private_log?.includes('sent') ||
                          play.log?.public_log?.includes('from Deck');
        
        if (isFromDeck) {
          updateCardCount(play.username, stripLeadingZeros(play.card.serial_number), play.card.name);
        }
      }
  
      if (play.cards) {
        const isFromDeck = play.log?.private_log?.includes('from Deck') ||
                          play.log?.private_log?.includes('excavated') ||
                          play.log?.private_log?.includes('revealed') ||
                          play.log?.private_log?.includes('banished') ||
                          play.log?.private_log?.includes('sent') ||
                          play.log?.public_log?.includes('from Deck');
        
        if (isFromDeck) {
          for (const card of play.cards) {
            updateCardCount(play.username, stripLeadingZeros(card.serial_number));
          }
        }
      }
  
      if (play.play === "RPS") {
        rpsPlay = play;
        const player1Choice = play.player1_choice;
        const player2Choice = play.player2_choice;
        const winner = play.winner;
  
        // Track player1's choice
        if (!rpsChoices[play.player1]) {
          analysis.rpsChoices[play.player1] = {
            choice: player1Choice,
            opponent: play.player2,
            won: winner === play.player1
          };
        }
        analysis.rpsChoices[play.player1] = {
          choice: player1Choice,
          opponent: play.player2,
          won: winner === play.player1
        };
  
        // Track player2's choice
        if (!rpsChoices[play.player2]) {
          analysis.rpsChoices[play.player2] = {
            choice: player2Choice,
            opponent: play.player1,
            won: winner === play.player2
          };
        }
        analysis.rpsChoices[play.player2] = {
          choice: player2Choice,
          opponent: play.player1,
          won: winner === play.player2
        };
      }

      if (play.play === "Admit defeat") { 
        const loser = play.log.username;
        analysis.player1.won = loser === analysis.player2.dbName;
        analysis.player2.won = loser === analysis.player1.dbName;
      }

      // Handle Extra Deck summons and movements
      if (play.card?.serial_number) {
        const serialNumber = stripLeadingZeros(play.card.serial_number);
        const isExtraDeckCard = play.card.monster_color && 
          ['Fusion', 'Synchro', 'XYZ', 'Link'].includes(play.card.monster_color);
        
        // Handle summons from Extra Deck
        if ((play.play === 'SS ATK' || play.play === 'SS DEF')) {
          const isFromExtraDeck = play.log?.public_log?.includes('from Extra Deck');
          if (isFromExtraDeck) {
            updateCardCount(play.username, serialNumber, false);
          }
        }

        // Handle direct banish from Extra Deck or from field
        if (play.play === 'Banish') {
          const isFromExtraDeck = play.log?.public_log?.includes('from Extra Deck');
          const isFromField = play.log?.public_log?.includes('from field');
          if (isFromExtraDeck || (isExtraDeckCard && isFromField)) {
            updateCardCount(play.username, serialNumber, false);
          }
        }

        // Handle Extra Deck monster going to GY
        if (play.play === 'To GY') {
          const isFromExtraDeck = play.log?.public_log?.includes('from Extra Deck');
          const isFromField = play.log?.public_log?.includes('from field');
          // Count if it's going from Extra Deck directly or from field
          if (isFromExtraDeck || (isExtraDeckCard && isFromField)) {
            updateCardCount(play.username, serialNumber, false);
          }
        }

        // Handle returns to Extra Deck (from anywhere)
        if (play.play === 'To ED') {
          updateCardCount(play.username, serialNumber, true);
        }

        // Handle shuffling back to Extra Deck
        if (play.play === 'Shuffle' && play.log?.public_log?.includes('to Extra Deck')) {
          updateCardCount(play.username, serialNumber, true);
        }
      }
    }
    return { analysis, rpsPlay };
  }

  async getYgoCardInfo(decks: any[][]) {
    const cardIds = decks.flatMap(playerDeck => playerDeck.flatMap(deck => deck.cards.map((card: any) => card.serialNumber)));
    const ygoCardInfo = await fetchYGOCardInfo(Array.from(new Set(cardIds)));
    return ygoCardInfo;
  }
}

export const replayService = new ReplayService();