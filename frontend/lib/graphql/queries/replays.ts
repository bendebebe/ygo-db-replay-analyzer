import { gql } from '@apollo/client'

export const GET_REPLAY = gql`
  query GetReplay($id: ID!) {
    replay(id: $id) {
      id
      replayUrl
      sessionId
      player1Id
      player2Id
      winnerPlayerId
      userId
      createdAt
      updatedAt
      player1 {
        id
        dbName
      }
      player2 {
        id
        dbName
      }
      winner {
        id
        dbName
      }
      decks {
        id
        name
        playerId
        gameNumber
        cards {
          id
          name
          imageUrl
          serialNumber
          copies
        }
      }
      rpsChoices {
        id
        playerId
        choice
        won
      }
    }
  }
`

export const GET_SESSION_REPLAYS = gql`
  query GetSessionReplays($sessionId: ID!) {
    sessionReplays(sessionId: $sessionId) {
      id
      replayUrl
      player1Id
      player2Id
      winnerPlayerId
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
`

export const GET_PLAYER_DECK = gql`
  query GetPlayerDeck($replayId: ID!, $playerId: ID!, $gameNumber: Int!) {
    playerDeck(replayId: $replayId, playerId: $playerId, gameNumber: $gameNumber) {
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
` 