import { gql } from '@apollo/client'

export const CREATE_SESSION = gql`
  mutation CreateSession($urls: [String!]!) {
    createSession(urls: $urls) {
      id
      userId
      isPublic
      shareableId
      createdAt
      updatedAt
      replays {
        id
        replayUrl
      }
    }
  }
`

export const UPDATE_SESSION = gql`
  mutation UpdateSession($id: ID!, $isPublic: Boolean!) {
    updateSession(id: $id, isPublic: $isPublic) {
      id
      userId
      isPublic
      shareableId
      createdAt
      updatedAt
    }
  }
`

export const ATTACH_USER_TO_SESSION = gql`
  mutation AttachUserToSession($sessionId: ID!) {
    attachUserToSession(sessionId: $sessionId) {
      id
      userId
      isPublic
      shareableId
      createdAt
      updatedAt
    }
  }
`