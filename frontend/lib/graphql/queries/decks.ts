import { gql } from '@apollo/client'

export const GET_USER_DECKS = gql`
  query GetUserDecks($userId: ID!) {
    userDecks(userId: $userId) {
      id
      name
      gameNumber
      userId
      cards {
        id
        name
        imageUrl
        serialNumber
        copies
      }
      createdAt
      updatedAt
    }
  }
` 