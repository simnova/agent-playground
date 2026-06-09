import mongoose from 'mongoose';

// ========================================
// Goal (aspirational target linked to one or more buckets)
// ========================================
export interface IGoal {
  name: string;
  targetAmount: number;
  description?: string;
  createdAt: Date;
}

const GoalSchema = new mongoose.Schema<IGoal>({
  name: { type: String, required: true, index: true },
  targetAmount: { type: Number, required: true },
  description: String,
  createdAt: { type: Date, default: Date.now, index: true },
});

GoalSchema.virtual('id').get(function (this: any) {
  return this._id.toString();
});
GoalSchema.set('toObject', { virtuals: true, versionKey: false });

export const Goal = mongoose.model<IGoal>('Goal', GoalSchema);

// ========================================
// Bucket (core of BankBuckets methodology)
// - percentAlloc: direct share of deposit (0.0-1.0+). Configure roots/levels to sum ~1.0
// - maxAmount: cap (null = uncapped)
// - spillOverOrder: priority in waterfall (lower number = earlier consideration for excess)
// - spillOverBucketUsed: explicit target bucket ID for spillover from this one (preferred over order scan)
// - parent: ref for hierarchy (children resolved via query parent==this)
// - balance: current persisted amount in this bucket
// - goal: optional link to aspirational Goal
// ========================================
export interface IBucket {
  name: string;
  percentAlloc: number;
  maxAmount: number | null;
  spillOverOrder: number;
  spillOverBucketUsed?: mongoose.Types.ObjectId | null;
  parent?: mongoose.Types.ObjectId | null;
  balance: number;
  goal?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const BucketSchema = new mongoose.Schema<IBucket>(
  {
    name: { type: String, required: true, index: true },
    percentAlloc: { type: Number, required: true, default: 0 },
    maxAmount: { type: Number, default: null },
    spillOverOrder: { type: Number, required: true, default: 100, index: true },
    spillOverBucketUsed: { type: mongoose.Schema.Types.ObjectId, ref: 'Bucket', default: null },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Bucket', default: null, index: true },
    balance: { type: Number, required: true, default: 0 },
    goal: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', default: null },
  },
  { timestamps: true }
);

BucketSchema.virtual('id').get(function (this: any) {
  return this._id.toString();
});
BucketSchema.set('toObject', { virtuals: true, versionKey: false });

// Helpful compound index for common queries (hierarchy + order)
BucketSchema.index({ parent: 1, spillOverOrder: 1 });

export const Bucket = mongoose.model<IBucket>('Bucket', BucketSchema);

// ========================================
// Deposit (historical record of a deposit + the exact allocation results from the engine)
// - amount: the input deposit
// - allocations: embedded snapshot of results (bucketId + name at time + amounts + cap/spill decisions)
//   Using mixed-style array for portability of historical records (no live ref breakage).
// ========================================
export interface IAllocationResult {
  bucketId: string;
  bucketName?: string;
  allocated: number;
  capped: boolean;
  spillOverBucketUsed?: string | null;
}

export interface IDeposit {
  amount: number;
  timestamp: Date;
  allocations: IAllocationResult[];
  totalAllocated: number;
  remainder: number;
  carryAmount: number;
  createdAt: Date;
}

const AllocationResultSchema = new mongoose.Schema(
  {
    bucketId: { type: String, required: true },
    bucketName: String,
    allocated: { type: Number, required: true },
    capped: { type: Boolean, required: true, default: false },
    spillOverBucketUsed: { type: String, default: null },
  },
  { _id: false }
);

const DepositSchema = new mongoose.Schema<IDeposit>({
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  allocations: { type: [AllocationResultSchema], default: [] },
  totalAllocated: { type: Number, default: 0 },
  remainder: { type: Number, default: 0 },
  carryAmount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

DepositSchema.virtual('id').get(function (this: any) {
  return this._id.toString();
});
DepositSchema.set('toObject', { virtuals: true, versionKey: false });

DepositSchema.index({ timestamp: -1 });

export const Deposit = mongoose.model<IDeposit>('Deposit', DepositSchema);
