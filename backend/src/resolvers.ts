import { cards, card } from './resolvers/cards/queries'
import { userDecks, users, checkAuth } from "./resolvers/users/queries"
import { deck, deckReplays, decks, decksByReplay, deckUser } from "./resolvers/decks/queries"
import { session, sessionReplays, sessions, sessionByShareableId, sessionUser, sessionDetails, sessionPlayerDecks } from "./resolvers/sessions/queries"
import { replayMutations, replayQueries, replayObjectQueries } from "./resolvers/replays/index"
import { createDeck, updateDeck } from "./resolvers/decks/mutations"
import { login, logout, register, refresh } from "./resolvers/users/mutations"
import { updateSession } from "./resolvers/sessions/mutations"
import { GraphQLJSON } from 'graphql-scalars'
import { decksByPlayer } from './resolvers/decks/queries'
import { playerByPlayerId, searchPlayers } from './resolvers/players/queries'
import { deleteAllReplays, submitReplayJobs } from './resolvers/replays/mutations'
import { clearRedisCache } from './resolvers/admin/mutations'
import { DateScalar } from './lib/scalars'

export const resolvers = {
  JSON: GraphQLJSON,
  Date: DateScalar,
  Query: {
    checkAuth,
    users,
    cards,
    card,
    sessions,
    session,
    sessionDetails,
    sessionPlayerDecks,
    decks,
    deck,
    decksByReplay,
    ...replayQueries,
    userDecks,
    deckReplays,
    sessionReplays,
    playerByPlayerId,
    searchPlayers,
    sessionByShareableId
  },
  Mutation: {
    register,
    login,
    logout,
    refresh,
    createDeck,
    updateDeck,
    ...replayMutations,
    deleteAllReplays,
    updateSession,
    submitReplayJobs,
    clearRedisCache
  },
  Session: {
    user: sessionUser,
    replays: sessionReplays
  },
  Deck: {
    user: deckUser
  },
  Replay: replayObjectQueries,
  Player: {
    decks: decksByPlayer
  }
} 