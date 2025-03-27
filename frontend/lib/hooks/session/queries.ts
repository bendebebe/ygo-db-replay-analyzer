import { useQuery, useLazyQuery } from '@apollo/client'
import { GET_SESSION, GET_SESSION_BY_SHAREABLE_ID, GET_USER_SESSIONS } from '@/lib/graphql/queries/sessions'
import { Session } from '@/lib/contexts/session/types'

export const useSessionQuery = (id?: string) => {
  return useQuery(GET_SESSION, {
    variables: { id },
    skip: !id
  })
}

export const useLazySessionQuery = () => {
  return useLazyQuery<{ session: Session }>(GET_SESSION)
}

export const useSessionByShareableIdQuery = (shareableId?: string) => {
  return useQuery(GET_SESSION_BY_SHAREABLE_ID, {
    variables: { shareableId },
    skip: !shareableId
  })
}

export const useLazySessionByShareableIdQuery = () => {
  return useLazyQuery<{ sessionByShareableId: Session }>(GET_SESSION_BY_SHAREABLE_ID)
}

export const useUserSessionsQuery = (userId?: string) => {
  return useQuery(GET_USER_SESSIONS, {
    variables: { userId },
    skip: !userId
  })
}