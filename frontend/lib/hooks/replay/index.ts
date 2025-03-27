import { useQuery, useLazyQuery, useMutation } from '@apollo/client'
import { GET_REPLAY, GET_SESSION_REPLAYS } from '@/lib/graphql/queries/replays'
import { FETCH_REPLAY_DATA, SUBMIT_REPLAY_JOBS } from '@/lib/graphql/mutations/replays'

export const useReplays = ({ id, sessionId }: { id?: string, sessionId?: string }) => {
    const { data: replayData, loading: replayLoading, error: replayError } =  useQuery(GET_REPLAY, {
        variables: { id },
        skip: !id
      })
    
    const { data: sessionReplaysData, loading: sessionReplaysLoading, error: sessionReplaysError } = useQuery(GET_SESSION_REPLAYS, {
        variables: { sessionId },
        skip: !sessionId
      })

      const [loadReplay, { data: lazyReplayData, loading: lazyReplayLoading, error: lazyReplayError }] =  useLazyQuery(GET_REPLAY)
      const [loadSessionReplays, { data: lazySessionReplaysData, loading: lazySessionReplaysLoading, error: lazySessionReplaysError }] = useLazyQuery(GET_SESSION_REPLAYS)
    
    const [fetchReplayData, { data: fetchReplayDataData, loading: fetchReplayDataLoading, error: fetchReplayDataError }] = useMutation(FETCH_REPLAY_DATA)
    const [submitReplayJobs, { data: submitReplayJobsData, loading: submitReplayJobsLoading, error: submitReplayJobsError }] = useMutation(SUBMIT_REPLAY_JOBS)
    
    return { 
        replayData,
        replayLoading,
        replayError,
        sessionReplaysData,
        sessionReplaysLoading,
        sessionReplaysError,
        loadReplay,
        loadSessionReplays,
        lazyReplayData,
        lazyReplayLoading,
        lazyReplayError,
        lazySessionReplaysData,
        lazySessionReplaysLoading,
        lazySessionReplaysError,
        fetchReplayData,
        fetchReplayDataData,
        fetchReplayDataLoading,
        fetchReplayDataError,
        submitReplayJobs,
        submitReplayJobsData,
        submitReplayJobsLoading,
        submitReplayJobsError
    }
}

export * from './queries'
export * from './mutations'
