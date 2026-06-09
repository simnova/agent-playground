import { describe, it, expect } from 'vitest';
import {
  calculateDepositAllocation,
  runHygieneTest,
  type BucketState,
} from '../src/index';

describe('bankbuckets-core hygiene cases (architect sugg 1: shared pure calc)', () => {
  it('high-deposit 20000 4-bucket seed produces expected caps + spill (no NaN, matches prior verifier @e + metrics)', () => {
    const seed: BucketState[] = [
      { id: 'b1', name: 'Emergency', percentAlloc: 0.4, maxAmount: 5000, spillOverOrder: 10, balance: 0, spillOverBucketUsed: null },
      { id: 'b2', name: 'Vacation', percentAlloc: 0.25, maxAmount: 10000, spillOverOrder: 20, balance: 0, spillOverBucketUsed: null },
      { id: 'b3', name: 'Retirement', percentAlloc: 0.2, maxAmount: 15000, spillOverOrder: 30, balance: 0, spillOverBucketUsed: null },
      { id: 'b4', name: 'Buffer', percentAlloc: 0.15, maxAmount: null, spillOverOrder: 40, balance: 0, spillOverBucketUsed: null },
    ];
    const result = calculateDepositAllocation(20000, seed);

    expect(result.totalAllocated).toBe(20000);
    expect(result.remainder).toBe(0);

    const emerg = result.allocations.find((a) => a.bucketId === 'b1');
    const vac = result.allocations.find((a) => a.bucketId === 'b2');

    expect(emerg).toBeDefined();
    expect(emerg!.allocated).toBe(5000);
    expect(emerg!.capped).toBe(true);

    expect(vac).toBeDefined();
    expect(vac!.allocated).toBe(8000);
    expect(vac!.capped).toBe(false);

    // hygiene: no NaN anywhere
    const hasNaNAlloc = result.allocations.some(
      (a) => typeof a.allocated !== 'number' || !Number.isFinite(a.allocated) || isNaN(a.allocated) || typeof a.capped !== 'boolean'
    );
    const hasNaNProj = Object.values(result.projectedBalances).some((v) => typeof v !== 'number' || !Number.isFinite(v) || isNaN(v));
    const hasNaNTotals = !Number.isFinite(result.totalAllocated) || !Number.isFinite(result.remainder) || isNaN(result.totalAllocated) || isNaN(result.remainder);

    expect(hasNaNAlloc).toBe(false);
    expect(hasNaNProj).toBe(false);
    expect(hasNaNTotals).toBe(false);

    // projected sample
    expect(result.projectedBalances.b1).toBe(5000);
    expect(result.projectedBalances.b2).toBe(8000);
  });

  it('hierarchy scaffold (parent+child) allocates direct shares (v1 compat), no NaN', () => {
    const hierSeed: BucketState[] = [
      { id: 'r1', name: 'RootAlloc', percentAlloc: 0.6, maxAmount: null, spillOverOrder: 10, balance: 0, parentId: null, spillOverBucketUsed: null },
      { id: 'c1', name: 'ChildAlloc', percentAlloc: 0.4, maxAmount: null, spillOverOrder: 20, balance: 0, parentId: 'r1', spillOverBucketUsed: null },
    ];
    const hres = calculateDepositAllocation(1000, hierSeed);

    expect(hres.totalAllocated).toBe(1000);
    expect(Number.isFinite(hres.remainder)).toBe(true);

    const childA = hres.allocations.find((a) => a.bucketId === 'c1');
    expect(childA).toBeDefined();
    expect(childA!.allocated).toBe(400);
  });

  it('runHygieneTest() executes fully and passes its internal asserts (for bun -e hygiene fallback compat)', () => {
    // runHygieneTest logs + does internal throws on fail; here we just ensure it does not throw
    expect(() => runHygieneTest()).not.toThrow();
  });
});
