import { prisma } from "../../lib/prisma"
import bcrypt from "bcrypt"
import { AuthInput, Context } from "./types"
import { generateTokens, refreshTokens } from "../../services/auth"

export const login = async (_: any, { email, password }: AuthInput, { res }: Context) => {
  
  const user = await prisma.user.findUnique({ where: { email } })
  
  if (!user) throw new Error("Invalid credentials")

  const isPasswordValid = await bcrypt.compare(password, user.hashedPassword)
  
  if (!isPasswordValid) throw new Error("Invalid credentials")

  const { accessToken, refreshToken } = await generateTokens(user.id)

  // Set cookies and log
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000
  })

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    token: accessToken // Keep for backward compatibility
  }
}

export const refresh = async (_: any, __: any, { res, token }: Context) => {
  if (!token) throw new Error('Refresh token required')
  
  const { accessToken, refreshToken } = await refreshTokens(token)
  
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000
  })

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  })

  return true
}

export const logout = async (_: any, __: any, { res, token }: Context) => {
  if (token) {
    await prisma.refreshToken.delete({
      where: { token }
    })
  }
  
  res.clearCookie('accessToken')
  res.clearCookie('refreshToken')
  return true
}

export const register = async (_: any, { email, password, username }: AuthInput, { res }: Context) => {
  // Check if email exists
  const existingUserByEmail = await prisma.user.findUnique({ where: { email } })
  if (existingUserByEmail) throw new Error("Email already registered")

  // Check if username exists
  const existingUserByUsername = await prisma.user.findUnique({ where: { username } })
  if (existingUserByUsername) throw new Error("Username already taken")

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      hashedPassword,
      username
    }
  })

  // Generate tokens
  const { accessToken, refreshToken } = await generateTokens(user.id)

  // Set cookies
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000 // 15 minutes
  })

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    token: accessToken // Keep for backward compatibility
  }
}