import { useLazyQuery } from '@apollo/client'
import { CHECK_AUTH_QUERY } from '@/lib/graphql/queries/auth'
import { User } from '@/lib/contexts/auth/types'

export const useCheckAuth = () => {
  return useLazyQuery<{ checkAuth: User }>(CHECK_AUTH_QUERY, {
    fetchPolicy: 'network-only'
  })
}
