import { useMutation } from '@apollo/client'
import { CREATE_SESSION, UPDATE_SESSION, ATTACH_USER_TO_SESSION } from '@/lib/graphql/mutations/sessions'
import { Session } from '@/lib/contexts/session/types'

export const useCreateSession = () => {
  return useMutation<{ createSession: Session }>(CREATE_SESSION)
}

export const useUpdateSession = () => {
  return useMutation<{ updateSession: Session }>(UPDATE_SESSION)
}

export const useAttachUserToSession = () => {
  return useMutation<{ attachUserToSession: Session }>(ATTACH_USER_TO_SESSION)
}