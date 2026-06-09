import { GraphQLError } from 'graphql';
import mongoose from 'mongoose';
import { AgentMetric } from './agent-metrics.js';
import { Bucket, Deposit, Goal, type IAllocationResult } from './budget-models.js';
import { type BucketState, calculateDepositAllocation } from '@repo/bankbuckets-core';
import type { Resolvers } from './resolvers.types.js';

// Helper: convert Mongoose bucket doc (after toObject or lean) to portable calc input shape.
// Uses the canonical field names (percentAlloc, spillOver*, balance, parentId string).
function docToBucketState(doc: any): BucketState {
  const id = doc.id ?? (doc._id ? doc._id.toString() : '');
  return {
    id: String(id),
    name: doc.name ?? 'Unnamed',
    percentAlloc: typeof doc.percentAlloc === 'number' ? doc.percentAlloc : 0,
    maxAmount: doc.maxAmount ?? null,
    spillOverOrder: typeof doc.spillOverOrder === 'number' ? doc.spillOverOrder : 100,
    spillOverBucketUsed: doc.spillOverBucketUsed ? String(doc.spillOverBucketUsed) : null,
    parentId: doc.parent ? String(doc.parent) : null,
    balance: typeof doc.balance === 'number' ? doc.balance : 0,
  };
}

// Normalize Mongoose toObject() result for GraphQL (ensure 'id' from virtual/_id for strict generated types + Apollo).
// Also stringifies Date fields that schema declares as String! (timestamp, createdAt).
function toGql<T extends { id?: string; _id?: any }>(docOrObj: T): T & { id: string } {
  const o: any = (docOrObj as any).toObject ? (docOrObj as any).toObject() : { ...docOrObj };
  if (!o.id && o._id) o.id = o._id.toString();
  if (o.timestamp instanceof Date) o.timestamp = o.timestamp.toISOString();
  if (o.createdAt instanceof Date) o.createdAt = o.createdAt.toISOString();
  return o;
}

// Helper: build embedded allocation result for Deposit, with name snapshot.
function buildAllocationEmbeds(calcAllocs: Array<{ bucketId: string; allocated: number; capped: boolean; spillOverBucketUsed?: string | null }>, bucketNameMap: Map<string, string>): IAllocationResult[] {
  return calcAllocs.map((a) => ({
    bucketId: a.bucketId,
    bucketName: bucketNameMap.get(a.bucketId) || undefined,
    allocated: Math.round(a.allocated * 100) / 100,
    capped: !!a.capped,
    spillOverBucketUsed: a.spillOverBucketUsed ?? null,
  })) as IAllocationResult[];
}

export const resolvers: Resolvers = {
  Query: {
    hello: () => 'Hello from Hono + Apollo Server (TypeScript 7 + tsgo)!',
    messages: (_parent, _args, context) => {
      return context.messagesStore.getAll();
    },
    buckets: async () => {
      const docs = await Bucket.find().sort({ spillOverOrder: 1, name: 1 });
      return docs.map((d) => toGql(d)) as any;
    },
    currentState: async () => {
      const bucketDocs = await Bucket.find().sort({ spillOverOrder: 1 });
      const buckets = bucketDocs.map((d) => toGql(d)) as any;
      const goalDocs = await Goal.find().sort({ createdAt: -1 });
      const goals = goalDocs.map((d) => toGql(d));
      const totalBalance = (buckets as any[]).reduce((sum: number, b: any) => sum + (b.balance || 0), 0);
      const lastDepDoc = await Deposit.findOne().sort({ timestamp: -1 });
      const lastDeposit: any = lastDepDoc ? toGql(lastDepDoc) : null;
      if (lastDeposit && lastDeposit.timestamp instanceof Date) {
        lastDeposit.timestamp = lastDeposit.timestamp.toISOString();
      }
      return {
        buckets,
        goals,
        totalBalance: Math.round(totalBalance * 100) / 100,
        lastDeposit,
      } as any;
    },
    projections: async (_parent, { amount, count }) => {
      if (typeof amount !== 'number' || amount <= 0) {
        throw new GraphQLError('Projection amount must be > 0', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      const n = Math.max(0, Math.min(120, Math.floor(count || 0))); // safety bound
      const bucketDocs = await Bucket.find().sort({ spillOverOrder: 1 });
      let working: BucketState[] = bucketDocs.map(docToBucketState);

      const periods: any[] = [];
      let runningTotal = working.reduce((s, b) => s + b.balance, 0);

      for (let i = 1; i <= n; i++) {
        const calc = calculateDepositAllocation(amount, working);
        // advance working state using projected (pure)
        working = working.map((w) => ({
          ...w,
          balance: calc.projectedBalances[w.id] ?? w.balance,
        }));
        const periodTotal = working.reduce((s, b) => s + b.balance, 0);
        periods.push({
          period: i,
          totalBalance: Math.round(periodTotal * 100) / 100,
          bucketProjections: working.map((w) => ({
            bucketId: w.id,
            bucketName: w.name,
            projectedBalance: Math.round(w.balance * 100) / 100,
          })),
        });
        runningTotal = periodTotal;
      }

      return {
        amount,
        count: n,
        periods,
        finalProjectedTotal: Math.round(runningTotal * 100) / 100,
      };
    },
  },
  Mutation: {
    addMessage: (_parent, { text }, context) => {
      return context.messagesStore.add(text);
    },
    recordAgentMetric: async (_parent, { input }) => {
      const doc = await AgentMetric.create({
        ...input,
        rawSummary: input.rawSummary ? JSON.parse(input.rawSummary) : undefined,
      });
      return doc.toObject();
    },

    // === Real BankBuckets foundation (Mongoose + portable calc) ===
    configureBuckets: async (_parent, { configs }) => {
      if (!Array.isArray(configs)) {
        throw new GraphQLError('configs must be an array', { extensions: { code: 'BAD_USER_INPUT' } });
      }
      await Bucket.deleteMany({});
      const created: any[] = [];
      for (const cfg of configs) {
        const doc = await Bucket.create({
          name: cfg.name,
          percentAlloc: cfg.percentAlloc,
          maxAmount: cfg.maxAmount ?? null,
          spillOverOrder: cfg.spillOverOrder ?? 100,
          spillOverBucketUsed: cfg.spillOverBucketUsed ? new mongoose.Types.ObjectId(cfg.spillOverBucketUsed) : null,
          parent: cfg.parentId ? new mongoose.Types.ObjectId(cfg.parentId) : null, // Brief 1/2: parentId now wired (was hardcoded null); supports model + children/parent resolvers + docToBucketState + UI parentId in configs. (Full remap on delete+recreate for stable cross-config hierarchy refs is future; names/order stable in v1.)
          balance: 0,
          goal: cfg.goalId ? new mongoose.Types.ObjectId(cfg.goalId) : null,
        });
        created.push(toGql(doc));
      }
      return created as any;
    },

    createGoal: async (_parent, { name, targetAmount, description }) => {
      if (!name || typeof targetAmount !== 'number' || targetAmount <= 0) {
        throw new GraphQLError('name and positive targetAmount required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      const createPayload: any = { name, targetAmount };
      if (description) createPayload.description = description;
      const doc = await Goal.create(createPayload);
      return toGql(doc) as any;
    },

    linkGoal: async (_parent, { bucketId, goalId }) => {
      // Brief 1: robust linkGoal (was basic find+mutate+save)
      if (!mongoose.Types.ObjectId.isValid(bucketId) || !mongoose.Types.ObjectId.isValid(goalId)) {
        throw new GraphQLError('Invalid bucketId or goalId', { extensions: { code: 'BAD_USER_INPUT' } });
      }
      // Validate goal exists upfront
      const goal = await Goal.findById(goalId);
      if (!goal) {
        throw new GraphQLError('Goal not found', { extensions: { code: 'NOT_FOUND' } });
      }
      const updated = await Bucket.findByIdAndUpdate(
        bucketId,
        { goal: new mongoose.Types.ObjectId(goalId) },
        { new: true }
      );
      if (!updated) {
        throw new GraphQLError('Bucket not found', { extensions: { code: 'NOT_FOUND' } });
      }
      return toGql(updated) as any;
    },

    simulateDeposit: async (_parent, { amount }) => {
      if (typeof amount !== 'number' || amount <= 0) {
        throw new GraphQLError('Deposit amount must be > 0', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      const bucketDocs = await Bucket.find().sort({ spillOverOrder: 1 });
      if (bucketDocs.length === 0) {
        throw new GraphQLError('No buckets configured. Call configureBuckets first.', {
          extensions: { code: 'PRECONDITION_FAILED' },
        });
      }
      const states = bucketDocs.map(docToBucketState);
      const nameMap = new Map(states.map((s) => [s.id, s.name]));
      // IAEP Remainder Carry-Forward (per PO brief + back-end persona): fetch prior real deposit remainder (only applies from DB, not sims)
      const lastDepDocForSim = await Deposit.findOne().sort({ timestamp: -1 });
      const carry = (lastDepDocForSim as any)?.remainder || 0;
      const toDistribute = amount + carry;
      const calc = calculateDepositAllocation(toDistribute, states);

      // Return as Deposit shape (synthetic id for simulate; full shape for client + cache patterns)
      const syntheticId = `sim-${Date.now()}`;
      return {
        id: syntheticId,
        amount,
        timestamp: new Date().toISOString(),
        allocations: buildAllocationEmbeds(calc.allocations, nameMap),
        totalAllocated: calc.totalAllocated,
        remainder: calc.remainder,
        carryAmount: carry,
      } as any;
    },

    applyDeposit: async (_parent, { amount }) => {
      if (typeof amount !== 'number' || amount <= 0) {
        throw new GraphQLError('Deposit amount must be > 0', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      const bucketDocs = await Bucket.find().sort({ spillOverOrder: 1 });
      if (bucketDocs.length === 0) {
        throw new GraphQLError('No buckets configured. Call configureBuckets first.', {
          extensions: { code: 'PRECONDITION_FAILED' },
        });
      }
      const states = bucketDocs.map(docToBucketState);
      const nameMap = new Map(states.map((s) => [s.id, s.name]));
      // IAEP Remainder Carry-Forward (per PO brief): const carry = lastDep?.remainder || 0; const toDistribute = amount + carry; calc = calculate...(reuse core unchanged)
      const lastDepDoc = await Deposit.findOne().sort({ timestamp: -1 });
      const carry = (lastDepDoc as any)?.remainder || 0;
      const toDistribute = amount + carry;
      const calc = calculateDepositAllocation(toDistribute, states);

      // Persist balance updates (authoritative apply)
      for (const bDoc of bucketDocs) {
        const sid = bDoc.id ?? bDoc._id.toString();
        const newBal = calc.projectedBalances[sid];
        if (typeof newBal === 'number') {
          bDoc.balance = newBal;
          await bDoc.save();
        }
      }

      // Create historical Deposit with embedded allocation results
      const allocEmbeds = buildAllocationEmbeds(calc.allocations, nameMap);
      const depDoc = await Deposit.create({
        amount,
        timestamp: new Date(),
        allocations: allocEmbeds,
        totalAllocated: calc.totalAllocated,
        remainder: calc.remainder,
        carryAmount: carry,
      });

      return toGql(depDoc) as any;
    },
  },

  // Bucket field resolvers for hierarchy + goal linkage (populated on demand; works with toObject() output)
  Bucket: {
    children: async (parent: any) => {
      const pid = parent?.id ?? (parent?._id ? parent._id.toString() : null);
      if (!pid) return [];
      const kids = await Bucket.find({ parent: pid }).sort({ spillOverOrder: 1, name: 1 });
      return kids.map((k) => toGql(k)) as any;
    },
    parent: async (parent: any) => {
      const p = parent?.parent;
      if (!p) return null;
      const pdoc = await Bucket.findById(p);
      return pdoc ? (toGql(pdoc) as any) : null;
    },
    goal: async (parent: any) => {
      const g = parent?.goal;
      if (!g) return null;
      const gdoc = await Goal.findById(g);
      return gdoc ? (toGql(gdoc) as any) : null;
    },
  },
};
