import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import express from 'express';
import { replayQueue } from './replayQueue';

export const setupBullBoard = (app: express.Application) => {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullAdapter(replayQueue)],
    serverAdapter
  });

  // Only add authentication in production
  if (process.env.NODE_ENV === 'production') {
    app.use('/admin/queues', (req, res, next) => {
      const auth = req.headers.authorization;
      
      if (!auth) {
        res.setHeader('WWW-Authenticate', 'Basic');
        return res.status(401).send('Authentication required');
      }
      
      // Basic parsing of Authorization header
      const [username, password] = Buffer.from(auth.split(' ')[1], 'base64')
        .toString()
        .split(':');
        
      // Use environment variables for credentials
      const validUser = process.env.ADMIN_USER || 'admin';
      const validPass = process.env.ADMIN_PASSWORD || 'admin';
      
      if (username === validUser && password === validPass) {
        return next();
      }
      
      res.setHeader('WWW-Authenticate', 'Basic');
      return res.status(401).send('Authentication failed');
    }, serverAdapter.getRouter());
  } else {
    // In development, no auth required
    app.use('/admin/queues', serverAdapter.getRouter());
  }
  
  console.log('[SERVER] Bull Board UI set up at /admin/queues');
};