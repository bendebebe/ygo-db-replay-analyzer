export const replayTypeDefs = `#graphql
  type ReplayResponse {
    url: String!
    data: String
    error: String
  }

  type Mutation {
    fetchReplayData(urls: [String!]!): [ReplayResponse!]!
    submitReplayJobs(urls: [String!]!): String!
  }
`; 