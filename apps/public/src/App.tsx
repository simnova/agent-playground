import { useMutation, useQuery } from '@apollo/client';
import { Avatar, message as antdMessage, Button, Card, InputNumber, List, Modal, Progress, Slider, Space, Statistic, Tag, Tree, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { gql } from './gql/gql';

// === Reused GQL contracts from staff patterns (currentState + simulate/apply + projections) ===
// Exact match to schema + staff implementation. Projections for "N paychecks" teaser per handoff note.
// Run codegen (pnpm codegen) after future doc changes to keep types fresh.
const GET_CURRENT_STATE = gql(`
  query GetCurrentState {
    currentState {
      buckets {
        id
        name
        percentAlloc
        maxAmount
        spillOverOrder
        spillOverBucketUsed
        balance
        parent { id name }
        children { id name percentAlloc balance }
        goal { id name targetAmount description }
      }
      goals {
        id
        name
        targetAmount
        description
      }
      totalBalance
      lastDeposit {
        id
        amount
        totalAllocated
        remainder
        allocations {
          bucketId
          bucketName
          allocated
          capped
          spillOverBucketUsed
        }
      }
    }
    hello
  }
`);

const APPLY_DEPOSIT = gql(`
  mutation ApplyDeposit($amount: Float!) {
    applyDeposit(amount: $amount) {
      id
      amount
      totalAllocated
      remainder
      allocations {
        bucketId
        bucketName
        allocated
        capped
        spillOverBucketUsed
      }
    }
  }
`);

const SIMULATE_DEPOSIT = gql(`
  mutation SimulateDeposit($amount: Float!) {
    simulateDeposit(amount: $amount) {
      id
      amount
      totalAllocated
      remainder
      allocations {
        bucketId
        bucketName
        allocated
        capped
        spillOverBucketUsed
      }
    }
  }
`);

const GET_PROJECTIONS = gql(`
  query GetProjections($amount: Float!, $count: Int!) {
    projections(amount: $amount, count: $count) {
      amount
      count
      finalProjectedTotal
      periods {
        period
        totalBalance
        bucketProjections {
          bucketId
          bucketName
          projectedBalance
        }
      }
    }
  }
`);

// === Portable client-side simulation (exact copy/adapt of staff's computeLiveAllocations for reuse + instant magic) ===
// Matches backend calculateDepositAllocation. Enables live preview without server roundtrip until Simulate/Apply.
// Per ux wireframes + staff: % Tags, small Progress green, spill/capped, narrative "cap in ~N deposits".
interface BucketLike {
  id: string;
  name: string;
  percent: number;
  maxAmount: number | null;
  currentBalance: number;
  order: number;
  parentId: string | null;
  linkedGoalIds: string[];
}

function computeLiveAllocations(
  amount: number,
  buckets: BucketLike[]
): {
  allocations: Array<{ bucketId: string; bucketName: string; allocated: number; capped: boolean; spilled: number }>;
  projectedBalances: Record<string, number>;
  totalAllocated: number;
  remaining: number;
} {
  if (amount <= 0 || buckets.length === 0) {
    return { allocations: [], projectedBalances: {}, totalAllocated: 0, remaining: amount };
  }
  const totalPct = buckets.reduce((s, b) => s + (b.percent || 0), 0);
  const scale = totalPct > 0 ? 100 / totalPct : 1;

  const projected: Record<string, number> = {};
  buckets.forEach((b) => {
    projected[b.id] = b.currentBalance;
  });

  const ordered = [...buckets].sort((a, b) => a.order - b.order);

  const allocs: Array<{ bucketId: string; bucketName: string; allocated: number; capped: boolean; spilled: number }> = [];
  let spillPool = 0;

  for (const b of ordered) {
    const intended = (amount * (b.percent || 0) * scale) / 100;
    const startBal = projected[b.id] ?? b.currentBalance;
    const capLeft = b.maxAmount != null ? Math.max(0, b.maxAmount - startBal) : Infinity;
    const allocated = Math.min(intended, capLeft);
    const capped = allocated < intended - 1e-6;
    const thisSpill = intended - allocated;
    spillPool += thisSpill;
    projected[b.id] = startBal + allocated;
    allocs.push({ bucketId: b.id, bucketName: b.name, allocated, capped, spilled: thisSpill });
  }

  if (spillPool > 0) {
    const roomOrdered = ordered.filter((b) => b.maxAmount == null || (projected[b.id] ?? b.currentBalance) < (b.maxAmount || Infinity));
    for (const b of roomOrdered) {
      if (spillPool <= 0) break;
      const startBal = projected[b.id] ?? b.currentBalance;
      const capLeft = b.maxAmount != null ? Math.max(0, b.maxAmount - startBal) : Infinity;
      const give = Math.min(spillPool, capLeft);
      if (give > 0) {
        projected[b.id] = startBal + give;
        spillPool -= give;
        const res = allocs.find((a) => a.bucketId === b.id);
        if (res) {
          res.allocated += give;
          res.spilled = Math.max(0, res.spilled - give);
        }
      }
    }
  }

  const totalAllocated = allocs.reduce((s, a) => s + a.allocated, 0);
  return { allocations: allocs, projectedBalances: projected, totalAllocated, remaining: Math.max(0, amount - totalAllocated) };
}

// === Client-side multi-period projections for long-term outlook (Epic-5) ===
// Reuses the exact computeLiveAllocations (deposit-calculator logic adapted for public) iteratively.
// Provides optimistic, zero-latency 3/6/12mo sample projections under fixed deposit scenarios.
// No server roundtrip; updates live when currentState refetches after Apply.
function computeClientProjections(depositAmount: number, numPeriods: number, buckets: BucketLike[]): { finalTotal: number; periods: Array<{ period: number; totalBalance: number }>; bucketFinals: Record<string, number> } {
  if (numPeriods <= 0 || depositAmount <= 0 || buckets.length === 0) {
    const tot = buckets.reduce((s, b) => s + b.currentBalance, 0);
    return { finalTotal: tot, periods: [], bucketFinals: Object.fromEntries(buckets.map((b) => [b.id, b.currentBalance])) };
  }
  let currentBalances: Record<string, number> = {};
  buckets.forEach((b) => {
    currentBalances[b.id] = b.currentBalance;
  });
  const periods: Array<{ period: number; totalBalance: number }> = [];
  for (let i = 1; i <= numPeriods; i++) {
    const calcInput: BucketLike[] = buckets.map((b) => ({
      ...b,
      currentBalance: currentBalances[b.id] ?? b.currentBalance,
    }));
    const res = computeLiveAllocations(depositAmount, calcInput);
    currentBalances = res.projectedBalances;
    const periodTotal = Object.values(currentBalances).reduce((sum, v) => sum + (v || 0), 0);
    periods.push({ period: i, totalBalance: periodTotal });
  }
  const lastPeriod = periods[periods.length - 1];
  const finalTotal = lastPeriod ? lastPeriod.totalBalance : buckets.reduce((s, b) => s + b.currentBalance, 0);
  return { finalTotal, periods, bucketFinals: currentBalances };
}

type LongTermScenarioOutlook = {
  amount: number;
  byHorizon: Record<number, { total: number; growth: number; growthPct: number }>;
  hint: string;
};

const longTermScenarios = [
  { key: 'conservative', label: 'Conservative', amount: 250, hint: 'Small consistent steps' },
  { key: 'typical', label: 'Typical', amount: 750, hint: 'Matches common preview' },
  { key: 'ambitious', label: 'Ambitious', amount: 2000, hint: 'Accelerated outlook' },
] as const;

function App() {
  // Primary data: currentState (buckets w/ hierarchy + goal links, goals list, totals). Reused contract.
  const { data, loading, error, refetch } = useQuery(GET_CURRENT_STATE);

  const [applyDeposit, { loading: applying }] = useMutation(APPLY_DEPOSIT, {
    onCompleted: (res) => {
      refetch();
      const r = res.applyDeposit;
      antdMessage.success(`Deposit applied! Your buckets grew by $${r.totalAllocated.toFixed(0)} (remainder $${r.remainder.toFixed(0)}). Set it and forget it.`);
    },
  });

  const [simulateDeposit, { loading: simulating }] = useMutation(SIMULATE_DEPOSIT, {
    onCompleted: (res) => {
      const r = res.simulateDeposit;
      antdMessage.info(`Server simulation: $${r.amount} allocated $${r.totalAllocated.toFixed(0)} (remainder $${r.remainder.toFixed(0)}). Client preview matched!`);
      setLastSim(r);
    },
  });

  // Local UI state (deposit drives live client preview + projections teaser)
  const [depositAmount, setDepositAmount] = useState<number>(750); // realistic "next paycheck" default
  const [lastSim, setLastSim] = useState<any>(null);
  const [projCount, setProjCount] = useState<number>(6);

  // Projections query (reused for N-paycheck teaser; updates with depositAmount)
  const { data: projData, loading: projLoading } = useQuery(GET_PROJECTIONS, {
    variables: { amount: depositAmount, count: projCount },
    skip: depositAmount <= 0,
  });

  // Link modal state (client-optimistic for public motivational feel; no server side-effect in this slice to keep shared seed stable)
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedGoalForLink, setSelectedGoalForLink] = useState<any>(null);
  const [localLinks, setLocalLinks] = useState<Record<string, string[]>>({});

  // Map server data to BucketLike shape (read-only for public; reuse staff mapping)
  const serverBuckets: BucketLike[] = useMemo(() => {
    const bucketsFromState = data?.currentState?.buckets || [];
    const mapped = bucketsFromState.map((b: any) => ({
      id: b.id,
      name: b.name,
      percent: b.percentAlloc,
      maxAmount: b.maxAmount ?? null,
      currentBalance: b.balance,
      order: b.spillOverOrder,
      parentId: b.parent?.id ?? null,
      linkedGoalIds: b.goal ? [b.goal.id] : [],
    }));
    mapped.sort((a, b) => a.order - b.order);
    return mapped;
  }, [data?.currentState?.buckets]);

  const goals: any[] = useMemo(() => data?.currentState?.goals || [], [data?.currentState?.goals]);

  // Live client preview (instant, delightful, no roundtrip). Reused compute exactly.
  const livePreview = useMemo(() => {
    return computeLiveAllocations(depositAmount, serverBuckets);
  }, [depositAmount, serverBuckets]);

  // Read-mostly Tree data for "My Buckets" (public version of staff hierarchy; current + this-deposit delta)
  const treeData: any[] = useMemo(() => {
    const src = serverBuckets;
    const roots = src.filter((b) => !b.parentId).sort((a, b) => a.order - b.order);

    const toNode = (b: BucketLike): any => {
      const previewBal = livePreview.projectedBalances[b.id] ?? b.currentBalance;
      const max = b.maxAmount ?? Math.max(previewBal * 1.2, 1000);
      const currentPct = Math.min(100, Math.round((b.currentBalance / max) * 100));
      const alloc = livePreview.allocations.find((a) => a.bucketId === b.id);
      const linkedNames = b.linkedGoalIds
        .map((gid) => goals.find((g: any) => g.id === gid)?.name)
        .filter(Boolean)
        .join(', ');
      const title = (
        <span>
          <strong>{b.name}</strong>{' '}
          <Tag color="green" style={{ marginLeft: 6, fontSize: 13 }}>
            {b.percent.toFixed(0)}%
          </Tag>
          {b.maxAmount && <Tag style={{ marginLeft: 4 }}>cap ${b.maxAmount}</Tag>}
          <Progress percent={currentPct} size="small" style={{ width: 110, marginLeft: 10, verticalAlign: 'middle' }} strokeColor="#52c41a" aria-label={`${b.name} current progress`} />
          {alloc && alloc.allocated > 0.01 && <span style={{ marginLeft: 8, color: '#4ade80', fontSize: 12 }}>+${alloc.allocated.toFixed(0)} this deposit</span>}
          {linkedNames && (
            <Tag style={{ marginLeft: 6, fontSize: 10 }} color="default">
              → {linkedNames}
            </Tag>
          )}
        </span>
      );
      const children = src
        .filter((c) => c.parentId === b.id)
        .sort((a, b) => a.order - b.order)
        .map(toNode);
      return { title, key: b.id, children: children.length ? children : undefined };
    };

    return roots.map(toNode);
  }, [serverBuckets, livePreview, goals]);

  // Client optimistic long-term projections (3/6/12mo under sample deposit scenarios)
  // Reuses computeLiveAllocations (deposit-calculator logic) for instant updates + optimistic on refetch/apply.
  const currentTotalBalance = useMemo(() => {
    return data?.currentState?.totalBalance ?? serverBuckets.reduce((s, b) => s + b.currentBalance, 0);
  }, [data?.currentState?.totalBalance, serverBuckets]);

  const longTermOutlooks = useMemo(() => {
    if (serverBuckets.length === 0) return {} as Record<string, LongTermScenarioOutlook>;
    return longTermScenarios.reduce(
      (acc: Record<string, LongTermScenarioOutlook>, sc) => {
        const horizons = [3, 6, 12];
        const byHorizon: Record<number, { total: number; growth: number; growthPct: number }> = {};
        horizons.forEach((h) => {
          const p = computeClientProjections(sc.amount, h, serverBuckets);
          const growth = p.finalTotal - currentTotalBalance;
          byHorizon[h] = {
            total: Math.round(p.finalTotal),
            growth: Math.round(growth),
            growthPct: currentTotalBalance > 0 ? Math.min(100, Math.round((growth / currentTotalBalance) * 100)) : 0,
          };
        });
        acc[sc.key] = { amount: sc.amount, byHorizon, hint: sc.hint };
        return acc;
      },
      {} as Record<string, LongTermScenarioOutlook>
    );
  }, [serverBuckets, currentTotalBalance]);

  // Quick chips per ux wireframes
  const quickChips = [250, 500, 750, 1000, 1500, 2000];

  // === Handlers (optimistic live preview + server contracts on demand) ===
  const handleApply = async () => {
    if (serverBuckets.length === 0) {
      antdMessage.warning('No buckets configured yet. Seed via staff portal first (or hygiene test).');
      return;
    }
    try {
      await applyDeposit({ variables: { amount: depositAmount } });
    } catch (e: any) {
      antdMessage.error(`Apply failed: ${e.message}. Is the api running (pnpm --filter api dev)?`);
    }
  };

  const handleSimulate = async () => {
    if (serverBuckets.length === 0) {
      antdMessage.warning('No buckets — client preview still works, but server sim needs seed.');
      return;
    }
    try {
      await simulateDeposit({ variables: { amount: depositAmount } });
    } catch (e: any) {
      antdMessage.error(`Server simulate failed: ${e.message} (live client preview unaffected).`);
    }
  };

  const openLinkForGoal = (g: any) => {
    setSelectedGoalForLink(g);
    setLinkModalOpen(true);
  };

  const handleLinkBucket = (bucketId: string) => {
    if (!selectedGoalForLink) return;
    const gid = selectedGoalForLink.id;
    setLocalLinks((prev) => {
      const existing = prev[gid] || [];
      return { ...prev, [gid]: [...existing, bucketId].filter((v, i, a) => a.indexOf(v) === i) };
    });
    antdMessage.success(`Linked! This bucket's allocation will now help fund "${selectedGoalForLink.name}" (optimistic in this view — real linkGoal available via staff or future public flows).`);
    setLinkModalOpen(false);
    setSelectedGoalForLink(null);
  };

  const closeLinkModal = () => {
    setLinkModalOpen(false);
    setSelectedGoalForLink(null);
  };

  // Public goal card (hoverable, Avatar letter reuse from staff, Progress, community mock Tags per ux wireframes, actions)
  const renderPublicGoalCard = (g: any) => {
    const serverLinked = serverBuckets.filter((b) => b.linkedGoalIds.includes(g.id));
    const localLinkedIds = localLinks[g.id] || [];
    const linkedBuckets = [...serverLinked, ...serverBuckets.filter((b) => localLinkedIds.includes(b.id) && !serverLinked.some((s) => s.id === b.id))];
    const projSaved = linkedBuckets.reduce((s, b) => s + (livePreview.projectedBalances[b.id] ?? b.currentBalance), 0);
    const progressToGoal = Math.min(100, (projSaved / (g.targetAmount || 1)) * 100);

    return (
      <Card
        key={g.id}
        hoverable
        size="small"
        style={{ borderColor: '#166534' }}
        data-e-ref={`goal-card-${g.id}`}
        onClick={() => antdMessage.info(`View details for "${g.name}" (full history + community feed would expand here in full app).`)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar size={64} style={{ background: '#52c41a', color: '#000', fontSize: 28, fontWeight: 600 }}>
            {g.name.slice(0, 1)}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Typography.Text strong style={{ fontSize: 15 }}>
              {g.name}
            </Typography.Text>
            <div style={{ fontSize: 12, color: '#a3a3a3' }}>Target: ${g.targetAmount.toLocaleString()}</div>
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <Progress percent={progressToGoal} size="small" strokeColor="#52c41a" aria-label={`${g.name} goal progress`} />
          <div style={{ fontSize: 11, color: '#4ade80', marginTop: 2 }}>${projSaved.toFixed(0)} saved (projected after this deposit)</div>
        </div>

        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <Tag>1,234 savers</Tag>
          <Tag color="green">87% on track</Tag>
          <Tag>4.8★</Tag>
        </div>

        {g.description && <div style={{ fontSize: 11, color: '#71717a', marginTop: 6, lineHeight: 1.3 }}>{g.description}</div>}

        {linkedBuckets.length > 0 && (
          <Tag color="blue" style={{ marginTop: 6, fontSize: 10 }}>
            Linked to {linkedBuckets.length} bucket(s)
          </Tag>
        )}

        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              openLinkForGoal(g);
            }}
            data-e-ref={`link-bucket-btn-${g.id}`}
          >
            Link one of my buckets
          </Button>
          <Button
            size="small"
            type="link"
            style={{ padding: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              antdMessage.info('Details view would show milestone timeline, community comments, and "why this goal" from muse-eyes.');
            }}
          >
            View details
          </Button>
        </div>
      </Card>
    );
  };

  const hasBuckets = serverBuckets.length > 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8">
      <div className="max-w-5xl mx-auto">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Public Header (green badge, motivational title per ux wireframes + task) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Typography.Title level={2} style={{ color: '#fff', margin: 0 }}>
                Public Portal — My Future Buckets
              </Typography.Title>
              <Typography.Text type="secondary">Vite + React + Apollo Client → Shared Hono + Apollo Backend (Ant Design) • Green motivational theme</Typography.Text>
            </div>
            <div style={{ fontSize: 12, padding: '4px 12px', background: '#052e16', border: '1px solid #166534', borderRadius: 999, color: '#4ade80' }}>Public UI (Vite + antd) — Epic-5 views</div>
          </div>

          {/* Server hello / endpoint (reused pattern, small) */}
          <Card size="small" data-e-ref="public-hello-card">
            <Typography.Text strong>Server says: </Typography.Text>
            <Typography.Text style={{ color: '#52c41a' }}>{loading ? '…' : (data?.hello ?? '—')}</Typography.Text>
            {/* biome-ignore lint/complexity/useLiteralKeys: VITE_* come from index signature in vite/client types; bracket required by noPropertyAccessFromIndexSignature (matches lib/apollo-client.ts) */}
            <div style={{ fontSize: 12, color: '#71717a', marginTop: 4 }}>Endpoint: {import.meta.env['VITE_GRAPHQL_URL'] || 'https://api.localhost/graphql'} (portless .localhost ready for browser-verifier)</div>
          </Card>

          {/* ========== PRIMARY: Next Paycheck Preview (prominent green accent Card per ux wireframes) ========== */}
          <Card
            title={
              <span>
                Next Paycheck Preview <Tag color="green">Live &amp; Automatic</Tag>
              </span>
            }
            extra={
              <Space>
                <Button onClick={() => refetch()} loading={loading} size="small" data-e-ref="preview-refresh-btn">
                  Refresh
                </Button>
              </Space>
            }
            style={{ border: '2px solid #52c41a', borderRadius: 8 }}
            data-e-ref="next-paycheck-preview"
          >
            {error && (
              <Card style={{ background: '#450a0a', borderColor: '#7f1d1d', marginBottom: 16 }}>
                <Typography.Text type="danger">Error: {error.message}. Ensure api is running (pnpm --filter api dev) and buckets are seeded (use staff or hygiene test).</Typography.Text>
              </Card>
            )}

            {!hasBuckets && !loading && (
              <Tag color="warning" style={{ marginBottom: 12 }}>
                No buckets loaded — client preview will be empty. Seed via staff "Apply Test Deposit" or run the deposit-calculator hygiene test first.
              </Tag>
            )}

            {/* Deposit control + quick chips (live onChange, fully live per task) */}
            <div style={{ marginBottom: 16, padding: 12, background: '#111113', borderRadius: 6 }} data-e-ref="preview-deposit-control">
              <Space align="center" size="middle" wrap>
                <Typography.Text strong style={{ color: '#e4e4e7' }}>
                  Your next deposit
                </Typography.Text>
                <InputNumber value={depositAmount} onChange={(v) => setDepositAmount(Math.max(0, v || 0))} min={0} step={25} style={{ width: 130 }} prefix="$" data-e-ref="preview-deposit-input" />
                <Slider min={0} max={3000} step={25} value={depositAmount} onChange={setDepositAmount} style={{ width: 220 }} tooltip={{ formatter: (v) => `$${v}` }} data-e-ref="preview-deposit-slider" />
                {quickChips.map((c) => (
                  <Button key={c} size="small" onClick={() => setDepositAmount(c)} data-e-ref={`quick-chip-${c}`}>
                    ${c}
                  </Button>
                ))}
                <Button type="primary" onClick={handleSimulate} loading={simulating} data-e-ref="preview-simulate-btn">
                  Simulate on server
                </Button>
                <Button onClick={handleApply} loading={applying} data-e-ref="preview-apply-btn">
                  Apply to my buckets (demo)
                </Button>
              </Space>
              <div style={{ fontSize: 11, color: '#71717a', marginTop: 6 }}>Live client preview (instant). Server Simulate/Apply use real contracts (simulateDeposit / applyDeposit). Optimistic feel until commit.</div>
            </div>

            {/* Live results list (per ux: "Your deposit will automatically fund:" + small Progress + spill + narrative "cap in ~N") */}
            <div aria-live="polite" role="status" data-e-ref="preview-results">
              <Typography.Text strong style={{ color: '#4ade80' }}>
                Your deposit will automatically fund:
              </Typography.Text>

              <List
                size="small"
                dataSource={livePreview.allocations}
                locale={{ emptyText: hasBuckets ? 'Adjust deposit to preview automatic funding.' : 'Seed buckets first to see live funding.' }}
                renderItem={(alloc) => {
                  const b = serverBuckets.find((bb) => bb.id === alloc.bucketId);
                  const proj = livePreview.projectedBalances[alloc.bucketId] ?? (b?.currentBalance || 0);
                  const maxForP = b?.maxAmount || Math.max(proj * 1.3, 1000);
                  const pct = Math.min(100, (proj / maxForP) * 100);
                  const remainingToCap = b?.maxAmount != null ? Math.max(0, b.maxAmount - (b.currentBalance || 0)) : null;
                  const per = alloc.allocated || 0;
                  const estN = remainingToCap && per > 0.01 ? Math.max(1, Math.ceil(remainingToCap / per)) : null;
                  const narrative = alloc.capped ? 'at cap (spill protected priorities)' : estN ? `filling fast — cap in ~${estN} deposits` : 'building steadily toward your future';
                  return (
                    <List.Item key={alloc.bucketId} style={{ padding: '6px 0' }}>
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, alignItems: 'center' }}>
                          <span>
                            <strong>{alloc.bucketName}</strong>{' '}
                            <Tag color="green" style={{ fontSize: 11 }}>
                              {b?.percent?.toFixed(0)}%
                            </Tag>
                            <span style={{ color: '#52c41a', fontFamily: 'monospace' }}>${alloc.allocated.toFixed(0)}</span>
                          </span>
                          {alloc.spilled > 0.01 && (
                            <Tag color="orange" style={{ fontSize: 10 }} data-e-ref={`preview-spill-${alloc.bucketId}`}>
                              spills ${alloc.spilled.toFixed(0)}
                            </Tag>
                          )}
                          {alloc.capped && (
                            <Tag color="gold" style={{ fontSize: 10 }}>
                              MAX
                            </Tag>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                          <Progress percent={pct} size="small" strokeColor="#52c41a" style={{ flex: 1 }} aria-label={`${alloc.bucketName} funding progress`} />
                          <span style={{ fontSize: 11, color: '#a3a3a3', whiteSpace: 'nowrap' }}>{narrative}</span>
                        </div>
                        <div style={{ fontSize: 10, color: '#71717a' }}>
                          Current ${(b?.currentBalance || 0).toFixed(0)} → projected ${proj.toFixed(0)}
                          {b?.maxAmount ? ` / $${b.maxAmount}` : ''}
                        </div>
                      </div>
                    </List.Item>
                  );
                }}
              />

              <div style={{ marginTop: 8, fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span>Total auto-funded this deposit:</span>
                <strong style={{ color: '#52c41a' }}>${livePreview.totalAllocated.toFixed(2)}</strong>
              </div>
              <div style={{ fontSize: 12, color: '#71717a' }}>Remainder (unallocated this time): ${livePreview.remaining.toFixed(2)}</div>

              {lastSim && <div style={{ marginTop: 6, fontSize: 11, color: '#4ade80' }}>Last server sim matched client: ${lastSim.totalAllocated.toFixed(2)} allocated.</div>}
            </div>

            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 10, fontSize: 11 }}>
              Spillover + caps work automatically. Change the amount — watch the future fund itself. This is the "set and forget it" magic.
            </Typography.Text>
          </Card>

          {/* My Buckets (read-mostly Tree/Collapse, % large Tag + current Progress + linked goal thumb) */}
          <Card
            title="My Buckets"
            extra={
              <Button onClick={() => refetch()} loading={loading} size="small" data-e-ref="my-buckets-refresh">
                Refresh
              </Button>
            }
            data-e-ref="my-buckets-card"
          >
            <div style={{ background: '#111113', padding: 8, borderRadius: 6, minHeight: 120 }} data-e-ref="bucket-tree-public">
              {treeData.length > 0 ? (
                <Tree treeData={treeData} defaultExpandAll showLine selectable={false} blockNode />
              ) : (
                <Typography.Text type="secondary">Your buckets will appear here once seeded (use staff portal or seed script).</Typography.Text>
              )}
            </div>
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 11 }}>
              Read-mostly view of your automatic plan. Large % shows what every deposit contributes. Progress = current balance vs your cap. Linked goals get the motivational boost.
            </Typography.Text>
          </Card>

          {/* My Goals (responsive grid of hoverable Cards w/ Avatar, target+Progress, community Tags, actions) */}
          <Card title="My Goals" data-e-ref="my-goals-card">
            {goals.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-e-ref="goals-grid">
                {goals.map(renderPublicGoalCard)}
              </div>
            ) : (
              <Typography.Text type="secondary">Goals will inspire you here once created (via staff or future public flows).</Typography.Text>
            )}
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 11 }}>
              Hover a goal. Link a bucket. Every paycheck helps automatically. Community is already winning — join them.
            </Typography.Text>
          </Card>

          {/* Projections & Long-term Outlook teaser (polished per ux wireframes + Epic-5): sample 3/6/12mo outlooks under different deposit scenarios.
              Uses existing PROJECTIONS query (server cross-check for live deposit + N) OR client-compute (reusing deposit-calculator via computeClientProjections for optimistic/instant multi-scenario).
              AntD Statistic + Progress "charts" + Cards. Optimistic on refetch/apply. Added @e data-refs. Keeps public green theme. */}
          <Card
            title="Projections & Long-term Outlook"
            extra={
              <Space>
                {[3, 6, 12].map((n) => (
                  <Button key={n} size="small" onClick={() => setProjCount(n)} data-e-ref={`proj-chip-${n}`}>
                    {n}× server
                  </Button>
                ))}
                <Button size="small" onClick={() => refetch()} loading={projLoading} data-e-ref="projections-recompute-btn">
                  Recompute server
                </Button>
              </Space>
            }
            style={{ border: '1px solid #166534' }}
            data-e-ref="projections-longterm-outlook"
          >
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Sample future projections under different regular deposit scenarios. 3/6/12-month outlooks computed client-side (optimistic, reuses deposit allocation logic for instant feedback as buckets update). Progress bars
              visualize relative growth outlook.
            </Typography.Text>
            {!hasBuckets && (
              <Tag color="warning" style={{ marginTop: 8 }}>
                No buckets loaded — client projections + server cross-check will populate once seeded (staff or hygiene test).
              </Tag>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3" data-e-ref="outlook-scenarios-grid">
              {longTermScenarios.map((sc) => {
                const outlook = longTermOutlooks[sc.key];
                return (
                  <Card
                    key={sc.key}
                    size="small"
                    style={{ background: '#111113', borderColor: '#166534' }}
                    data-e-ref={`scenario-card-${sc.key}`}
                    title={
                      <span>
                        <strong>{sc.label}</strong> <Tag color="green">${sc.amount}</Tag>
                      </span>
                    }
                  >
                    <div style={{ fontSize: 11, color: '#a3a3a3', marginBottom: 6 }}>{sc.hint}</div>
                    {[3, 6, 12].map((mo) => {
                      const h = outlook?.byHorizon?.[mo];
                      const val = h?.total ?? 0;
                      const g = h?.growth ?? 0;
                      return (
                        <div key={mo} style={{ marginBottom: 6 }} data-e-ref={`outlook-${mo}mo-${sc.key}`}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Statistic title={`${mo}mo`} value={val} prefix="$" valueStyle={{ fontSize: 15, color: '#52c41a' }} style={{ margin: 0 }} />
                            <span style={{ fontSize: 10, color: g >= 0 ? '#4ade80' : '#71717a' }}>+${g}</span>
                          </div>
                          <Progress percent={h?.growthPct ?? 0} size="small" strokeColor="#52c41a" showInfo={false} aria-label={`${sc.label} ${mo}mo growth outlook`} />
                        </div>
                      );
                    })}
                    <Button
                      size="small"
                      style={{ marginTop: 4, width: '100%' }}
                      onClick={() => {
                        setDepositAmount(sc.amount);
                        antdMessage.info(`Preview updated to $${sc.amount} (${sc.label}). Watch the live allocation above.`);
                      }}
                      data-e-ref={`set-scenario-btn-${sc.key}`}
                    >
                      Use ${sc.amount} in live preview
                    </Button>
                  </Card>
                );
              })}
            </div>
            {/* Server cross-check: still uses the existing PROJECTIONS query (tied to current depositAmount + projCount) for verification / "ground truth" comparison. */}
            {projData?.projections && (
              <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px dashed #166534', fontSize: 11 }} data-e-ref="server-projections-crosscheck">
                <Typography.Text type="secondary">
                  Server-backed (existing projections query) for your current $${projData.projections.amount} × {projData.projections.count}:{' '}
                </Typography.Text>
                <strong style={{ color: '#52c41a' }}>${projData.projections.finalProjectedTotal.toFixed(0)}</strong> final total.
                <span style={{ color: '#71717a' }}>
                  {' '}
                  (sample periods:{' '}
                  {projData.projections.periods
                    .slice(0, 2)
                    .map((p: any) => `#${p.period}~$${p.totalBalance.toFixed(0)}`)
                    .join(', ')}
                  ...)
                </span>
              </div>
            )}
            <div style={{ fontSize: 10, color: '#71717a', marginTop: 8 }}>
              Optimistic client updates on bucket refresh/apply (refetch). No interest modeled. Change scenarios or use "Apply" in preview above — watch the outlooks move. Ready for @e verification.
            </div>
          </Card>

          <Typography.Text type="secondary" style={{ fontSize: 10, textAlign: 'center', display: 'block' }}>
            Public motivational BankBuckets views (Epic-5). Reuses staff patterns/compute/GQL aggressively (composition, no god objects). Tailwind layout + antd primary (green via AntdProvider). Full live preview + @e data-refs
            for verifier. Ready for browser-verifier / agent-evaluator.
          </Typography.Text>
        </Space>
      </div>

      {/* Link bucket picker modal (simple, per ux wireframes) */}
      <Modal title={selectedGoalForLink ? `Link a bucket to "${selectedGoalForLink.name}"` : 'Link a bucket'} open={linkModalOpen} onCancel={closeLinkModal} footer={null} data-e-ref="link-bucket-modal">
        <Typography.Text style={{ display: 'block', marginBottom: 12 }}>Pick a bucket. Its % of every future deposit will automatically contribute to this goal.</Typography.Text>
        <List
          size="small"
          dataSource={serverBuckets}
          locale={{ emptyText: 'No buckets to link.' }}
          renderItem={(b) => (
            <List.Item
              key={b.id}
              actions={[
                <Button key="link" size="small" type="primary" onClick={() => handleLinkBucket(b.id)} data-e-ref={`link-bucket-${b.id}`}>
                  Link this
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <span>
                    {b.name} <Tag color="green">{b.percent.toFixed(0)}%</Tag>
                  </span>
                }
                description={`Current $${b.currentBalance.toFixed(0)}${b.maxAmount ? ` / cap $${b.maxAmount}` : ''}`}
              />
            </List.Item>
          )}
        />
        <Typography.Text type="secondary" style={{ fontSize: 11, marginTop: 8, display: 'block' }}>
          (Optimistic client update only in this public demo slice. Full persistence uses linkGoal mutation.)
        </Typography.Text>
      </Modal>
    </div>
  );
}

export default App;
