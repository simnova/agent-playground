/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type AgentMetric = {
  __typename?: 'AgentMetric';
  distinctModels?: Maybe<Array<Scalars['String']['output']>>;
  id: Scalars['ID']['output'];
  mainModel?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  sessionId?: Maybe<Scalars['String']['output']>;
  subagentCount?: Maybe<Scalars['Int']['output']>;
  timestamp: Scalars['String']['output'];
  totalSampledModelMs?: Maybe<Scalars['Int']['output']>;
};

export type AgentMetricInput = {
  distinctModels?: InputMaybe<Array<Scalars['String']['input']>>;
  mainModel?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  rawSummary?: InputMaybe<Scalars['String']['input']>;
  sessionId?: InputMaybe<Scalars['String']['input']>;
  subagentCount?: InputMaybe<Scalars['Int']['input']>;
  totalSampledModelMs?: InputMaybe<Scalars['Int']['input']>;
};

export type Allocation = {
  __typename?: 'Allocation';
  allocated: Scalars['Float']['output'];
  /** ID of bucket at time of this deposit (historical). */
  bucketId: Scalars['ID']['output'];
  /** Name snapshot (defensive for history). */
  bucketName?: Maybe<Scalars['String']['output']>;
  capped: Scalars['Boolean']['output'];
  spillOverBucketUsed?: Maybe<Scalars['ID']['output']>;
};

export type Bucket = {
  __typename?: 'Bucket';
  /** Current balance (persisted; updated on applyDeposit). */
  balance: Scalars['Float']['output'];
  /** Resolved children (by parent ref). Enables hierarchy in queries/currentState. */
  children: Array<Bucket>;
  /** Optional link to Goal (aspirational target, price, community etc.). */
  goal?: Maybe<Goal>;
  id: Scalars['ID']['output'];
  /** Cap on this bucket's balance. Excess after cap triggers spillover per spillOver* rules. */
  maxAmount?: Maybe<Scalars['Float']['output']>;
  name: Scalars['String']['output'];
  /** Parent for hierarchy (supports tree UIs and future child % subdivision recursion in calc). */
  parent?: Maybe<Bucket>;
  /** User-defined share of every deposit (e.g. 0.25 = 25%). Configure so logical groups sum near 1.0. */
  percentAlloc: Scalars['Float']['output'];
  /** Optional explicit target for spillover from this bucket (takes precedence in waterfall). */
  spillOverBucketUsed?: Maybe<Scalars['ID']['output']>;
  /** Determines priority in the spillover waterfall (lower numbers receive excess earlier). */
  spillOverOrder: Scalars['Int']['output'];
};

export type BucketConfigInput = {
  goalId?: InputMaybe<Scalars['ID']['input']>;
  maxAmount?: InputMaybe<Scalars['Float']['input']>;
  name: Scalars['String']['input'];
  /** For v1 configure: parentId stored but links created flat (hierarchy wiring supported in model + children resolver; enhance later). */
  parentId?: InputMaybe<Scalars['ID']['input']>;
  percentAlloc: Scalars['Float']['input'];
  spillOverBucketUsed?: InputMaybe<Scalars['ID']['input']>;
  spillOverOrder?: InputMaybe<Scalars['Int']['input']>;
};

export type BucketProjection = {
  __typename?: 'BucketProjection';
  bucketId: Scalars['ID']['output'];
  bucketName: Scalars['String']['output'];
  projectedBalance: Scalars['Float']['output'];
};

export type CurrentState = {
  __typename?: 'CurrentState';
  buckets: Array<Bucket>;
  goals: Array<Goal>;
  lastDeposit?: Maybe<Deposit>;
  totalBalance: Scalars['Float']['output'];
};

export type Deposit = {
  __typename?: 'Deposit';
  /** Embedded results from the portable DepositCalculator (exact allocation decisions for this deposit). */
  allocations: Array<Allocation>;
  amount: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  remainder: Scalars['Float']['output'];
  timestamp: Scalars['String']['output'];
  totalAllocated: Scalars['Float']['output'];
};

export type Goal = {
  __typename?: 'Goal';
  createdAt: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  targetAmount: Scalars['Float']['output'];
};

export type Message = {
  __typename?: 'Message';
  id: Scalars['ID']['output'];
  text: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addMessage: Message;
  applyDeposit: Deposit;
  configureBuckets: Array<Bucket>;
  createGoal: Goal;
  linkGoal: Bucket;
  recordAgentMetric: AgentMetric;
  simulateDeposit: Deposit;
};


export type MutationAddMessageArgs = {
  text: Scalars['String']['input'];
};


export type MutationApplyDepositArgs = {
  amount: Scalars['Float']['input'];
};


export type MutationConfigureBucketsArgs = {
  configs: Array<BucketConfigInput>;
};


export type MutationCreateGoalArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  targetAmount: Scalars['Float']['input'];
};


export type MutationLinkGoalArgs = {
  bucketId: Scalars['ID']['input'];
  goalId: Scalars['ID']['input'];
};


export type MutationRecordAgentMetricArgs = {
  input: AgentMetricInput;
};


export type MutationSimulateDepositArgs = {
  amount: Scalars['Float']['input'];
};

export type PeriodProjection = {
  __typename?: 'PeriodProjection';
  bucketProjections: Array<BucketProjection>;
  period: Scalars['Int']['output'];
  totalBalance: Scalars['Float']['output'];
};

export type Projections = {
  __typename?: 'Projections';
  amount: Scalars['Float']['output'];
  count: Scalars['Int']['output'];
  finalProjectedTotal: Scalars['Float']['output'];
  periods: Array<PeriodProjection>;
};

export type Query = {
  __typename?: 'Query';
  buckets: Array<Bucket>;
  currentState: CurrentState;
  hello: Scalars['String']['output'];
  messages: Array<Message>;
  projections: Projections;
};


export type QueryProjectionsArgs = {
  amount: Scalars['Float']['input'];
  count: Scalars['Int']['input'];
};

export type GetMessagesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMessagesQuery = { __typename?: 'Query', hello: string, messages: Array<{ __typename?: 'Message', id: string, text: string }> };

export type AddMessageMutationVariables = Exact<{
  text: Scalars['String']['input'];
}>;


export type AddMessageMutation = { __typename?: 'Mutation', addMessage: { __typename?: 'Message', id: string, text: string } };

export type GetCurrentStateQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCurrentStateQuery = { __typename?: 'Query', hello: string, currentState: { __typename?: 'CurrentState', totalBalance: number, buckets: Array<{ __typename?: 'Bucket', id: string, name: string, percentAlloc: number, maxAmount?: number | null, spillOverOrder: number, spillOverBucketUsed?: string | null, balance: number, parent?: { __typename?: 'Bucket', id: string, name: string } | null, children: Array<{ __typename?: 'Bucket', id: string, name: string, percentAlloc: number, balance: number }>, goal?: { __typename?: 'Goal', id: string, name: string, targetAmount: number, description?: string | null } | null }>, goals: Array<{ __typename?: 'Goal', id: string, name: string, targetAmount: number, description?: string | null }>, lastDeposit?: { __typename?: 'Deposit', id: string, amount: number, totalAllocated: number, remainder: number, allocations: Array<{ __typename?: 'Allocation', bucketId: string, bucketName?: string | null, allocated: number, capped: boolean, spillOverBucketUsed?: string | null }> } | null } };

export type ConfigureBucketsMutationVariables = Exact<{
  configs: Array<BucketConfigInput> | BucketConfigInput;
}>;


export type ConfigureBucketsMutation = { __typename?: 'Mutation', configureBuckets: Array<{ __typename?: 'Bucket', id: string, name: string, percentAlloc: number, maxAmount?: number | null, spillOverOrder: number, balance: number, goal?: { __typename?: 'Goal', id: string, name: string, targetAmount: number } | null }> };

export type ApplyDepositMutationVariables = Exact<{
  amount: Scalars['Float']['input'];
}>;


export type ApplyDepositMutation = { __typename?: 'Mutation', applyDeposit: { __typename?: 'Deposit', id: string, amount: number, totalAllocated: number, remainder: number, allocations: Array<{ __typename?: 'Allocation', bucketId: string, bucketName?: string | null, allocated: number, capped: boolean, spillOverBucketUsed?: string | null }> } };

export type SimulateDepositMutationVariables = Exact<{
  amount: Scalars['Float']['input'];
}>;


export type SimulateDepositMutation = { __typename?: 'Mutation', simulateDeposit: { __typename?: 'Deposit', id: string, amount: number, totalAllocated: number, remainder: number, allocations: Array<{ __typename?: 'Allocation', bucketId: string, bucketName?: string | null, allocated: number, capped: boolean, spillOverBucketUsed?: string | null }> } };

export type GetProjectionsQueryVariables = Exact<{
  amount: Scalars['Float']['input'];
  count: Scalars['Int']['input'];
}>;


export type GetProjectionsQuery = { __typename?: 'Query', projections: { __typename?: 'Projections', amount: number, count: number, finalProjectedTotal: number, periods: Array<{ __typename?: 'PeriodProjection', period: number, totalBalance: number, bucketProjections: Array<{ __typename?: 'BucketProjection', bucketId: string, bucketName: string, projectedBalance: number }> }> } };


export const GetMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMessages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"messages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"text"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hello"}}]}}]} as unknown as DocumentNode<GetMessagesQuery, GetMessagesQueryVariables>;
export const AddMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"text"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"text"},"value":{"kind":"Variable","name":{"kind":"Name","value":"text"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"text"}}]}}]}}]} as unknown as DocumentNode<AddMessageMutation, AddMessageMutationVariables>;
export const GetCurrentStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCurrentState"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentState"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"buckets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"percentAlloc"}},{"kind":"Field","name":{"kind":"Name","value":"maxAmount"}},{"kind":"Field","name":{"kind":"Name","value":"spillOverOrder"}},{"kind":"Field","name":{"kind":"Name","value":"spillOverBucketUsed"}},{"kind":"Field","name":{"kind":"Name","value":"balance"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"children"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"percentAlloc"}},{"kind":"Field","name":{"kind":"Name","value":"balance"}}]}},{"kind":"Field","name":{"kind":"Name","value":"goal"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"targetAmount"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"goals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"targetAmount"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalBalance"}},{"kind":"Field","name":{"kind":"Name","value":"lastDeposit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"totalAllocated"}},{"kind":"Field","name":{"kind":"Name","value":"remainder"}},{"kind":"Field","name":{"kind":"Name","value":"allocations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bucketId"}},{"kind":"Field","name":{"kind":"Name","value":"bucketName"}},{"kind":"Field","name":{"kind":"Name","value":"allocated"}},{"kind":"Field","name":{"kind":"Name","value":"capped"}},{"kind":"Field","name":{"kind":"Name","value":"spillOverBucketUsed"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"hello"}}]}}]} as unknown as DocumentNode<GetCurrentStateQuery, GetCurrentStateQueryVariables>;
export const ConfigureBucketsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ConfigureBuckets"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"configs"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BucketConfigInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"configureBuckets"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"configs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"configs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"percentAlloc"}},{"kind":"Field","name":{"kind":"Name","value":"maxAmount"}},{"kind":"Field","name":{"kind":"Name","value":"spillOverOrder"}},{"kind":"Field","name":{"kind":"Name","value":"balance"}},{"kind":"Field","name":{"kind":"Name","value":"goal"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"targetAmount"}}]}}]}}]}}]} as unknown as DocumentNode<ConfigureBucketsMutation, ConfigureBucketsMutationVariables>;
export const ApplyDepositDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ApplyDeposit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"applyDeposit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"amount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amount"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"totalAllocated"}},{"kind":"Field","name":{"kind":"Name","value":"remainder"}},{"kind":"Field","name":{"kind":"Name","value":"allocations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bucketId"}},{"kind":"Field","name":{"kind":"Name","value":"bucketName"}},{"kind":"Field","name":{"kind":"Name","value":"allocated"}},{"kind":"Field","name":{"kind":"Name","value":"capped"}},{"kind":"Field","name":{"kind":"Name","value":"spillOverBucketUsed"}}]}}]}}]}}]} as unknown as DocumentNode<ApplyDepositMutation, ApplyDepositMutationVariables>;
export const SimulateDepositDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SimulateDeposit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"simulateDeposit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"amount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amount"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"totalAllocated"}},{"kind":"Field","name":{"kind":"Name","value":"remainder"}},{"kind":"Field","name":{"kind":"Name","value":"allocations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bucketId"}},{"kind":"Field","name":{"kind":"Name","value":"bucketName"}},{"kind":"Field","name":{"kind":"Name","value":"allocated"}},{"kind":"Field","name":{"kind":"Name","value":"capped"}},{"kind":"Field","name":{"kind":"Name","value":"spillOverBucketUsed"}}]}}]}}]}}]} as unknown as DocumentNode<SimulateDepositMutation, SimulateDepositMutationVariables>;
export const GetProjectionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProjections"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"count"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projections"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"amount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amount"}}},{"kind":"Argument","name":{"kind":"Name","value":"count"},"value":{"kind":"Variable","name":{"kind":"Name","value":"count"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"finalProjectedTotal"}},{"kind":"Field","name":{"kind":"Name","value":"periods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"period"}},{"kind":"Field","name":{"kind":"Name","value":"totalBalance"}},{"kind":"Field","name":{"kind":"Name","value":"bucketProjections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bucketId"}},{"kind":"Field","name":{"kind":"Name","value":"bucketName"}},{"kind":"Field","name":{"kind":"Name","value":"projectedBalance"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetProjectionsQuery, GetProjectionsQueryVariables>;