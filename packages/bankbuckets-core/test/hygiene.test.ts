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

  it('handles NaN/neg/zero deposit inputs + bad bucket data (NaN pct, neg max, zero pct) -> finite 0-allocs, remainder=0 for non-positive, no NaN out (exercises v2 top guard + pct Math.max(0) + post guards)', () => {
    const goodSeed: BucketState[] = [
      { id: 'b1', name: 'Emergency', percentAlloc: 0.4, maxAmount: 5000, spillOverOrder: 10, balance: 0, spillOverBucketUsed: null },
      { id: 'b2', name: 'Vacation', percentAlloc: 0.25, maxAmount: 10000, spillOverOrder: 20, balance: 0, spillOverBucketUsed: null },
    ];
    // NaN deposit (previously would leak NaN to remainder; now guarded)
    const rNaN = calculateDepositAllocation(NaN as any, goodSeed);
    expect(rNaN.totalAllocated).toBe(0);
    expect(rNaN.remainder).toBe(0);
    let hasNaN = rNaN.allocations.some((a) => typeof a.allocated !== 'number' || !Number.isFinite(a.allocated) || isNaN(a.allocated) || typeof a.capped !== 'boolean') ||
                 Object.values(rNaN.projectedBalances).some((v) => typeof v !== 'number' || !Number.isFinite(v) || isNaN(v)) ||
                 !Number.isFinite(rNaN.totalAllocated) || !Number.isFinite(rNaN.remainder) || isNaN(rNaN.totalAllocated) || isNaN(rNaN.remainder);
    expect(hasNaN).toBe(false);

    // zero deposit
    const r0 = calculateDepositAllocation(0, goodSeed);
    expect(r0.totalAllocated).toBe(0);
    expect(r0.remainder).toBe(0);
    hasNaN = !Number.isFinite(r0.totalAllocated) || !Number.isFinite(r0.remainder) || isNaN(r0.totalAllocated) || isNaN(r0.remainder);
    expect(hasNaN).toBe(false);

    // negative deposit
    const rNeg = calculateDepositAllocation(-999, goodSeed);
    expect(rNeg.totalAllocated).toBe(0);
    expect(rNeg.remainder).toBe(0);

    // positive deposit but all roots have 0/NaN pct -> 0 alloc, full remainder (normalization + max(0) paths)
    const badPctSeed: BucketState[] = [
      { id: 'z1', name: 'Zero', percentAlloc: 0, maxAmount: null, spillOverOrder: 10, balance: 0, spillOverBucketUsed: null },
      { id: 'z2', name: 'NaNPct', percentAlloc: NaN, maxAmount: null, spillOverOrder: 20, balance: 50, spillOverBucketUsed: null },
    ];
    const rBadP = calculateDepositAllocation(1234, badPctSeed);
    expect(rBadP.totalAllocated).toBe(0);
    expect(rBadP.remainder).toBe(1234);
    hasNaN = rBadP.allocations.some((a) => typeof a.allocated !== 'number' || !Number.isFinite(a.allocated) || isNaN(a.allocated) || typeof a.capped !== 'boolean') ||
             Object.values(rBadP.projectedBalances).some((v) => typeof v !== 'number' || !Number.isFinite(v) || isNaN(v));
    expect(hasNaN).toBe(false);
    // also neg max treated as uncapped but with 0 share from pct
    const negMaxSeed: BucketState[] = [{ id: 'nm', name: 'NegMax', percentAlloc: 1.0, maxAmount: -10, spillOverOrder: 5, balance: 0, spillOverBucketUsed: null }];
    const rNegM = calculateDepositAllocation(100, negMaxSeed);
    expect(rNegM.totalAllocated).toBe(100); // no cap applied (max<0 guard), finite
    expect(rNegM.remainder).toBe(0);
  });

  it('deeper 4+ level spillover with caps (root->c1->c2->c3->leaves; explicit spill + waterfall at bottom; v2 containers get 0 direct alloc)', () => {
    // 5-level chain (root depth0 + 3 cont + leaves): exercises distributeSubtree recursion depth + spillover reuse at deep level + cap at leaf
    const seed: BucketState[] = [
      { id: 'r', name: 'R', percentAlloc: 1.0, maxAmount: null, spillOverOrder: 1, balance: 0, parentId: null, spillOverBucketUsed: null },
      { id: 'c1', name: 'C1', percentAlloc: 1.0, maxAmount: null, spillOverOrder: 2, balance: 0, parentId: 'r', spillOverBucketUsed: null },
      { id: 'c2', name: 'C2', percentAlloc: 1.0, maxAmount: null, spillOverOrder: 3, balance: 0, parentId: 'c1', spillOverBucketUsed: null },
      { id: 'c3', name: 'C3', percentAlloc: 1.0, maxAmount: null, spillOverOrder: 4, balance: 0, parentId: 'c2', spillOverBucketUsed: null },
      { id: 'l1', name: 'L1Cap', percentAlloc: 0.4, maxAmount: 1200, spillOverOrder: 10, balance: 0, parentId: 'c3', spillOverBucketUsed: 'l2' },
      { id: 'l2', name: 'L2', percentAlloc: 0.6, maxAmount: null, spillOverOrder: 20, balance: 0, parentId: 'c3', spillOverBucketUsed: null },
    ];
    const result = calculateDepositAllocation(10000, seed);

    expect(result.totalAllocated).toBe(10000);
    expect(result.remainder).toBe(0);

    const l1 = result.allocations.find((a) => a.bucketId === 'l1');
    const l2 = result.allocations.find((a) => a.bucketId === 'l2');

    expect(l1).toBeDefined();
    expect(l1!.allocated).toBe(1200);
    expect(l1!.capped).toBe(true);
    expect(l1!.spillOverBucketUsed).toBe('l2');

    expect(l2).toBeDefined();
    expect(l2!.allocated).toBe(8800); // 6000 base + 2800 spill from l1

    // no direct alloc to any container (v2 subdivide)
    expect(result.allocations.find((a) => ['r','c1','c2','c3'].includes(a.bucketId))).toBeUndefined();

    const hasNaN = result.allocations.some((a) => typeof a.allocated !== 'number' || !Number.isFinite(a.allocated) || isNaN(a.allocated) || typeof a.capped !== 'boolean') ||
                   Object.values(result.projectedBalances).some((v) => typeof v !== 'number' || !Number.isFinite(v) || isNaN(v)) ||
                   !Number.isFinite(result.totalAllocated) || !Number.isFinite(result.remainder);
    expect(hasNaN).toBe(false);

    expect(result.projectedBalances.l1).toBe(1200);
    expect(result.projectedBalances.l2).toBe(8800);
  });

  it('remainder when all capped at subtree + normalization sum<1 at multiple levels (top unused 0.3 + level2 sum=0.6 + caps leave unplaced)', () => {
    // root pct=1.0 share=2000
    // children under root: subA pct=0.5, subB pct=0.2 (sum=0.7<1 => ~0.3*2000=600 top-level remainder component)
    // under subA (receives ~1428.57): g1 pct=0.4, g2 pct=0.2 (sum=0.6<1 => further remainder at level)
    // All terminals capped (subB max=100, g1=200, g2=150) so subtree share + cross-spill from g excess cannot fully place -> remainder from caps + multi-level unused pcts
    // (global waterfall allows some g-excess to subB up to its cap, but then lost)
    const seed: BucketState[] = [
      { id: 'root', name: 'Root', percentAlloc: 1.0, maxAmount: null, spillOverOrder: 1, balance: 0, parentId: null, spillOverBucketUsed: null },
      { id: 'subA', name: 'SubA', percentAlloc: 0.5, maxAmount: null, spillOverOrder: 2, balance: 0, parentId: 'root', spillOverBucketUsed: null },
      { id: 'subB', name: 'SubB', percentAlloc: 0.2, maxAmount: 100, spillOverOrder: 3, balance: 0, parentId: 'root', spillOverBucketUsed: null },
      { id: 'g1', name: 'G1Cap', percentAlloc: 0.4, maxAmount: 200, spillOverOrder: 10, balance: 0, parentId: 'subA', spillOverBucketUsed: null },
      { id: 'g2', name: 'G2Cap', percentAlloc: 0.2, maxAmount: 150, spillOverOrder: 20, balance: 0, parentId: 'subA', spillOverBucketUsed: null },
    ];
    const result = calculateDepositAllocation(2000, seed);

    // subB share~571 but capped@100; subA~1428; g1~952 capped@200; g2~476 capped@150; g-excess spills to subB (up to cap) but rest + subB excess lost
    // totalAllocated = 100 + 200 + 150 = 450; remainder = 1550 (multi-level norm<1 unused + all-capped subtree losses)
    expect(result.totalAllocated).toBeCloseTo(450, 0);
    expect(result.remainder).toBeCloseTo(1550, 0);

    const subB = result.allocations.find((a) => a.bucketId === 'subB');
    const g1 = result.allocations.find((a) => a.bucketId === 'g1');
    const g2 = result.allocations.find((a) => a.bucketId === 'g2');

    expect(subB).toBeDefined();
    expect(subB!.allocated).toBe(100);
    expect(subB!.capped).toBe(true);

    expect(g1).toBeDefined();
    expect(g1!.allocated).toBe(200);
    expect(g1!.capped).toBe(true);

    expect(g2).toBeDefined();
    expect(g2!.allocated).toBe(150);
    expect(g2!.capped).toBe(true);

    // containers receive no direct allocation entries (v2)
    expect(result.allocations.find((a) => a.bucketId === 'root' || a.bucketId === 'subA')).toBeUndefined();

    const hasNaNAlloc = result.allocations.some(
      (a) => typeof a.allocated !== 'number' || !Number.isFinite(a.allocated) || isNaN(a.allocated) || typeof a.capped !== 'boolean'
    );
    const hasNaNProj = Object.values(result.projectedBalances).some((v) => typeof v !== 'number' || !Number.isFinite(v) || isNaN(v));
    const hasNaNTotals = !Number.isFinite(result.totalAllocated) || !Number.isFinite(result.remainder) || isNaN(result.totalAllocated) || isNaN(result.remainder);
    expect(hasNaNAlloc).toBe(false);
    expect(hasNaNProj).toBe(false);
    expect(hasNaNTotals).toBe(false);

    expect(result.projectedBalances.subB).toBe(100);
    expect(result.projectedBalances.g1).toBe(200);
    expect(result.projectedBalances.g2).toBe(150);
  });
});
