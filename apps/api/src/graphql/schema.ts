import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type Query {
    hello: String!
    messages: [Message!]!

    # BankBuckets long-term budgeting foundation (Epic-1/2/3 per task + muse methodology)
    buckets: [Bucket!]!
    currentState: CurrentState!
    projections(amount: Float!, count: Int!): Projections!
  }

  type Mutation {
    addMessage(text: String!): Message!
    recordAgentMetric(input: AgentMetricInput!): AgentMetric!

    # Real Mongoose-backed config + sim/apply. Return full objects for Apollo cache (per update-graphql + back-end persona).
    configureBuckets(configs: [BucketConfigInput!]!): [Bucket!]!
    createGoal(name: String!, targetAmount: Float!, description: String): Goal!
    linkGoal(bucketId: ID!, goalId: ID!): Bucket!
    simulateDeposit(amount: Float!): Deposit!
    applyDeposit(amount: Float!): Deposit!
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

  # ============================================
  # BankBuckets long-term budgeting domain
  # (aligned to task: percentAlloc, maxAmount, spillOverOrder, spillOverBucketUsed,
  #  parent/children hierarchy, balance, goal link; Deposit with embedded allocations)
  # Portable calc engine handles % alloc, caps, spillover waterfall, recursion stub, remainders.
  # Follows update-graphql + graphql-schema skills + back-end-developer persona (full objects, strict, errors).
  # ============================================

  type Bucket {
    id: ID!
    name: String!
    """User-defined share of every deposit (e.g. 0.25 = 25%). Configure so logical groups sum near 1.0."""
    percentAlloc: Float!
    """Cap on this bucket's balance. Excess after cap triggers spillover per spillOver* rules."""
    maxAmount: Float
    """Determines priority in the spillover waterfall (lower numbers receive excess earlier)."""
    spillOverOrder: Int!
    """Optional explicit target for spillover from this bucket (takes precedence in waterfall)."""
    spillOverBucketUsed: ID
    """Parent for hierarchy (supports tree UIs and future child % subdivision recursion in calc)."""
    parent: Bucket
    """Resolved children (by parent ref). Enables hierarchy in queries/currentState."""
    children: [Bucket!]!
    """Current balance (persisted; updated on applyDeposit)."""
    balance: Float!
    """Optional link to Goal (aspirational target, price, community etc.)."""
    goal: Goal
  }

  type Goal {
    id: ID!
    name: String!
    targetAmount: Float!
    description: String
    createdAt: String!
  }

  type Allocation {
    """ID of bucket at time of this deposit (historical)."""
    bucketId: ID!
    """Name snapshot (defensive for history)."""
    bucketName: String
    allocated: Float!
    capped: Boolean!
    spillOverBucketUsed: ID
  }

  type Deposit {
    id: ID!
    amount: Float!
    timestamp: String!
    """Embedded results from the portable DepositCalculator (exact allocation decisions for this deposit)."""
    allocations: [Allocation!]!
    totalAllocated: Float!
    remainder: Float!
  }

  type CurrentState {
    buckets: [Bucket!]!
    goals: [Goal!]!
    totalBalance: Float!
    lastDeposit: Deposit
  }

  type BucketProjection {
    bucketId: ID!
    bucketName: String!
    projectedBalance: Float!
  }

  type PeriodProjection {
    period: Int!
    totalBalance: Float!
    bucketProjections: [BucketProjection!]!
  }

  type Projections {
    amount: Float!
    count: Int!
    periods: [PeriodProjection!]!
    finalProjectedTotal: Float!
  }

  input BucketConfigInput {
    name: String!
    percentAlloc: Float!
    maxAmount: Float
    spillOverOrder: Int = 100
    spillOverBucketUsed: ID
    """For v1 configure: parentId stored but links created flat (hierarchy wiring supported in model + children resolver; enhance later)."""
    parentId: ID
    goalId: ID
  }
`;
