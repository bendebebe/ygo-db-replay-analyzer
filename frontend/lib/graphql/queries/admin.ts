import { gql } from "@apollo/client"

export const GET_ADMIN_SESSIONS = gql`
  query GetAdminSessions($skip: Int, $take: Int, $sortBy: String, $sortOrder: String) {
    sessions(skip: $skip, take: $take, sortBy: $sortBy, sortOrder: $sortOrder) {
      nodes {
        id
        userId
        isPublic
        shareableId
        createdAt
        replayCount
      }
      totalCount
    }
  }
`

export const GET_ADMIN_REPLAYS = gql`
  query GetAdminReplays($skip: Int, $take: Int, $sortBy: String, $sortOrder: String) {
    replays(skip: $skip, take: $take, sortBy: $sortBy, sortOrder: $sortOrder) {
      nodes {
        id
        replayUrl
        createdAt
        player1 {
          dbName
          rpsChoices {
            won
          }
          decks {
            id
            name
            gameNumber
            cards {
              name
              imageUrl
              serialNumber
              copies
            }
          }
        }
        player2 {
          dbName
          rpsChoices {
            won
          }
          decks {
            id
            name
            gameNumber
            cards {
              name
              imageUrl
              serialNumber
              copies
            }
          }
        }
      }
      totalCount
    }
  }
`

export const GET_ADMIN_PLAYERS = gql`
  query GetAdminPlayers($skip: Int, $take: Int, $sortBy: String, $sortOrder: String) {
    players(skip: $skip, take: $take, sortBy: $sortBy, sortOrder: $sortOrder) {
      nodes {
        id
        dbName
        createdAt
        replays {
          id
          replayUrl
          player1 {
            dbName
            rpsChoices {
              won
            }
            decks {
              game
              cards
            }
          }
          player2 {
            dbName
            rpsChoices {
              won
            }
            decks {
              game
              cards
            }
          }
        }
      }
      totalCount
    }
  }
`

export const GET_ADMIN_DECKS = gql`
  query GetAdminDecks($skip: Int, $take: Int, $sortBy: String, $sortOrder: String) {
    decks(skip: $skip, take: $take, sortBy: $sortBy, sortOrder: $sortOrder) {
      id
      game
      cards
      createdAt
      replays {
        id
        replayUrl
        player1 {
          dbName
          decks {
            game
            cards
          }
        }
        player2 {
          dbName
          decks {
            game
            cards
          }
        }
      }
    }
  }
`

export const DELETE_SESSION = gql`
  mutation DeleteSession($id: ID!) {
    deleteSession(id: $id) {
      id
    }
  }
`

export const DELETE_REPLAY = gql`
  mutation DeleteReplay($id: ID!) {
    deleteReplay(id: $id) {
      id
    }
  }
`

export const DELETE_PLAYER = gql`
  mutation DeletePlayer($id: ID!) {
    deletePlayer(id: $id) {
      id
    }
  }
`

export const DELETE_DECK = gql`
  mutation DeleteDeck($id: ID!) {
    deleteDeck(id: $id) {
      id
    }
  }
` 