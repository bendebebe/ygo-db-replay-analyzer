import { gql } from '@apollo/client'

export const CREATE_DECK = gql`
  mutation CreateDeck($name: String!, $gameNumber: Int!, $cards: [DeckCardInput!]!) {
    createDeck(name: $name, gameNumber: $gameNumber, cards: $cards) {
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

export const UPDATE_DECK = gql`
  mutation UpdateDeck($id: ID!, $name: String!, $cards: [DeckCardInput!]!) {
    updateDeck(id: $id, name: $name, cards: $cards) {
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