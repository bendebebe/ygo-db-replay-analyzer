import 'dotenv/config'
import express from 'express'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import http from 'http'
import cors from 'cors'
import { json } from 'body-parser'
import { schema } from './schema'
import { startCardSync } from './services/cardSync'
import cookieParser from 'cookie-parser'
import { verifyToken } from './services/auth'
import { initializeWorker, setupQueueListeners } from './queues/replayWorker'
import { setupBullBoard } from './queues/bullBoard'
import { commander } from './queues/commander'

if (process.env.NODE_ENV === 'worker') {
  initializeWorker();
} else {
  const app = express()

  setupBullBoard(app);

  setupQueueListeners();

  app.use(cookieParser(undefined, {
    decode: (val) => {
      return val
    }
  }))

  const httpServer = http.createServer(app)

  const server = new ApolloServer({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  })

  async function startApolloServer() {
    await server.start()

    app.use(
      '/graphql',
      cors<cors.CorsRequest>({
        origin: ['http://localhost:3000'],
        credentials: true,
      }),
      json(),
      expressMiddleware(server, {
        context: async ({ req, res }) => {
          // TODO: Temporarly skip auth for login/register for testing
          const operation = req.body.operationName?.toLowerCase()
          if (operation === 'login' || operation === 'register') {
            return { res }
          }

          const accessToken = req.cookies.accessToken
          if (!accessToken) {
            return { userId: null, res }
          }
          
          try {
            const payload = verifyToken(accessToken, 'access')
            return {
              userId: payload.userId,
              token: req.cookies.refreshToken,
              accessToken,
              res
            }
          } catch (error) {
            // Return null userId instead of throwing
            return { userId: null, res }
          }
        },
      })
    )

    const port = process.env.PORT ? parseInt(process.env.PORT) : 4000
    const host = process.env.HOST || '0.0.0.0'

    await new Promise<void>((resolve) => httpServer.listen({ port, host }, resolve))
    console.log(`[SERVER] Server ready at http://localhost:${port}/graphql`)
    
    // Start the card sync service
    startCardSync()
    
    // Initialize the commander
    await commander.initialize()
  }

  startApolloServer().catch(console.error) 
}
