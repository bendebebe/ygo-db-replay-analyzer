import { replayQueue, ReplayJobData, rateLimiter } from './replayQueue';
import { v4 as uuidv4 } from 'uuid';

/**
 * Commander Module
 * 
 * This module implements a centralized job coordinator that:
 * 1. Tracks available agents across all worker nodes
 * 2. Maintains a priority queue of pending jobs
 * 3. Assigns jobs to available agents based on priority
 * 4. Enforces rate limiting between job executions
 * 5. Provides resilience against node failures
 */

// Constants for Redis keys - using command: namespace for better organization
const AGENT_REGISTRY_KEY = 'commander:agent:registry';
const AGENT_STATUS_PREFIX = 'commander:agent:status:';
const PENDING_JOBS_KEY = 'commander:url:pending';
const ASSIGNED_JOBS_PREFIX = 'commander:job:assigned:';
const LAST_PROCESSED_KEY = 'commander:url:last_processed';
const COMMANDER_LOCK_KEY = 'lock:commander';
const COMMANDER_CHECK_INTERVAL = 5000; // 5 seconds
const AGENT_HEARTBEAT_TIMEOUT = 30000; // 30 seconds
const PROCESSING_URLS_SET = 'commander:urls:processing';

// Interface for pending job
interface PendingJob {
  id: string;
  url: string;
  sessionId?: string;
  priority: number;
  timestamp: number;
}

// Commander class to manage job assignments
class Commander {
  private isRunning: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;

  // Initialize the commander
  async initialize(): Promise<void> {
    console.log('[COMMANDER] Initializing commander...');
    
    const client = replayQueue.client;
    if (!client) {
      console.error('[COMMANDER] Commander has no Redis client connection');
      return;
    }
    
    console.log('[COMMANDER] Connected to Redis');
    
    // Start the periodic check for pending jobs
    this.startJobAssignment();
    
    // Set up event handlers for job completion
    replayQueue.on('completed', async (job) => {
      await this.handleJobCompletion(job.id.toString());
    });
    
    replayQueue.on('failed', async (job) => {
      await this.handleJobCompletion(job.id.toString());
    });
    
    console.log('[COMMANDER] Ready to assign jobs');
    
    // Setup cleanup for stuck jobs
    this.setupStuckJobsCleanup();
  }
  
  // Start the job assignment process
  private startJobAssignment(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.checkInterval = setInterval(() => {
      this.assignPendingJobs().catch(err => {
        console.error('Error in job assignment:', err);
      });
    }, COMMANDER_CHECK_INTERVAL);
  }
  
  // Stop the job assignment process
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
  }
  
  // Add a job to the pending queue
  async addPendingJob(url: string, sessionId?: string, priority = 0): Promise<string> {
    const client = replayQueue.client;
    if (!client) {
      throw new Error('Redis client not available');
    }
    
    const id = uuidv4();
    const pendingJob: PendingJob = {
      id,
      url,
      sessionId,
      priority,
      timestamp: Date.now()
    };
    
    console.log(`[COMMANDER] Adding pending job ${id} with sessionId: ${sessionId || 'none'}`);
    
    // Add to sorted set with score = priority (higher = higher priority)
    await client.zadd(
      PENDING_JOBS_KEY, 
      priority, 
      JSON.stringify(pendingJob)
    );
    
    console.log(`[COMMANDER] Added job ${id} to pending queue with priority ${priority}`);
    return id;
  }
  
  // Add multiple jobs to the pending queue
  async addPendingJobs(urls: string[], sessionId?: string, priority = 0): Promise<string[]> {
    return Promise.all(
      urls.map(url => this.addPendingJob(url, sessionId, priority))
    );
  }
  
  // Get available agents
  private async getAvailableAgents(): Promise<string[]> {
    const client = replayQueue.client;
    if (!client) return [];
    
    // Get all registered agents
    const agents = await client.smembers(AGENT_REGISTRY_KEY);
    
    // Filter out agents that are busy or haven't sent a heartbeat recently
    const availableAgents = [];
    
    for (const agentId of agents) {
      const statusKey = `${AGENT_STATUS_PREFIX}${agentId}`;
      const statusData = await client.get(statusKey);
      
      if (statusData) {
        const status = JSON.parse(statusData);
        const now = Date.now();
        
        // Check if agent is idle and has sent a heartbeat recently
        if (status.status === 'idle' && (now - status.lastHeartbeat) < AGENT_HEARTBEAT_TIMEOUT) {
          availableAgents.push(agentId);
        }
      }
    }
    
    return availableAgents;
  }
  
  // Check if we can process a new URL based on rate limiting
  private async canProcessUrl(): Promise<boolean> {
    const client = replayQueue.client;
    if (!client) return false;
    
    const now = Date.now();
    const lastProcessed = await client.get(LAST_PROCESSED_KEY);
    
    if (!lastProcessed || (now - parseInt(lastProcessed)) >= rateLimiter.MIN_REQUEST_INTERVAL) {
      return true;
    }
    
    return false;
  }
  
  // Assign pending jobs to available agents
  private async assignPendingJobs(): Promise<void> {
    const client = replayQueue.client;
    if (!client) return;
    
    // Try to acquire the commander lock to prevent multiple commanders
    const lockAcquired = await rateLimiter.acquireLock(COMMANDER_LOCK_KEY, 10000);
    if (!lockAcquired) return;
    
    try {
      await this.attemptJobAssignment(client);
    } finally {
      // Release the lock
      await rateLimiter.releaseLock(COMMANDER_LOCK_KEY);
    }
  }
  
  // Break up complex method into smaller, focused methods
  private async attemptJobAssignment(client: any): Promise<void> {
    // Check if we can process a new URL based on rate limiting
    if (!await this.canProcessUrl()) {
      return;
    }
    
    // Get available agents
    const availableAgents = await this.getAvailableAgents();
    if (availableAgents.length === 0) {
      return;
    }
    
    // Get highest priority pending job
    const pendingJob = await this.getHighestPriorityJob(client);
    if (!pendingJob) {
      return;
    }
    
    // Assign the job to an agent
    await this.assignJobToAgent(client, pendingJob, availableAgents[0]);
  }
  
  // Get the highest priority pending job
  private async getHighestPriorityJob(client: any): Promise<PendingJob | null> {
    const pendingJobs = await client.zrevrange(PENDING_JOBS_KEY, 0, 0);
    if (pendingJobs.length === 0) {
      return null;
    }
    
    const job = JSON.parse(pendingJobs[0]);
    console.log(`[COMMANDER] Retrieved pending job: ${JSON.stringify(job)}`);
    return job;
  }
  
  // Assigns a job to an idle agent
  private async assignJobToAgent(client: any, pendingJob: PendingJob, agentId: string): Promise<void> {
    console.log(`[COMMANDER] Assigning job ${pendingJob.id} for URL ${pendingJob.url} to agent ${agentId}`);
    console.log(`[COMMANDER] Agent ID type: ${typeof agentId}, value: "${agentId}"`);
    
    // Ensure agentId is consistently a string - MOVED OUTSIDE try/catch
    const stringAgentId = String(agentId);

    try {
      // Create the job with the agent assignment
      const jobData: ReplayJobData = {
        url: pendingJob.url,
        sessionId: pendingJob.sessionId,
        priority: pendingJob.priority,
        timestamp: pendingJob.timestamp,
        assignedTo: stringAgentId
      };
      
      // Log the job data to verify what's being assigned
      console.log(`[COMMANDER] Creating job with data:`, JSON.stringify(jobData));
      
      const job = await replayQueue.add(jobData, {
        priority: pendingJob.priority,
        jobId: pendingJob.id
      });
      
      // Mark the agent as busy
      await this.markAgentAsBusy(client, stringAgentId, job.id.toString());
      
      // Record the assignment
      await client.set(
        `${ASSIGNED_JOBS_PREFIX}${job.id}`, 
        stringAgentId,
        'PX',
        60000 // 1 minute expiry as a safety measure
      );
      
      // Update last processed time
      await client.set(LAST_PROCESSED_KEY, Date.now().toString());
      
      // Remove the job from the pending queue
      await client.zrem(PENDING_JOBS_KEY, JSON.stringify(pendingJob));
      
      console.log(`[COMMANDER] Successfully assigned job ${job.id} to agent ${stringAgentId}`);
    } catch (error) {
      console.error(`[COMMANDER] Error assigning job to agent: ${error}`);
      // Make sure agent is marked as idle if assignment fails
      await this.markAgentAsIdle(client, stringAgentId);
    }
  }
  
  // Mark an agent as busy with a specific job
  private async markAgentAsBusy(client: any, agentId: string, jobId: string): Promise<void> {
    const statusKey = `${AGENT_STATUS_PREFIX}${agentId}`;
    await client.set(statusKey, JSON.stringify({
      status: 'busy',
      jobId: jobId,
      lastHeartbeat: Date.now()
    }));
  }
  
  // Mark an agent as idle (new helper method)
  private async markAgentAsIdle(client: any, agentId: string): Promise<void> {
    const statusKey = `${AGENT_STATUS_PREFIX}${agentId}`;
    await client.set(statusKey, JSON.stringify({
      status: 'idle',
      jobId: null,
      lastHeartbeat: Date.now()
    }));
    console.log(`[COMMANDER] Marked agent ${agentId} as idle`);
  }
  
  // Handle job completion
  private async handleJobCompletion(jobId: string): Promise<void> {
    const client = replayQueue.client;
    if (!client) return;
    
    // Get the job data to find the URL
    const job = await replayQueue.getJob(jobId);
    if (job) {
      // Remove the URL from the processing set
      await client.srem(PROCESSING_URLS_SET, job.data.url);
    }
    
    // Get the agent that was assigned this job
    const agentId = await client.get(`${ASSIGNED_JOBS_PREFIX}${jobId}`);
    if (!agentId) return;
    
    // Clean up the assignment record
    await client.del(`${ASSIGNED_JOBS_PREFIX}${jobId}`);
    
    console.log(`[COMMANDER] Job ${jobId} completed by agent ${agentId}`);
  }

  // Fix the markJobFailed method
  async markJobFailed(url: string, sessionId?: string): Promise<void> {
    console.log(`[Commander] Marking job as failed: ${url}`);
    
    // Get client from replayQueue to ensure it exists
    const client = replayQueue.client;
    if (!client) {
      console.warn('[Commander] No Redis client available to mark job as failed');
      return;
    }
    
    try {
      // Remove URL from the processing set
      await client.srem(PROCESSING_URLS_SET, url);
      
      // Log job status with session ID for debugging
      console.log(`[Commander] Job failed: ${url}, sessionId: ${sessionId || 'none'}, time: ${new Date().toISOString()}`);
      
      // Re-add to pending jobs set with the original sessionId if it exists
      if (sessionId) {
        await this.addPendingJob(url, sessionId, 10); // Higher priority for retries
      }
    } catch (error) {
      console.error(`[Commander] Error marking job as failed: ${error}`);
      // Attempt one more cleanup of the processing set as a last resort
      try {
        await client.srem(PROCESSING_URLS_SET, url);
      } catch (retryError) {
        console.error(`[Commander] Final cleanup attempt failed: ${retryError}`);
      }
    }
  }

  // Add this method to the Commander class
  private setupStuckJobsCleanup(): void {
    setInterval(async () => {
      try {
        const client = replayQueue.client;
        if (!client) return;
        
        const processingUrls = await client.smembers(PROCESSING_URLS_SET);
        if (processingUrls.length === 0) return;
        
        // Get all jobs including their data
        const jobs = await replayQueue.getJobs(['active', 'delayed', 'waiting']);
        
        for (const url of processingUrls) {
          // First check Bull queue for active job
          const matchingJob = jobs.find(job => job.data.url === url);
          
          // Then check pending queue for sessionId
          const pendingJobs = await client.zrange(PENDING_JOBS_KEY, 0, -1);
          const existingJob = pendingJobs
            .map(job => JSON.parse(job))
            .find(job => job.url === url);
          
          // Preserve sessionId from either source
          const sessionId = matchingJob?.data.sessionId || existingJob?.sessionId;
          
          // Check if job is still running
          let isStillRunning = false;
          if (matchingJob) {
            const state = await matchingJob.getState();
            isStillRunning = state === 'active';
          }
          
          if (!isStillRunning) {
            await client.srem(PROCESSING_URLS_SET, url);
            await this.addPendingJob(url, sessionId);
          }
        }
      } catch (error) {
        console.error('[Commander] Error checking for stuck jobs:', error);
      }
    }, 60 * 1000); // 1 minute interval
  }
}

// Create a singleton instance
export const commander = new Commander(); 