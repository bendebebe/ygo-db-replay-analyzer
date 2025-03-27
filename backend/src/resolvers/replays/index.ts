import { fetchReplayData, submitReplayJobs } from './mutations'
import { getJobStatus, getJobsStatus, getQueueStats, replay, replays, replayDecks, replayRpsChoices, replaySession, replayUser } from './queries'

export const replayMutations = {
  fetchReplayData: fetchReplayData,
  submitReplayJobs: submitReplayJobs  
}; 

export const replayQueries = {
  getJobStatus: getJobStatus,
  getJobsStatus: getJobsStatus,
  getQueueStats: getQueueStats,
  replay: replay,
  replays: replays
}

export const replayObjectQueries = {
  decks: replayDecks,
  rpsChoices: replayRpsChoices,
  session: replaySession,
  user: replayUser
}