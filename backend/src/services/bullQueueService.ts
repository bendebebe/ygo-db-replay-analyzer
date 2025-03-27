import { replayQueue, ReplayJobData, rateLimiter } from '../queues/replayQueue';
import { commander } from '../queues/commander';

// Constants
const PROCESSING_URLS_SET = 'commander:urls:processing';

class BullQueueService {
  // Add a new replay job to the queue
  async addReplayJob(url: string, sessionId?: string, priority = 0): Promise<string> {
    console.log(`[QUEUE] Adding job for URL: ${url}`);
    
    try {
      // Check if this URL is already being processed in the Bull queue
      const client = replayQueue.client;
      if (!client) {
        throw new Error('Redis client not available');
      }
      
      // Create a lock to prevent race conditions
      const lockName = `submit:${url}`;
      const lockAcquired = await rateLimiter.acquireLock(lockName, 10000);
      
      try {
        // 1. Check if job already exists in the "in-process" set
        const isProcessing = await client.sismember(PROCESSING_URLS_SET, url);
        if (isProcessing) {
          console.log(`[QUEUE] URL already being processed: ${url}`);
          
          // Try to find the job ID from active jobs
          const activeJobs = await replayQueue.getActive();
          for (const job of activeJobs) {
            if (job.data.url === url) {
              return job.id.toString();
            }
          }
          
          // If we can't find the exact job ID, generate a placeholder
          return `existing_${Date.now()}`;
        }
        
        // 2. If not processing, add the job
        const jobId = await commander.addPendingJob(url, sessionId, priority);
        console.log(`[QUEUE] Job added with ID: ${jobId}`);
        
        // 3. Mark this URL as "in process" in Redis
        await client.sadd(PROCESSING_URLS_SET, url);
        
        return jobId;
      } finally {
        if (lockAcquired) {
          await rateLimiter.releaseLock(lockName);
        }
      }
    } catch (error) {
      console.error(`[QUEUE] Error adding job: ${error}`);
      throw error;
    }
  }
  
  // Add multiple jobs and return their IDs
  async addReplayJobs(urls: string[], sessionId?: string, priority = 0): Promise<string[]> {
    console.log(`[QUEUE] Adding batch of ${urls.length} jobs with sessionId: ${sessionId || 'none'}`);
    
    // Process all jobs with the SAME sessionId
    const jobPromises = urls.map(url => this.addReplayJob(url, sessionId, priority));
    return Promise.all(jobPromises);
  }
  
  // Get status of a specific job
  async getJobStatus(id: string): Promise<any> {
    const job = await replayQueue.getJob(id);
    
    if (!job) {
      return { id, status: 'not_found', progress: 0 };
    }
    
    const state = await job.getState();
    const progress = job.progress();
    let result = null;
    let error = null;
    
    if (state === 'completed') {
      result = job.returnvalue;
    } else if (state === 'failed') {
      const failedReason = job.failedReason;
      error = failedReason || 'Unknown error';
    }
    
    return {
      id,
      status: state,
      progress: progress || 0,
      result,
      error
    };
  }
  
  // Get status of multiple jobs
  async getJobsStatus(ids: string[]): Promise<any[]> {
    return Promise.all(ids.map(id => this.getJobStatus(id)));
  }
  
  // Get queue statistics
  async getQueueStats(): Promise<any> {
    try {
      const client = replayQueue.client;
      if (!client) return { error: 'Redis client not available' };
      
      // Get counts of jobs in different states
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        replayQueue.getWaitingCount(),
        replayQueue.getActiveCount(),
        replayQueue.getCompletedCount(),
        replayQueue.getFailedCount(),
        replayQueue.getDelayedCount()
      ]);
      
      // Get pending jobs from the new commander namespace
      let pending = 0;
      try {
        pending = await client.zcard('commander:url:pending'); // Updated namespace
      } catch (err) {
        console.error('[QUEUE] Error getting pending count:', err);
      }
      
      return {
        pending,
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: pending + waiting + active + completed + failed + delayed
      };
    } catch (error) {
      console.error('[QUEUE] Error getting queue stats:', error);
      return { error: String(error) };
    }
  }
}

export const bullQueueService = new BullQueueService();