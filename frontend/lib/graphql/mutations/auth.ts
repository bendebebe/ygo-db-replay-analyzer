import { gql } from '@apollo/client'

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      id
      email
      username
      token
    }
  }
`

export const REGISTER_MUTATION = gql`
  mutation Register($email: String!, $password: String!, $username: String!) {
    register(email: $email, password: $password, username: $username) {
      id
      email
      username
      token
    }
  }
`

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
` 