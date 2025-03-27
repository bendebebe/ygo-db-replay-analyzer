import { verifyToken } from '../services/auth'
import { Request, Response, NextFunction } from 'express'

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.cookies.accessToken
  
  if (!accessToken) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const payload = verifyToken(accessToken, 'access')
    // Add user info to request
    req.userId = payload.userId
    return next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
} 