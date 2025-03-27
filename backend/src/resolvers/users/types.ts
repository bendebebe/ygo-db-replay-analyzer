import { Response as ExpressResponse } from 'express'

export interface Context {
    token?: string
    userId?: string
    res: ExpressResponse
}
  
export interface AuthInput {
    email: string
    password: string
    username: string
}
  
export interface TokenPayload {
    userId: string
    type: 'access' | 'refresh'
}
  
export interface AuthTokens {
    accessToken: string
    refreshToken: string
}
  