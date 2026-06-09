import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type Query {
    hello: String!
    messages: [Message!]!
  }

  type Mutation {
    addMessage(text: String!): Message!
    recordAgentMetric(input: AgentMetricInput!): AgentMetric!
  }

  type Message {
    id: ID!
    text: String!
  }

  # Lightweight historical metrics for the self-improving agent team
  type AgentMetric {
    id: ID!
    timestamp: String!
    sessionId: String
    mainModel: String
    subagentCount: Int
    totalSampledModelMs: Int
    distinctModels: [String!]
    notes: String
  }

  input AgentMetricInput {
    sessionId: String
    mainModel: String
    subagentCount: Int
    totalSampledModelMs: Int
    distinctModels: [String!]
    notes: String
    rawSummary: String   # JSON string for flexibility
  }
`;
