import { gql } from '@apollo/client'

export const CREATE_PLAYER = gql`
  mutation CreatePlayer($input: PlayerInput!) {
    createPlayer(input: $input) {
      id
      dbName
      name
      country
      race
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_PLAYER = gql`
  mutation UpdatePlayer($id: ID!, $input: PlayerInput!) {
    updatePlayer(id: $id, input: $input) {
      id
      dbName
      name
      country
      race
      createdAt
      updatedAt
    }
  }
` 