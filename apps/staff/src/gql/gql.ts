/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query GetCurrentState {\n    currentState {\n      buckets {\n        id\n        name\n        percentAlloc\n        maxAmount\n        spillOverOrder\n        spillOverBucketUsed\n        balance\n        parent { id name }\n        children { id name percentAlloc balance }\n        goal { id name targetAmount description }\n      }\n      goals {\n        id\n        name\n        targetAmount\n        description\n      }\n      totalBalance\n      lastDeposit {\n        id\n        amount\n        totalAllocated\n        remainder\n        allocations {\n          bucketId\n          bucketName\n          allocated\n          capped\n          spillOverBucketUsed\n        }\n      }\n    }\n    hello\n  }\n": typeof types.GetCurrentStateDocument,
    "\n  mutation ApplyDeposit($amount: Float!) {\n    applyDeposit(amount: $amount) {\n      id\n      amount\n      totalAllocated\n      remainder\n      allocations {\n        bucketId\n        bucketName\n        allocated\n        capped\n        spillOverBucketUsed\n      }\n    }\n  }\n": typeof types.ApplyDepositDocument,
    "\n  mutation SimulateDeposit($amount: Float!) {\n    simulateDeposit(amount: $amount) {\n      id\n      amount\n      totalAllocated\n      remainder\n      allocations {\n        bucketId\n        bucketName\n        allocated\n        capped\n        spillOverBucketUsed\n      }\n    }\n  }\n": typeof types.SimulateDepositDocument,
    "\n  query GetProjections($amount: Float!, $count: Int!) {\n    projections(amount: $amount, count: $count) {\n      amount\n      count\n      finalProjectedTotal\n      periods {\n        period\n        totalBalance\n        bucketProjections {\n          bucketId\n          bucketName\n          projectedBalance\n        }\n      }\n    }\n  }\n": typeof types.GetProjectionsDocument,
    "\n  query GetMessages {\n    messages {\n      id\n      text\n    }\n    hello\n  }\n": typeof types.GetMessagesDocument,
    "\n  mutation AddMessage($text: String!) {\n    addMessage(text: $text) {\n      id\n      text\n    }\n  }\n": typeof types.AddMessageDocument,
    "\n  mutation ConfigureBuckets($configs: [BucketConfigInput!]!) {\n    configureBuckets(configs: $configs) {\n      id\n      name\n      percentAlloc\n      maxAmount\n      spillOverOrder\n      balance\n      goal { id name targetAmount }\n    }\n  }\n": typeof types.ConfigureBucketsDocument,
};
const documents: Documents = {
    "\n  query GetCurrentState {\n    currentState {\n      buckets {\n        id\n        name\n        percentAlloc\n        maxAmount\n        spillOverOrder\n        spillOverBucketUsed\n        balance\n        parent { id name }\n        children { id name percentAlloc balance }\n        goal { id name targetAmount description }\n      }\n      goals {\n        id\n        name\n        targetAmount\n        description\n      }\n      totalBalance\n      lastDeposit {\n        id\n        amount\n        totalAllocated\n        remainder\n        allocations {\n          bucketId\n          bucketName\n          allocated\n          capped\n          spillOverBucketUsed\n        }\n      }\n    }\n    hello\n  }\n": types.GetCurrentStateDocument,
    "\n  mutation ApplyDeposit($amount: Float!) {\n    applyDeposit(amount: $amount) {\n      id\n      amount\n      totalAllocated\n      remainder\n      allocations {\n        bucketId\n        bucketName\n        allocated\n        capped\n        spillOverBucketUsed\n      }\n    }\n  }\n": types.ApplyDepositDocument,
    "\n  mutation SimulateDeposit($amount: Float!) {\n    simulateDeposit(amount: $amount) {\n      id\n      amount\n      totalAllocated\n      remainder\n      allocations {\n        bucketId\n        bucketName\n        allocated\n        capped\n        spillOverBucketUsed\n      }\n    }\n  }\n": types.SimulateDepositDocument,
    "\n  query GetProjections($amount: Float!, $count: Int!) {\n    projections(amount: $amount, count: $count) {\n      amount\n      count\n      finalProjectedTotal\n      periods {\n        period\n        totalBalance\n        bucketProjections {\n          bucketId\n          bucketName\n          projectedBalance\n        }\n      }\n    }\n  }\n": types.GetProjectionsDocument,
    "\n  query GetMessages {\n    messages {\n      id\n      text\n    }\n    hello\n  }\n": types.GetMessagesDocument,
    "\n  mutation AddMessage($text: String!) {\n    addMessage(text: $text) {\n      id\n      text\n    }\n  }\n": types.AddMessageDocument,
    "\n  mutation ConfigureBuckets($configs: [BucketConfigInput!]!) {\n    configureBuckets(configs: $configs) {\n      id\n      name\n      percentAlloc\n      maxAmount\n      spillOverOrder\n      balance\n      goal { id name targetAmount }\n    }\n  }\n": types.ConfigureBucketsDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetCurrentState {\n    currentState {\n      buckets {\n        id\n        name\n        percentAlloc\n        maxAmount\n        spillOverOrder\n        spillOverBucketUsed\n        balance\n        parent { id name }\n        children { id name percentAlloc balance }\n        goal { id name targetAmount description }\n      }\n      goals {\n        id\n        name\n        targetAmount\n        description\n      }\n      totalBalance\n      lastDeposit {\n        id\n        amount\n        totalAllocated\n        remainder\n        allocations {\n          bucketId\n          bucketName\n          allocated\n          capped\n          spillOverBucketUsed\n        }\n      }\n    }\n    hello\n  }\n"): (typeof documents)["\n  query GetCurrentState {\n    currentState {\n      buckets {\n        id\n        name\n        percentAlloc\n        maxAmount\n        spillOverOrder\n        spillOverBucketUsed\n        balance\n        parent { id name }\n        children { id name percentAlloc balance }\n        goal { id name targetAmount description }\n      }\n      goals {\n        id\n        name\n        targetAmount\n        description\n      }\n      totalBalance\n      lastDeposit {\n        id\n        amount\n        totalAllocated\n        remainder\n        allocations {\n          bucketId\n          bucketName\n          allocated\n          capped\n          spillOverBucketUsed\n        }\n      }\n    }\n    hello\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation ApplyDeposit($amount: Float!) {\n    applyDeposit(amount: $amount) {\n      id\n      amount\n      totalAllocated\n      remainder\n      allocations {\n        bucketId\n        bucketName\n        allocated\n        capped\n        spillOverBucketUsed\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation ApplyDeposit($amount: Float!) {\n    applyDeposit(amount: $amount) {\n      id\n      amount\n      totalAllocated\n      remainder\n      allocations {\n        bucketId\n        bucketName\n        allocated\n        capped\n        spillOverBucketUsed\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation SimulateDeposit($amount: Float!) {\n    simulateDeposit(amount: $amount) {\n      id\n      amount\n      totalAllocated\n      remainder\n      allocations {\n        bucketId\n        bucketName\n        allocated\n        capped\n        spillOverBucketUsed\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation SimulateDeposit($amount: Float!) {\n    simulateDeposit(amount: $amount) {\n      id\n      amount\n      totalAllocated\n      remainder\n      allocations {\n        bucketId\n        bucketName\n        allocated\n        capped\n        spillOverBucketUsed\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetProjections($amount: Float!, $count: Int!) {\n    projections(amount: $amount, count: $count) {\n      amount\n      count\n      finalProjectedTotal\n      periods {\n        period\n        totalBalance\n        bucketProjections {\n          bucketId\n          bucketName\n          projectedBalance\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetProjections($amount: Float!, $count: Int!) {\n    projections(amount: $amount, count: $count) {\n      amount\n      count\n      finalProjectedTotal\n      periods {\n        period\n        totalBalance\n        bucketProjections {\n          bucketId\n          bucketName\n          projectedBalance\n        }\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetMessages {\n    messages {\n      id\n      text\n    }\n    hello\n  }\n"): (typeof documents)["\n  query GetMessages {\n    messages {\n      id\n      text\n    }\n    hello\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation AddMessage($text: String!) {\n    addMessage(text: $text) {\n      id\n      text\n    }\n  }\n"): (typeof documents)["\n  mutation AddMessage($text: String!) {\n    addMessage(text: $text) {\n      id\n      text\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation ConfigureBuckets($configs: [BucketConfigInput!]!) {\n    configureBuckets(configs: $configs) {\n      id\n      name\n      percentAlloc\n      maxAmount\n      spillOverOrder\n      balance\n      goal { id name targetAmount }\n    }\n  }\n"): (typeof documents)["\n  mutation ConfigureBuckets($configs: [BucketConfigInput!]!) {\n    configureBuckets(configs: $configs) {\n      id\n      name\n      percentAlloc\n      maxAmount\n      spillOverOrder\n      balance\n      goal { id name targetAmount }\n    }\n  }\n"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;