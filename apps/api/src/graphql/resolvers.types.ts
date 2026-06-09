import type { GraphQLResolveInfo } from 'graphql';
import type { GraphQLContext } from './context.js';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
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



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  AgentMetric: ResolverTypeWrapper<AgentMetric>;
  AgentMetricInput: AgentMetricInput;
  Allocation: ResolverTypeWrapper<Allocation>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Bucket: ResolverTypeWrapper<Bucket>;
  BucketConfigInput: BucketConfigInput;
  BucketProjection: ResolverTypeWrapper<BucketProjection>;
  CurrentState: ResolverTypeWrapper<CurrentState>;
  Deposit: ResolverTypeWrapper<Deposit>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  Goal: ResolverTypeWrapper<Goal>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Message: ResolverTypeWrapper<Message>;
  Mutation: ResolverTypeWrapper<{}>;
  PeriodProjection: ResolverTypeWrapper<PeriodProjection>;
  Projections: ResolverTypeWrapper<Projections>;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AgentMetric: AgentMetric;
  AgentMetricInput: AgentMetricInput;
  Allocation: Allocation;
  Boolean: Scalars['Boolean']['output'];
  Bucket: Bucket;
  BucketConfigInput: BucketConfigInput;
  BucketProjection: BucketProjection;
  CurrentState: CurrentState;
  Deposit: Deposit;
  Float: Scalars['Float']['output'];
  Goal: Goal;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Message: Message;
  Mutation: {};
  PeriodProjection: PeriodProjection;
  Projections: Projections;
  Query: {};
  String: Scalars['String']['output'];
};

export type AgentMetricResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AgentMetric'] = ResolversParentTypes['AgentMetric']> = {
  distinctModels?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  mainModel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  notes?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sessionId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  subagentCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  totalSampledModelMs?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AllocationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Allocation'] = ResolversParentTypes['Allocation']> = {
  allocated?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  bucketId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  bucketName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  capped?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  spillOverBucketUsed?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BucketResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Bucket'] = ResolversParentTypes['Bucket']> = {
  balance?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  children?: Resolver<Array<ResolversTypes['Bucket']>, ParentType, ContextType>;
  goal?: Resolver<Maybe<ResolversTypes['Goal']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  maxAmount?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  parent?: Resolver<Maybe<ResolversTypes['Bucket']>, ParentType, ContextType>;
  percentAlloc?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  spillOverBucketUsed?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  spillOverOrder?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BucketProjectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BucketProjection'] = ResolversParentTypes['BucketProjection']> = {
  bucketId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  bucketName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  projectedBalance?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CurrentStateResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CurrentState'] = ResolversParentTypes['CurrentState']> = {
  buckets?: Resolver<Array<ResolversTypes['Bucket']>, ParentType, ContextType>;
  goals?: Resolver<Array<ResolversTypes['Goal']>, ParentType, ContextType>;
  lastDeposit?: Resolver<Maybe<ResolversTypes['Deposit']>, ParentType, ContextType>;
  totalBalance?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DepositResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Deposit'] = ResolversParentTypes['Deposit']> = {
  allocations?: Resolver<Array<ResolversTypes['Allocation']>, ParentType, ContextType>;
  amount?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  remainder?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  totalAllocated?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GoalResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Goal'] = ResolversParentTypes['Goal']> = {
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  targetAmount?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MessageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Message'] = ResolversParentTypes['Message']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  text?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  addMessage?: Resolver<ResolversTypes['Message'], ParentType, ContextType, RequireFields<MutationAddMessageArgs, 'text'>>;
  applyDeposit?: Resolver<ResolversTypes['Deposit'], ParentType, ContextType, RequireFields<MutationApplyDepositArgs, 'amount'>>;
  configureBuckets?: Resolver<Array<ResolversTypes['Bucket']>, ParentType, ContextType, RequireFields<MutationConfigureBucketsArgs, 'configs'>>;
  createGoal?: Resolver<ResolversTypes['Goal'], ParentType, ContextType, RequireFields<MutationCreateGoalArgs, 'name' | 'targetAmount'>>;
  linkGoal?: Resolver<ResolversTypes['Bucket'], ParentType, ContextType, RequireFields<MutationLinkGoalArgs, 'bucketId' | 'goalId'>>;
  recordAgentMetric?: Resolver<ResolversTypes['AgentMetric'], ParentType, ContextType, RequireFields<MutationRecordAgentMetricArgs, 'input'>>;
  simulateDeposit?: Resolver<ResolversTypes['Deposit'], ParentType, ContextType, RequireFields<MutationSimulateDepositArgs, 'amount'>>;
};

export type PeriodProjectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PeriodProjection'] = ResolversParentTypes['PeriodProjection']> = {
  bucketProjections?: Resolver<Array<ResolversTypes['BucketProjection']>, ParentType, ContextType>;
  period?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalBalance?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectionsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Projections'] = ResolversParentTypes['Projections']> = {
  amount?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  finalProjectedTotal?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  periods?: Resolver<Array<ResolversTypes['PeriodProjection']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  buckets?: Resolver<Array<ResolversTypes['Bucket']>, ParentType, ContextType>;
  currentState?: Resolver<ResolversTypes['CurrentState'], ParentType, ContextType>;
  hello?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  messages?: Resolver<Array<ResolversTypes['Message']>, ParentType, ContextType>;
  projections?: Resolver<ResolversTypes['Projections'], ParentType, ContextType, RequireFields<QueryProjectionsArgs, 'amount' | 'count'>>;
};

export type Resolvers<ContextType = GraphQLContext> = {
  AgentMetric?: AgentMetricResolvers<ContextType>;
  Allocation?: AllocationResolvers<ContextType>;
  Bucket?: BucketResolvers<ContextType>;
  BucketProjection?: BucketProjectionResolvers<ContextType>;
  CurrentState?: CurrentStateResolvers<ContextType>;
  Deposit?: DepositResolvers<ContextType>;
  Goal?: GoalResolvers<ContextType>;
  Message?: MessageResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  PeriodProjection?: PeriodProjectionResolvers<ContextType>;
  Projections?: ProjectionsResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
};

