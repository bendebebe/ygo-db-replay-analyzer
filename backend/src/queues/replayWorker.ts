/**
 * Replay Worker Agent Module
 * 
 * This module implements a worker agent that:
 * 1. Registers itself with the commander
 * 2. Processes jobs assigned specifically to it
 * 3. Reports its status (busy/idle) to Redis
 * 4. Sends heartbeats to detect node failures
 * 5. Handles graceful shutdown and cleanup
 */

import { replayQueue, ReplayJobData, rateLimiter } from './replayQueue';
import { replayService } from '../services/replayService';
import Bull from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { commander } from './commander';

// Constants for Redis keys - using command: namespace for better organization
const AGENT_REGISTRY_KEY = 'commander:agent:registry';
const AGENT_STATUS_PREFIX = 'commander:agent:status:';
const HEARTBEAT_INTERVAL = 10000; // 10 seconds
const PROCESSING_URLS_SET = 'commander:processing:urls';

// Agent class to handle job processing
class Agent {
  private agentId: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    // Generate a unique ID for this agent
    this.agentId = `agent_${uuidv4()}`;
    // Store agent ID in string format to ensure consistent comparison
    this.agentId = String(this.agentId);
    console.log(`[AGENT] Created with ID: "${this.agentId}", type: ${typeof this.agentId}`);
  }
  
  // Initialize the agent
  async initialize(): Promise<void> {
    console.log(`[AGENT] Starting agent ${this.agentId}...`);
    
    const client = replayQueue.client;
    if (!client) {
      console.error('[AGENT] Agent has no Redis client connection');
      throw new Error('Redis client not available');
    }
    
    console.log('[AGENT] Connected to Redis');
    
    try {
      // Register this agent
      await client.sadd(AGENT_REGISTRY_KEY, this.agentId);
      console.log(`[AGENT] Successfully registered agent ${this.agentId} in Redis`);
      
      // Set initial status as idle
      await this.updateStatus('idle');
      console.log(`[AGENT] Set initial status to idle for ${this.agentId}`);
      
      // Verify our registration
      const isRegistered = await client.sismember(AGENT_REGISTRY_KEY, this.agentId);
      console.log(`[AGENT] Registration check: Agent ${this.agentId} is ${isRegistered ? 'registered' : 'NOT registered'}`);
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Register the processor that only processes jobs assigned to this agent
      replayQueue.process(1, async (job) => {
        console.log(`[AGENT] ${this.agentId} evaluating job ${job.id}`);
        
        // Check if this job is assigned to this agent
        if (job.data.assignedTo === this.agentId) {
          return this.processReplayJob(job);
        } else {
          // Mark job as completed but skipped
          console.log(`[AGENT] Agent ${this.agentId} skipping job ${job.id} assigned to ${job.data.assignedTo}`);
          await job.moveToCompleted('skipped', true);
          return { skipped: true, assignedTo: job.data.assignedTo };
        }
      });
      
      // Set up event handlers for better logging
      replayQueue.on('completed', async (job, result) => {
        if (job.data.assignedTo === this.agentId) {
          if (!result?.skipped) {
            await this.cleanupJob(job);
          }
        }
      });
      
      replayQueue.on('failed', async (job) => {
        if (job.data.assignedTo === this.agentId) {
          await this.cleanupJob(job);
          await commander.markJobFailed(job.data.url, job.data.sessionId);
        }
      });
      
      replayQueue.on('stalled', (job) => {
        if (job.data.assignedTo === this.agentId) {
          console.warn(`[AGENT] Agent ${this.agentId} stalled job ${job.id}. URL: ${job.data.url}`);
        }
      });
      
      console.log(`[AGENT] Agent ${this.agentId} ready to process jobs`);
    } catch (error) {
      console.error(`[AGENT] Failed to initialize: ${error}`);
      throw error;
    }
  }
  
  // Update agent status in Redis
  private async updateStatus(status: 'idle' | 'busy', jobId?: string): Promise<void> {
    const client = replayQueue.client;
    if (!client) return;
    
    const statusKey = `${AGENT_STATUS_PREFIX}${this.agentId}`;
    await client.set(statusKey, JSON.stringify({
      status,
      jobId,
      lastHeartbeat: Date.now()
    }));
  }
  
  // Start sending heartbeats
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      try {
        const client = replayQueue.client;
        if (!client) {
          console.warn('[AGENT] No Redis client available for heartbeat');
          return;
        }
        
        const statusKey = `${AGENT_STATUS_PREFIX}${this.agentId}`;
        const statusData = await client.get(statusKey);
        
        if (statusData) {
          const status = JSON.parse(statusData);
          status.lastHeartbeat = Date.now();
          await client.set(statusKey, JSON.stringify(status));
          console.debug(`[AGENT] Heartbeat sent for agent ${this.agentId}`);
        } else {
          // Status key doesn't exist - recreate it
          console.warn(`[AGENT] Status key not found for agent ${this.agentId}, recreating...`);
          await this.updateStatus('idle');
        }
      } catch (error) {
        console.error(`[AGENT] Error sending heartbeat: ${error}`);
      }
    }, HEARTBEAT_INTERVAL);
  }
  
  // Stop the agent
  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    const client = replayQueue.client;
    if (client) {
      // Remove from registry and delete status
      client.srem(AGENT_REGISTRY_KEY, this.agentId).catch(console.error);
      client.del(`${AGENT_STATUS_PREFIX}${this.agentId}`).catch(console.error);
    }
  }
  
  // Process a replay job
  private async processReplayJob(job: Bull.Job<ReplayJobData>): Promise<any> {
    const { url, sessionId } = job.data;
    const workerId = `worker_${job.id.toString()}`;
    
    try {
      await this.updateStatus('busy', job.id.toString());
      await job.progress(10);
      
      // Wait for rate limiting
      await rateLimiter.waitForNextSlot(workerId);
      await job.progress(20);
      
      let retryCount = 0;
      const MAX_RETRIES = 3;
      let result;

      while (retryCount < MAX_RETRIES) {
        try {
          result = await replayService.fetchReplay(url, sessionId);
          break; // Success - exit retry loop
        } catch (error) {
          if (error.isRetryable) {
            console.log(`[AGENT] Retryable error (attempt ${retryCount + 1}/${MAX_RETRIES}): ${error.message}`);
            retryCount++;
            if (retryCount >= MAX_RETRIES) {
              throw error;
            }
            // Don't release token on retryable error, just continue
            continue;
          }
          throw error; // Non-retryable error
        }
      }

      // Only release token after successful completion or non-retryable error
      await rateLimiter.releaseRequestToken(workerId);
      await job.progress(100);
      return result;

    } catch (error) {
      // Release token if we're exiting with an error
      await rateLimiter.releaseRequestToken(workerId);
      console.error(`[AGENT] Failed to process replay: ${url}`, error);
      await commander.markJobFailed(url, sessionId);
      try {
        await this.updateStatus('idle');
      } catch (statusError) {
        console.error(`[AGENT] Failed to update status after job error: ${statusError}`);
      }
      throw error;
    }
  }

  private async cleanupJob(job: Bull.Job<ReplayJobData>): Promise<void> {
    try {
      const client = replayQueue.client;
      if (!client) return;

      // Remove from processing set
      await client.srem(PROCESSING_URLS_SET, job.data.url);
      
      // Update agent status
      await this.updateStatus('idle');
      
      console.log(`[AGENT] Cleaned up job ${job.id} for URL ${job.data.url}`);
    } catch (error) {
      console.error(`[AGENT] Error cleaning up job: ${error}`);
    }
  }
}

// This function should be the one called in src/index.ts
export function initializeWorker() {
  console.log('[WORKER] Starting worker initialization...');
  const agent = new Agent();
  agent.initialize().catch(err => {
    console.error('[WORKER] Failed to initialize agent:', err);
    process.exit(1);
  });
}

// Add this new function that's only called in API mode
export function setupQueueListeners() {
  console.log('[API] Setting up queue event listeners (WITHOUT job processing)');
  
  // Set up essential event handlers but DO NOT REGISTER A PROCESSOR
  replayQueue.on('completed', (job) => {
    console.log(`[API] Job ${job.id} completed`);
  });
  
  replayQueue.on('failed', (job, err) => {
    console.error(`[API] Job ${job.id} failed:`, err);
  });
}

// This code will run when the file is executed directly via ts-node
// Only when this file is the main module (not imported)
if (require.main === module) {
  console.log('[WORKER] Starting worker directly...');
  initializeWorker();
}