import { makeExecutableSchema } from '@graphql-tools/schema'
import { resolvers } from './resolvers'

const typeDefs = /* GraphQL */ `
  scalar Date

  type User {
    id: ID!
    email: String!
    username: String!
    createdAt: String!
    updatedAt: String!
    sessions: [Session!]!
    decks: [Deck!]!
    replays: [Replay!]!
  }

  type Player {
    id: ID!
    playerId: String!
    dbName: String!
    replays1: [Replay!]!
    replays2: [Replay!]!
    wonReplays: [Replay!]!
    rpsChoices: [RpsChoice!]!
    createdAt: String!
    updatedAt: String!
    decks: [Deck!]!
  }

  type Session {
    id: ID!
    userId: String
    user: User
    replays: [Replay!]!
    replayCount: Int
    isPublic: Boolean!
    shareableId: String
    createdAt: String!
    updatedAt: String!
  }

  type Replay {
    id: ID!
    replayUrl: String!
    sessionId: String!
    player1Id: String!
    player2Id: String!
    winnerPlayerId: String
    session: Session!
    player1: Player!
    player2: Player!
    winner: Player
    userId: String
    user: User
    decks: [Deck!]!
    rpsChoices: [RpsChoice!]!
    createdAt: String!
    updatedAt: String!
  }

  type Deck {
    id: ID!
    name: String!
    gameNumber: Int!
    replayId: String!
    playerId: String!
    userId: String
    user: User
    replay: Replay!
    cards: [CardWithCopies!]!
    player: Player!
    createdAt: String!
    updatedAt: String!
  }

  type CardWithCopies {
    name: String!
    imageUrl: String!
    serialNumber: String!
    ygoInfo: YGOCardInfo
    copies: Int!
  }

  type RpsChoice {
    id: ID!
    playerId: String!
    replayId: String!
    choice: String!
    won: Boolean!
    player: Player!
    replay: Replay!
    createdAt: String!
    updatedAt: String!
  }

  type Card {
    name: String!
    imageUrl: String!
    serialNumber: String!
    ygoInfo: YGOCardInfo
  }

  type PaginatedSessions {
    nodes: [Session!]!
    totalCount: Int!
  }

  type PaginatedPlayers {
    nodes: [Player!]!
    totalCount: Int!
  }

  type PaginatedReplays {
    nodes: [Replay!]!
    totalCount: Int!
  }

  type ReplaySessionPlayer {
    id: ID!
    dbName: String!
    rpsData: RpsData
    decks: [ReplayDeck!]!
  }

  type RpsData {
    playerId: String!
    choice: String!
    won: Boolean!
  }

  type ReplayDeck {
    id: ID!
    name: String!
    gameNumber: Int!
    playerId: String!
    cards: [ReplayCard!]!
  }

  type ReplayCard {
    serialNumber: String!
    name: String!
    imageUrl: String!
    copies: Int!
    ygoInfo: YGOCardInfo
  }

  type ReplayAnalysis {
    id: ID!
    replayUrl: String!
    player1: ReplaySessionPlayer!
    player2: ReplaySessionPlayer!
  }

  type SessionDetails {
    id: ID!
    userId: String
    user: User
    isPublic: Boolean!
    shareableId: String
    createdAt: Date!
    updatedAt: Date!
    replayAnalysis: [ReplayAnalysis!]!
  }

  type Query {
    me: User
    checkAuth: User
    users(skip: Int, take: Int): [User!]!
    cards(serialNumbers: [String!], skip: Int, take: Int): [Card!]!
    card(id: ID!): Card
    sessions(skip: Int, take: Int, sortBy: String, sortOrder: String): PaginatedSessions!
    session(id: ID!): Session
    sessionDetails(id: ID!): SessionDetails
    decks(skip: Int, take: Int, sortBy: String, sortOrder: String): [Deck!]!
    deck(id: ID!): Deck
    userDecks(userId: ID!, skip: Int, take: Int): [Deck!]!
    replays(skip: Int, take: Int, sortBy: String, sortOrder: String): PaginatedReplays!
    replay(id: ID!): Replay
    sessionReplays(sessionId: ID!, skip: Int, take: Int): [Replay!]!
    deckReplays(deckId: ID!, skip: Int, take: Int): [Replay!]!
    decksByReplay(replayId: ID!, skip: Int, take: Int): [Deck!]!
    player(id: ID!): Player
    replayByUrl(url: String!): Replay
    playerByPlayerId(playerId: String!): Player
    searchPlayers(dbName: String!, skip: Int!, take: Int!): SearchPlayersResult!
    sessionByShareableId(shareableId: String!): Session
    players(skip: Int, take: Int, sortBy: String, sortOrder: String): PaginatedPlayers!
    getJobStatus(id: ID!): Job
    getJobsStatus(ids: [ID!]!): [Job!]!
    getQueueStats: QueueStats!
    sessionPlayerDecks(sessionId: ID!, playerDbName: String!): [ReplayAnalysis!]!
  }

  type Mutation {
    createCard(name: String!, imageUrl: String!): Card!
    createSession(urls: [String!]!): Session!
    createDeck(name: String!, userId: String!): Deck!
    addCardToDeck(deckId: ID!, cardId: ID!): Deck!
    updateDeck(id: ID!, name: String, gameNumber: Int, cardIds: [String!]): Deck!
    createReplay(
      replayUrl: String!
      sessionId: String!
      player1Id: String!
      player2Id: String!
      winnerPlayerId: String
      rpsChoices: [RpsChoiceInput!]
      decks: [DeckInput!]
    ): Replay!
    login(email: String!, password: String!): AuthResponse!
    register(email: String!, password: String!, username: String!): AuthResponse!
    refresh: Boolean!
    logout: Boolean!
    fetchReplayData(urls: [String!]!): [ReplayResponse!]!
    attachUserToSession(sessionId: ID!): Session!
    updateSession(id: ID!, isPublic: Boolean!): Session!
    deleteSession(id: ID!): Session!
    deleteReplay(id: ID!): Replay!
    deletePlayer(id: ID!): Player!
    deleteDeck(id: ID!): Deck!
    submitReplayJobs(urls: [String!]!, sessionId: String): [ID!]!
    submitReplayJobsForced(urls: [String!]!, sessionId: String): [ID!]!
    deleteAllReplays: DeleteAllReplaysResponse!
    clearRedisCache: CacheOperationResult!
  }

  type AuthResponse {
    id: ID!
    email: String!
    username: String!
    token: String!
  }

  type ReplayResponse {
    url: String!
    player1: PlayerData!
    player2: PlayerData!
    error: String
    performance: JSON
  }

  type RpsChoiceData {
    playerId: ID!
    choice: String!
    won: Boolean!
  }

  type PlayerData {
    dbName: String!
    rpsData: RpsChoiceData!
    decks: [Deck!]!
  }

  type YGOCard {
    serialNumber: String!
    name: String!
    type: String!
    desc: String!
    atk: Int
    def: Int
    level: Int
    race: String!
    attribute: String
    archetype: String
    scale: Int
    linkval: Int
    linkmarkers: [String]
    card_sets: [CardSet]
    card_images: [CardImage]!
    card_prices: [CardPrice]!
    frameType: String!
    isExtraDeck: Boolean!
  }

  input CreateDeckInput {
    name: String!
    gameNumber: Int!
    replayId: String!
    cardIds: [String!]!
  }

  input UpdateDeckInput {
    id: ID!
    name: String
    gameNumber: Int
    cardIds: [String!]
  }

  type YGOCardInfo {
    id: String!
    name: String!
    type: String!
    desc: String
    atk: Int
    def: Int
    level: Int
    race: String
    attribute: String
    archetype: String
    scale: Int
    linkval: Int
    linkmarkers: [String]
    card_sets: [CardSet]
    card_images: [CardImage]
    card_prices: [CardPrice]
    frameType: String!
    isExtraDeck: Boolean!
  }

  type CardSet {
    set_name: String!
    set_code: String
    set_rarity: String
    set_price: String
  }

  type CardImage {
    id: Int!
    image_url: String!
    image_url_small: String!
  }

  type CardPrice {
    cardmarket_price: String
    tcgplayer_price: String
    ebay_price: String
    amazon_price: String
    coolstuff_price: String
  }

  input RpsChoiceInput {
    playerId: String!
    choice: String!
    won: Boolean!
  }

  input DeckInput {
    name: String!
    gameNumber: Int!
    cards: [DeckCardInput!]!
  }

  input DeckCardInput {
    cardId: String!
    copiesOfCard: Int!
  }

  type SearchPlayersResult {
    players: [Player!]!
    totalCount: Int!
  }

  scalar JSON

  type Job {
    id: ID!
    status: String!
    progress: Float
    result: ReplayResponse
    error: String
  }

  type QueueStats {
    waiting: Int!
    active: Int!
    completed: Int!
    failed: Int!
    delayed: Int!
    total: Int!
  }

  type DeleteAllReplaysResponse {
    success: Boolean!
    message: String!
    count: Int!
  }

  type CacheOperationResult {
    success: Boolean!
    message: String!
  }
`

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
}) 