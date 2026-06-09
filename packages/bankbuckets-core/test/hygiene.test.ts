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

  it('hierarchy scaffold (parent+child) allocates via v2 recursive subdivide (Brief 4), no NaN', () => {
    // Updated for v2: per-level % sum to 1.0 under parent (root 1.0 subtree fully to child 1.0); child receives 1000
    // (was v1 direct 400 in scaffold). Still exercises parentId/childrenMap + recursion. Flat 20000 case above unchanged.
    const hierSeed: BucketState[] = [
      { id: 'r1', name: 'RootAlloc', percentAlloc: 1.0, maxAmount: null, spillOverOrder: 10, balance: 0, parentId: null, spillOverBucketUsed: null },
      { id: 'c1', name: 'ChildAlloc', percentAlloc: 1.0, maxAmount: null, spillOverOrder: 20, balance: 0, parentId: 'r1', spillOverBucketUsed: null },
    ];
    const hres = calculateDepositAllocation(1000, hierSeed);

    expect(hres.totalAllocated).toBe(1000);
    expect(Number.isFinite(hres.remainder)).toBe(true);

    const childA = hres.allocations.find((a) => a.bucketId === 'c1');
    expect(childA).toBeDefined();
    expect(childA!.allocated).toBe(1000);
  });

  it('v2 multi-level parent/child spillover (root subtree cap on child + excess spills to sibling child via waterfall; realistic parentId + caps)', () => {
    const seed: BucketState[] = [
      { id: 'root', name: 'SavingsRoot', percentAlloc: 1.0, maxAmount: null, spillOverOrder: 10, balance: 0, parentId: null, spillOverBucketUsed: null },
      { id: 'c1', name: 'EmergencyChild', percentAlloc: 0.4, maxAmount: 2000, spillOverOrder: 20, balance: 0, parentId: 'root', spillOverBucketUsed: null },
      { id: 'c2', name: 'VacationChild', percentAlloc: 0.6, maxAmount: null, spillOverOrder: 30, balance: 0, parentId: 'root', spillOverBucketUsed: null },
    ];
    const result = calculateDepositAllocation(10000, seed);

    expect(result.totalAllocated).toBe(10000);
    expect(result.remainder).toBe(0);

    const c1 = result.allocations.find((a) => a.bucketId === 'c1');
    const c2 = result.allocations.find((a) => a.bucketId === 'c2');

    expect(c1).toBeDefined();
    expect(c1!.allocated).toBe(2000);
    expect(c1!.capped).toBe(true);

    expect(c2).toBeDefined();
    expect(c2!.allocated).toBe(8000); // 6000 intended + 2000 spill from c1 cap
    expect(c2!.capped).toBe(false);

    // hygiene: no NaN anywhere
    const hasNaNAlloc = result.allocations.some(
      (a) => typeof a.allocated !== 'number' || !Number.isFinite(a.allocated) || isNaN(a.allocated) || typeof a.capped !== 'boolean'
    );
    const hasNaNProj = Object.values(result.projectedBalances).some((v) => typeof v !== 'number' || !Number.isFinite(v) || isNaN(v));
    const hasNaNTotals = !Number.isFinite(result.totalAllocated) || !Number.isFinite(result.remainder) || isNaN(result.totalAllocated) || isNaN(result.remainder);

    expect(hasNaNAlloc).toBe(false);
    expect(hasNaNProj).toBe(false);
    expect(hasNaNTotals).toBe(false);

    expect(result.projectedBalances.c1).toBe(2000);
    expect(result.projectedBalances.c2).toBe(8000);
  });

  it('v2 with explicit spillOverBucketUsed on leaf + 3-level parentId chain (mid container subdivides; cap + spill target)', () => {
    const seed: BucketState[] = [
      { id: 'r', name: 'Root', percentAlloc: 1.0, maxAmount: null, spillOverOrder: 5, balance: 0, parentId: null, spillOverBucketUsed: null },
      { id: 'm', name: 'MidContainer', percentAlloc: 1.0, maxAmount: null, spillOverOrder: 10, balance: 0, parentId: 'r', spillOverBucketUsed: null },
      { id: 'l1', name: 'LeafCap', percentAlloc: 0.3, maxAmount: 800, spillOverOrder: 20, balance: 0, parentId: 'm', spillOverBucketUsed: 'l2' },
      { id: 'l2', name: 'LeafSpillTarget', percentAlloc: 0.7, maxAmount: null, spillOverOrder: 30, balance: 0, parentId: 'm', spillOverBucketUsed: null },
    ];
    const result = calculateDepositAllocation(5000, seed);

    expect(result.totalAllocated).toBe(5000);
    expect(result.remainder).toBe(0);

    const l1 = result.allocations.find((a) => a.bucketId === 'l1');
    const l2 = result.allocations.find((a) => a.bucketId === 'l2');

    expect(l1).toBeDefined();
    expect(l1!.allocated).toBe(800);
    expect(l1!.capped).toBe(true);
    expect(l1!.spillOverBucketUsed).toBe('l2');

    expect(l2).toBeDefined();
    expect(l2!.allocated).toBe(4200); // 3500 + 700 from l1 cap spill

    const hasNaN = result.allocations.some((a) => typeof a.allocated !== 'number' || !Number.isFinite(a.allocated) || isNaN(a.allocated) || typeof a.capped !== 'boolean') ||
                   Object.values(result.projectedBalances).some((v) => typeof v !== 'number' || !Number.isFinite(v) || isNaN(v));
    expect(hasNaN).toBe(false);

    // containers should receive no direct allocation (fully subdivided via v2)
    expect(result.allocations.find((a) => a.bucketId === 'r' || a.bucketId === 'm')).toBeUndefined();
    expect(result.projectedBalances.l1).toBe(800);
    expect(result.projectedBalances.l2).toBe(4200);
  });

  it('v2 deep hierarchy + normalized child pcts (sum<1) + remainder when top root partial + caps at leaf (multi-level + caps + spillOverBucketUsed)', () => {
    const seed: BucketState[] = [
      { id: 'top', name: 'Top', percentAlloc: 0.8, maxAmount: null, spillOverOrder: 1, balance: 0, parentId: null, spillOverBucketUsed: null },
      { id: 'sub', name: 'Sub', percentAlloc: 1.0, maxAmount: null, spillOverOrder: 2, balance: 0, parentId: 'top', spillOverBucketUsed: null },
      { id: 'g1', name: 'Grand1', percentAlloc: 0.25, maxAmount: 300, spillOverOrder: 10, balance: 0, parentId: 'sub', spillOverBucketUsed: null },
      { id: 'g2', name: 'Grand2', percentAlloc: 0.35, maxAmount: null, spillOverOrder: 20, balance: 0, parentId: 'sub', spillOverBucketUsed: 'g1' },
    ];
    const result = calculateDepositAllocation(2000, seed);

    // top root share 1600 (0.8*2000) fully to sub; children weights 0.25+0.35=0.6 normalized; g1 share~666.67 capped@300
    // excess~366.67 spills to g2 (g2 base~933.33 + excess =1300); remainder 400 from unused top 0.2
    expect(result.totalAllocated).toBe(1600);
    expect(result.remainder).toBe(400);

    const g1 = result.allocations.find((a) => a.bucketId === 'g1');
    const g2 = result.allocations.find((a) => a.bucketId === 'g2');

    expect(g1).toBeDefined();
    expect(g1!.allocated).toBe(300);
    expect(g1!.capped).toBe(true);

    expect(g2).toBeDefined();
    expect(g2!.allocated).toBeCloseTo(1300, 2);
    expect(g2!.spillOverBucketUsed).toBe('g1');

    const hasNaNAlloc = result.allocations.some(
      (a) => typeof a.allocated !== 'number' || !Number.isFinite(a.allocated) || isNaN(a.allocated) || typeof a.capped !== 'boolean'
    );
    const hasNaNProj = Object.values(result.projectedBalances).some((v) => typeof v !== 'number' || !Number.isFinite(v) || isNaN(v));
    const hasNaNTotals = !Number.isFinite(result.totalAllocated) || !Number.isFinite(result.remainder) || isNaN(result.totalAllocated) || isNaN(result.remainder);
    expect(hasNaNAlloc).toBe(false);
    expect(hasNaNProj).toBe(false);
    expect(hasNaNTotals).toBe(false);

    expect(result.projectedBalances.g1).toBe(300);
    expect(result.projectedBalances.g2).toBeCloseTo(1300, 2);
  });

  it('runHygieneTest() executes fully and passes its internal asserts (for bun -e hygiene fallback compat)', () => {
    // runHygieneTest logs + does internal throws on fail; here we just ensure it does not throw
    expect(() => runHygieneTest()).not.toThrow();
  });
});
