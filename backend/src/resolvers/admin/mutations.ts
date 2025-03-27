import { replayQueue } from '../../queues/replayQueue';

export const clearRedisCache = async (_: any, __: any) => {
  try {
    const client = replayQueue.client;
    if (!client) {
      return {
        success: false,
        message: 'Redis client not available'
      };
    }

    // FLUSHALL will clear all data in Redis
    await client.flushall();
    
    // Clean Bull queue data
    await replayQueue.clean(0, 'completed');
    await replayQueue.clean(0, 'failed');
    await replayQueue.clean(0, 'delayed');
    await replayQueue.clean(0, 'wait');
    await replayQueue.clean(0, 'active');
    
    console.log('[ADMIN] Redis cache cleared successfully');
    
    return {
      success: true,
      message: 'Redis cache cleared successfully'
    };
  } catch (error) {
    console.error('[ADMIN] Error clearing Redis cache:', error);
    return {
      success: false,
      message: `Error clearing cache: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}; 