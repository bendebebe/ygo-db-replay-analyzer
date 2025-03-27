import { useMutation } from '@apollo/client'
import { FETCH_REPLAY_DATA, SUBMIT_REPLAY_JOBS } from '@/lib/graphql/mutations/replays'
import { ReplayResponse } from '@/lib/graphql/types/replays'

export const useFetchReplayData = () => {
  return useMutation<{ fetchReplayData: ReplayResponse[] }>(FETCH_REPLAY_DATA)
}

export const useSubmitReplayJobs = () => {
  return useMutation<{ submitReplayJobs: string }>(SUBMIT_REPLAY_JOBS)
}
