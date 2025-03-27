import Bull, { JobOptions } from 'bull';

// Job data interface
export interface ReplayJobData {
  url: string;
  sessionId?: string;
  requesterId?: string; // User ID or API key that requested the job
  priority?: number;
  timestamp: number;
  assignedTo?: string; // Agent ID that this job is assigned to
}

// Job result interface
export interface ReplayJobResult {
  jobId: string;
  status: 'completed' | 'failed';
  data?: any;
  error?: string;
}

// These options can be adjusted based on your DigitalOcean setup
const defaultJobOptions: JobOptions = {
  attempts: 3,             // Retry 3 times
  backoff: {
    type: 'exponential',
    delay: 60000            // Start with 1 minute delay
  },
  removeOnComplete: 100,   // Keep last 100 completed jobs
  removeOnFail: 100,       // Keep last 100 failed jobs
  timeout: 5 * 60 * 1000   // 5 minutes timeout
};

// Create the queue
export const replayQueue = new Bull<ReplayJobData>('replay-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  },
  defaultJobOptions
});

// Rate limiting logic
const MIN_REQUEST_INTERVAL = 15000; // Increase to 15 seconds between requests
const MAX_WAIT_TIME = 60000; // Maximum time to wait for a slot (1 minute)

// Add these constants with your other rate limiting constants
const LOGIN_RETRY_INTERVAL = 60000; // 1 minute between login retries across all workers
const LOGIN_RETRY_KEY = 'last_login_retry_time';

// Add new constants
const LOG_INTERVAL = 5000; // Only log waiting messages every 5 seconds
const REDIS_LOCK_TIMEOUT = 10000; // 10 seconds timeout for locks
const RESERVATION_KEY = 'duelingbook_request_queue'; // Key for the reservation queue

// Add these constants to your existing constants
const REQUEST_TOKEN_KEY = 'replay:request:token';

// Add Rate Limiter (Global across all workers)
export const rateLimiter = {
  // Add constants as properties for external access
  MIN_REQUEST_INTERVAL,
  MAX_WAIT_TIME,
  
  // Add a job to the reservation queue
  reserveSlot: async (jobId: string): Promise<number> => {
    try {
      const client = replayQueue.client;
      
      if (!client) {
        console.error('Redis client not available for reservations');
        return 0; // Proceed immediately if Redis isn't available
      }
      
      // Add job to ordered set with score = current timestamp
      // This creates a FIFO queue where jobs are ordered by when they requested a slot
      const now = Date.now();
      await client.zadd(RESERVATION_KEY, now, jobId.toString());
      
      // Return position in queue (0 = next in line)
      const position = await client.zrank(RESERVATION_KEY, jobId.toString());
      return position || 0;
    } catch (error) {
      console.error('Error reserving slot:', error);
      return 0; // Fail open
    }
  },
  
  // Check if this job is at the front of the queue and can proceed
  canProceed: async (jobId: string): Promise<boolean> => {
    try {
      const client = replayQueue.client;
      if (!client) return true;
      
      // Get the job at the front of the queue
      const nextInLine = await client.zrange(RESERVATION_KEY, 0, 0);
      if (!nextInLine || nextInLine.length === 0) return true;
      
      // If this job is next in line
      if (nextInLine[0] === jobId.toString()) {
        // Check if enough time has passed since last request
        const lastRequestTime = await client.get('last_request_time');
        const now = Date.now();
        
        if (!lastRequestTime || (now - parseInt(lastRequestTime)) >= MIN_REQUEST_INTERVAL) {
          // Atomically update the last request time and remove this job from queue
          const multi = client.multi();
          multi.set('last_request_time', now.toString());
          multi.zrem(RESERVATION_KEY, jobId.toString());
          await multi.exec();
          
          console.log(`[RATE_LIMITER] Job ${jobId}: Rate limiter: Granted request at ${new Date(now).toISOString()}`);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error(`[RATE_LIMITER] Job ${jobId}: Error checking if job can proceed:`, error);
      return true; // Fail open
    }
  },
  
  // Main method called by jobs
  waitForNextSlot: async (jobId?: string): Promise<void> => {
    // If no jobId is provided, generate one (for backward compatibility)
    const requestId = jobId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const workerId = `worker_${requestId}`;
    
    console.log(`[RATE_LIMITER] Job ${requestId}: Waiting for next available slot...`);
    
    // Reserve a slot in the queue first (keep existing queue logic)
    const initialPosition = await rateLimiter.reserveSlot(requestId);
    console.log(`[RATE_LIMITER] Job ${requestId}: Position ${initialPosition} in queue`);
    
    // Wait in the queue until it's our turn
    await new Promise<void>((resolve, reject) => {
      const checkQueue = async () => {
        try {
          if (await rateLimiter.canProceed(requestId)) {
            // Now that we're at the front of the queue, try to acquire the token
            const tokenAcquired = await rateLimiter.acquireRequestToken(workerId, 60000);
            
            if (!tokenAcquired) {
              console.warn(`[RATE_LIMITER] Job ${requestId}: Failed to acquire token, proceeding anyway`);
            }
            
            resolve();
          } else {
            setTimeout(checkQueue, 1000);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      checkQueue();
    });
    
    console.log(`[RATE_LIMITER] Job ${requestId}: Ready to proceed with request`);
    return;
  },
  
  // Keep existing methods for backward compatibility
  canMakeRequest: async (): Promise<boolean> => {
    try {
      const now = Date.now();
      const client = replayQueue.client;
      
      if (!client) {
        console.error('Redis client not available for rate limiting');
        return true; // Proceed without rate limiting if Redis isn't available
      }
      
      // Using Redis for distributed rate limiting with proper locking
      // Atomic operation using Redis transactions
      const result = await client
        .multi()
        .get('last_request_time')
        .exec();
      
      const lastRequestTime = result?.[0]?.[1] as string | null;
      
      // If no previous request or interval has passed
      if (!lastRequestTime || (now - parseInt(lastRequestTime)) >= MIN_REQUEST_INTERVAL) {
        // Use Redis SETNX for atomic operation to prevent race condition
        const lockKey = 'request_lock';
        const lockAcquired = await client.set(lockKey, '1', 'PX', REDIS_LOCK_TIMEOUT, 'NX');
        
        if (lockAcquired) {
          try {
            // Double-check the time after acquiring the lock
            const currentLastTime = await client.get('last_request_time');
            if (!currentLastTime || (now - parseInt(currentLastTime)) >= MIN_REQUEST_INTERVAL) {
              await client.set('last_request_time', now.toString());
              console.log(`[RATE_LIMITER] Granted request at ${new Date(now).toISOString()}`);
              return true;
            }
          } finally {
            // Always release the lock
            await client.del(lockKey);
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error in rate limiter:', error);
      return true; // Fail open to prevent blocking the queue
    }
  },
  
  // Keep the rest of the existing methods unchanged
  canRetryLogin: async (): Promise<boolean> => {
    // Existing implementation
    try {
      const now = Date.now();
      const client = replayQueue.client;
      
      if (!client) {
        console.error('Redis client not available for login retry limiting');
        return true; // Proceed without rate limiting if Redis isn't available
      }
      
      // Using Redis for distributed rate limiting of login retries with proper locking
      const result = await client
        .multi()
        .get(LOGIN_RETRY_KEY)
        .exec();
      
      const lastRetryTime = result?.[0]?.[1] as string | null;
      
      // If no previous retry or interval has passed
      if (!lastRetryTime || (now - parseInt(lastRetryTime)) >= LOGIN_RETRY_INTERVAL) {
        // Use Redis SETNX for atomic operation
        const lockKey = 'login_retry_lock';
        const lockAcquired = await client.set(lockKey, '1', 'PX', REDIS_LOCK_TIMEOUT, 'NX');
        
        if (lockAcquired) {
          try {
            // Double-check after acquiring lock
            const currentLastTime = await client.get(LOGIN_RETRY_KEY);
            if (!currentLastTime || (now - parseInt(currentLastTime)) >= LOGIN_RETRY_INTERVAL) {
              await client.set(LOGIN_RETRY_KEY, now.toString());
              console.log(`[RATE_LIMITER] Login retry: Granted retry at ${new Date(now).toISOString()}`);
              return true;
            }
          } finally {
            // Always release the lock
            await client.del(lockKey);
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error in login retry limiter:', error);
      return true; // Fail open to prevent blocking the queue
    }
  },
  
  waitForLoginRetrySlot: async (): Promise<void> => {
    // Existing implementation
    console.log('[RATE_LIMITER] Login retry: Waiting for next available retry slot...');
    const startTime = Date.now();
    let lastLogTime = 0;
    
    return new Promise((resolve, reject) => {
      const checkAndResolve = async () => {
        try {
          // Check if we've waited too long
          if (Date.now() - startTime > MAX_WAIT_TIME) {
            console.warn(`[RATE_LIMITER] Login retry: Maximum wait time exceeded (${MAX_WAIT_TIME}ms)`);
            return resolve(); // Proceed anyway after timeout
          }
          
          if (await rateLimiter.canRetryLogin()) {
            console.log('[RATE_LIMITER] Login retry: Slot acquired, proceeding with retry');
            return resolve();
          } else {
            // Only log periodically to reduce noise
            const now = Date.now();
            if (now - lastLogTime > LOG_INTERVAL) {
              const timeWaited = now - startTime;
              console.log(`[RATE_LIMITER] Login retry: Still waiting after ${timeWaited}ms...`);
              lastLogTime = now;
            }
            
            // Exponential backoff to reduce Redis load
            const backoff = Math.min(100 * Math.pow(1.5, Math.floor((Date.now() - startTime) / 1000)), 5000);
            setTimeout(checkAndResolve, backoff);
          }
        } catch (error) {
          console.error('[RATE_LIMITER] Error in waitForLoginRetrySlot:', error);
          return reject(error);
        }
      };
      
      checkAndResolve();
    });
  },
  
  // Keep existing utility methods
  acquireLock: async (lockName: string, ttlMs = REDIS_LOCK_TIMEOUT): Promise<boolean> => {
    const client = replayQueue.client;
    if (!client) {
      console.error(`[RATE_LIMITER] Redis client not available for locking: ${lockName}`);
      return true; // Proceed without locking if Redis isn't available
    }
    
    const lockKey = `lock:${lockName}`;
    const lockValue = Date.now().toString();
    
    const acquired = await client.set(lockKey, lockValue, 'PX', ttlMs, 'NX');
    return !!acquired;
  },
  
  releaseLock: async (lockName: string): Promise<void> => {
    const client = replayQueue.client;
    if (client) {
      const lockKey = `lock:${lockName}`;
      await client.del(lockKey);
    }
  },
  
  // Acquire the token with timeout and retries
  acquireRequestToken: async (workerId: string, timeout = 30000): Promise<boolean> => {
    const startTime = Date.now();
    let acquired = false;
    
    console.log(`[RATE_LIMITER] Worker ${workerId}: Attempting to acquire request token`);
    
    while (!acquired && Date.now() - startTime < timeout) {
      try {
        const client = replayQueue.client;
        if (!client) {
          console.error('[RATE_LIMITER] Redis client not available for token acquisition');
          return true; // Proceed without token if Redis isn't available
        }
        
        // Fix: Use the correct signature for ioredis
        // For ioredis, use this form: client.set(key, value, 'EX', seconds, 'NX')
        const result = await client.set(REQUEST_TOKEN_KEY, workerId, 'EX', 30, 'NX');
        acquired = result === 'OK'; // ioredis returns 'OK' on success, null on failure
        
        if (acquired) {
          console.log(`[RATE_LIMITER] Worker ${workerId}: Successfully acquired request token`);
          return true;
        }
        
        // Wait a short time before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`[RATE_LIMITER] Error acquiring token:`, error);
        return true; // Fail open on errors
      }
    }
    
    console.warn(`[RATE_LIMITER] Worker ${workerId}: Failed to acquire token after ${timeout}ms`);
    return false;
  },
  
  // Release the token with delay
  releaseRequestToken: async (workerId: string): Promise<void> => {
    try {
      const client = replayQueue.client;
      if (!client) {
        console.error('[RATE_LIMITER] Redis client not available for token release');
        return;
      }
      
      // Check if this worker owns the token
      const currentOwner = await client.get(REQUEST_TOKEN_KEY);
      if (currentOwner !== workerId) {
        console.warn(`[RATE_LIMITER] Worker ${workerId} attempted to release token owned by ${currentOwner}`);
        return;
      }
      
      // Delete the token and schedule a delay before next worker can acquire it
      await client.del(REQUEST_TOKEN_KEY);
      console.log(`[RATE_LIMITER] Worker ${workerId} released request token`);
      
      // Reduce delay from 5 seconds to 1 second for login retries
      setTimeout(async () => {
        try {
          await client.del(`${REQUEST_TOKEN_KEY}:delay`);
        } catch (error) {
          console.error('[RATE_LIMITER] Error removing delay flag:', error);
        }
      }, 1000); // Changed from 5000 to 1000ms
      
    } catch (error) {
      console.error(`[RATE_LIMITER] Error releasing token:`, error);
      // Try again one more time
      try {
        const client = replayQueue.client;
        if (client) {
          await client.del(REQUEST_TOKEN_KEY);
        }
      } catch (retryError) {
        console.error(`[RATE_LIMITER] Failed to release token on retry:`, retryError);
      }
    }
  },
};