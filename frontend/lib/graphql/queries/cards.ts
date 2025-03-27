import { gql } from '@apollo/client'

export const GET_CARDS = gql`
  query GetCards($serialNumbers: [String!]!) {
    cards(serialNumbers: $serialNumbers) {
      edges {
        node {
          serialNumber
          name
          imageUrl
          ygoInfo {
            id
            name
            type
            desc
            atk
            def
            level
            race
            attribute
            archetype
            scale
            linkval
            linkmarkers
            frameType
            isExtraDeck
          }
        }
      }
    }
  }
` 