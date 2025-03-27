import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client'
//import { onError } from '@apollo/client/link/error'
import { RetryLink } from '@apollo/client/link/retry'

// const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
//   if (graphQLErrors) {
//     for (const err of graphQLErrors) {
//       console.error('GraphQL Error:', {
//         message: err.message,
//         path: err.path,
//         operation: operation.operationName,
//         variables: operation.variables,
//       })
      
//       // Don't try to handle auth errors here - let them propagate to the components
//     }
//   }
  
//   if (networkError) {
//     console.error('Network error:', networkError)
//   }
  
//   return forward(operation)
// })

const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: 3000,
    jitter: true
  },
  attempts: {
    max: 3,
    retryIf: (error) => !!error && !error.message.includes('Authentication required')
  }
})

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
  credentials: 'include'
})

export const client = new ApolloClient({
  link: from([retryLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
}) 