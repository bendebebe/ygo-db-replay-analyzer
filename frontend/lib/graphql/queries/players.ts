import { gql } from '@apollo/client';

export const GET_PLAYER_PROFILE = gql`
  query GetPlayerProfile($playerId: String!) {
    playerByPlayerId(playerId: $playerId) {
      id
      playerId
      dbName
      replays1 {
        id
        replayUrl
      }
      replays2 {
        id
        replayUrl
      }
      wonReplays {
        id
        replayUrl
      }
      rpsChoices {
        id
        choice
        won
        createdAt
      }
    }
  }
`;

export const SEARCH_PLAYERS = gql`
  query SearchPlayers($dbName: String!, $skip: Int!, $take: Int!) {
    searchPlayers(dbName: $dbName, skip: $skip, take: $take) {
      players {
        id
        playerId
        dbName
        replays1 {
          id
        }
        replays2 {
          id
        }
        wonReplays {
          id
        }
        rpsChoices {
          id
          playerId
          replayId
          choice
          won
          createdAt
          updatedAt
        }
        decks {
          id
        }
        createdAt
        updatedAt
      }
      totalCount
    }
  }
`;

export const GET_PLAYER_BY_PLAYER_ID = gql`
  query GetPlayerByPlayerId($playerId: String!) {
    playerByPlayerId(playerId: $playerId) {
      id
      playerId
      dbName
      replays1 {
        id
      }
      replays2 {
        id
      }
      wonReplays {
        id
      }
      rpsChoices {
        id
        playerId
        replayId
        choice
        won
        createdAt
        updatedAt
      }
      decks {
        id
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_PLAYER = gql`
  query GetPlayer($id: ID!) {
    player(id: $id) {
      id
      dbName
      name
      country
      race
      createdAt
      updatedAt
    }
  }
`;

export const GET_PLAYERS = gql`
  query GetPlayers {
    players {
      id
      dbName
      name
      country
      race
      createdAt
      updatedAt
    }
  }
`; 