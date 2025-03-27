import { gql } from '@apollo/client';

export const FETCH_REPLAY_DATA = gql`
  mutation FetchReplayData($urls: [String!]!) {
    fetchReplayData(urls: $urls) {
      url
      player1 {
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
            copies
            serialNumber
            imageUrl
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
            copies
            serialNumber
            imageUrl
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
      error
    }
  }
`;

export const SUBMIT_REPLAY_JOBS = gql`
  mutation SubmitReplayJobs($urls: [String!]!) {
    submitReplayJobs(urls: $urls)
  }
`; 