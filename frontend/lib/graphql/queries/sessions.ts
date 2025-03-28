import { gql } from "@apollo/client"

export const GET_USER_SESSIONS = gql`
  query GetUserSessions($userId: String!) {
    sessions(userId: $userId) {
      id
      userId
      isPublic
      shareableId
      createdAt
      replayCount
    }
  }
`

// get a single session and all associated fields
export const GET_SESSION = gql`
    query GetSession($id: ID!) {
        session(id: $id) {
            id
            userId
            isPublic
            shareableId
            createdAt
            updatedAt
            replays {
                id
                replayUrl
                player1 {
                    id
                    dbName
                    rpsChoices {
                        won
                    }
                }
                player2 {
                    id
                    dbName
                    rpsChoices {
                        won
                    }
                }
            }
        }
    }
`

export const GET_SESSION_BY_SHAREABLE_ID = gql`
  query GetSessionByShareableId($shareableId: String!) {
    sessionByShareableId(shareableId: $shareableId) {
      id
      userId
      isPublic
      shareableId
      createdAt
      updatedAt
      replays {
        id
        replayUrl
        player1 {
          id
          dbName
        }
        player2 {
          id
          dbName
        }
      }
    }
  }
`

export const GET_SESSION_DETAILS = gql`
  query GetSessionDetails($id: ID!) {
    sessionDetails(id: $id) {
      id
      userId
      isPublic
      shareableId
      createdAt
      updatedAt
      replayAnalysis {
        id
        replayUrl
        createdAt
        dbCreatedAt
        player1 {
          id
          dbName
          rpsData {
            playerId
            choice
            won
          }
          decks {
            id
            name
            gameNumber
            cards {
              serialNumber
              name
              imageUrl
              copies
              ygoInfo {
                name
                type
                desc
                isExtraDeck
                card_images {
                  image_url
                }
              }
            }
          }
        }
        player2 {
          id
          dbName
          rpsData {
            playerId
            choice
            won
          }
          decks {
            id
            name
            gameNumber
            cards {
              serialNumber
              name
              imageUrl
              copies
              ygoInfo {
                name
                type
                desc
                isExtraDeck
                card_images {
                  image_url
                }
              }
            }
          }
        }
      }
    }
  }
`

export const GET_SESSION_PLAYER_DECKS = gql`
  query GetSessionPlayerDecks($sessionId: ID!, $playerDbName: String!) {
    sessionPlayerDecks(sessionId: $sessionId, playerDbName: $playerDbName) {
      id
      replayUrl
      player1 {
        id
        dbName
        rpsData {
          playerId
          choice
          won
        }
        decks {
          id
          name
          gameNumber
          cards {
            serialNumber
            name
            imageUrl
            copies
            ygoInfo {
              name
              type
              desc
              isExtraDeck
              card_images {
                image_url
              }
            }
          }
        }
      }
    }
  }
`;
