import jwt from 'jsonwebtoken'
import { TokenPayload, AuthTokens } from '../resolvers/users/types'
import { prisma } from '../lib/prisma'

if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets must be defined')
}

export const generateTokens = async (userId: string): Promise<AuthTokens> => {
  // Clean up expired tokens first
  await prisma.refreshToken.deleteMany({
    where: {
      userId: userId,
      expiresAt: {
        lt: new Date()
      }
    }
  })

  const accessToken = jwt.sign(
    { userId, type: 'access' } as TokenPayload,
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: '15m' }
  )

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' } as TokenPayload,
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  )

  // Store the new refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  })

  return { accessToken, refreshToken }
}

export const verifyToken = (token: string, type: 'access' | 'refresh'): TokenPayload => {
  const secret = type === 'access' 
    ? process.env.JWT_ACCESS_SECRET! 
    : process.env.JWT_REFRESH_SECRET!
  
  try {
    return jwt.verify(token, secret) as TokenPayload
  } catch (error) {
    throw new Error('Invalid token')
  }
}

export const refreshTokens = async (oldRefreshToken: string): Promise<AuthTokens> => {
  // Verify the old refresh token
  const payload = verifyToken(oldRefreshToken, 'refresh')
  
  // Delete the old refresh token
  await prisma.refreshToken.delete({
    where: { token: oldRefreshToken }
  })
  
  // Generate new tokens
  return generateTokens(payload.userId)
} 