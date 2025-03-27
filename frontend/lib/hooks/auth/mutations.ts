import { useMutation } from '@apollo/client'
import { LOGIN_MUTATION, LOGOUT_MUTATION } from '@/lib/graphql/mutations/auth'
import { User } from '@/lib/contexts/auth/types'

export const useLogin = () => {
  return useMutation<{ login: User }>(LOGIN_MUTATION)
}

export const useLogout = () => {
  return useMutation<{ logout: boolean }>(LOGOUT_MUTATION)
}
