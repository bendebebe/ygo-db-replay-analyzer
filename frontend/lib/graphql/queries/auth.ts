import { gql } from '@apollo/client'

export const CHECK_AUTH_QUERY = gql`
  query CheckAuth {
    checkAuth {
      id
      email
      username
    }
  }
` 