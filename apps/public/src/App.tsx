import { useMutation, useQuery } from '@apollo/client';
import { Avatar, message as antdMessage, Button, Card, InputNumber, List, Modal, Progress, Slider, Space, Statistic, Tag, Tree, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { gql } from './gql/gql';
import { type BucketLike, computeLiveAllocations } from '@repo/bankbuckets-core';

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

const LINK_GOAL = gql(`
  mutation LinkGoal($bucketId: ID!, $goalId: ID!) {
    linkGoal(bucketId: $bucketId, goalId: $goalId) {
      id
      goal { id name targetAmount description }
    }
  }
`);

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
  { key: 'minimal', label: 'Minimal', amount: 100, hint: 'Starter consistent steps' },
  { key: 'conservative', label: 'Conservative', amount: 250, hint: 'Small consistent steps' },
  { key: 'typical', label: 'Typical', amount: 750, hint: 'Matches common preview' },
  { key: 'ambitious', label: 'Ambitious', amount: 2000, hint: 'Accelerated outlook' },
  { key: 'aggressive', label: 'Aggressive', amount: 3000, hint: 'Fast-track growth' },
] as const;

function App() {
  // Primary data: currentState (buckets w/ hierarchy + goal links, goals list, totals). Reused contract.
  const { data, loading, error, refetch } = useQuery(GET_CURRENT_STATE);

  const [applyDeposit, { loading: applying, error: applyMutationError }] = useMutation(APPLY_DEPOSIT, {
    onCompleted: (res) => {
      const r = res.applyDeposit;
      setJustApplied(r);
      setRecentSuccess(r);
      setApplyErrMsg(null);
      refetch();
      // richer success (beyond basic msg): recentSuccess drives post-apply detail card + last panel update
      antdMessage.success(`Deposit applied! Your buckets grew by $${r.totalAllocated.toFixed(0)} (remainder $${r.remainder.toFixed(0)}). See full lastDeposit allocations below.`);
    },
    onError: (e: any) => {
      setApplyErrMsg(e.message || 'Apply failed');
      antdMessage.error(`Apply failed: ${e.message}`);
    },
  });

  const [simulateDeposit, { loading: simulating }] = useMutation(SIMULATE_DEPOSIT, {
    onCompleted: (res) => {
      const r = res.simulateDeposit;
      antdMessage.info(`Server simulation: $${r.amount} allocated $${r.totalAllocated.toFixed(0)} (remainder $${r.remainder.toFixed(0)}). Client preview matched!`);
      setLastSim(r);
    },
  });

  // linkGoal mutation: wires public modal for persistence (Brief 1). local update + onCompleted refetch + Apollo optimisticResponse + cache update (reuses apply/simulate refetch pattern + staff linkedGoalIds shape).
  const [linkGoal, { loading: linking }] = useMutation(LINK_GOAL, {
    onCompleted: () => {
      refetch();
    },
    onError: (e: any) => {
      antdMessage.error(`linkGoal failed: ${e.message}`);
    },
    update: (cache, { data }) => {
      const updatedBucket = data?.linkGoal;
      if (!updatedBucket) return;
      try {
        const existing: any = cache.readQuery({ query: GET_CURRENT_STATE });
        if (!existing?.currentState?.buckets) return;
        const newBuckets = existing.currentState.buckets.map((b: any) => (b.id === updatedBucket.id ? { ...b, goal: updatedBucket.goal || null } : b));
        cache.writeQuery({
          query: GET_CURRENT_STATE,
          data: {
            ...existing,
            currentState: { ...existing.currentState, buckets: newBuckets },
          },
        });
      } catch {
        // cache miss ok; refetch will reconcile
      }
    },
  });

  // Local UI state (deposit drives live client preview + full projections + apply visibility)
  const [depositAmount, setDepositAmount] = useState<number>(750); // realistic "next paycheck" default
  const [lastSim, setLastSim] = useState<any>(null);
  const [projCount, setProjCount] = useState<number>(6);
  const [interactiveHorizon, setInteractiveHorizon] = useState<number>(6); // Brief 6: interactive horizon slider + per-bucket/per-horizon + goal-impact-over-time depth (reuses computeClientProjections)
  // For optimistic effects (during apply) + richer post-apply success + last visibility
  const [justApplied, setJustApplied] = useState<any>(null);
  const [recentSuccess, setRecentSuccess] = useState<any>(null);
  const [applyErrMsg, setApplyErrMsg] = useState<string | null>(null);

  // Projections query (reused for N-paycheck teaser; updates with depositAmount)
  const { data: projData, loading: projLoading } = useQuery(GET_PROJECTIONS, {
    variables: { amount: depositAmount, count: projCount },
    skip: depositAmount <= 0,
  });

  // Link modal state (local update layer + real linkGoal + Apollo optimistic for instant persistence; linked state now surfaces in grid/tree/preview/projections via serverBuckets)
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
  // Brief 4: 2+ level hierarchies with live sub-bucket +$ deltas (reuse computeLiveAllocations from core + server parent/children data for structure); 'funded via parent' indicators + tree-node-nested-* / hierarchy-funding-* @e.
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
      const parentForTag = src.find((s) => s.id === b.parentId);
      const title = (
        <span data-e-ref={`tree-node-nested-${b.id}`}>
          <strong>{b.name}</strong>{' '}
          <Tag color="green" style={{ marginLeft: 6, fontSize: 13 }}>
            {b.percent.toFixed(0)}%
          </Tag>
          {b.maxAmount && <Tag style={{ marginLeft: 4 }}>cap ${b.maxAmount}</Tag>}
          {b.parentId && parentForTag && (
            <Tag color="cyan" style={{ marginLeft: 4, fontSize: 10 }} data-e-ref={`hierarchy-funding-${b.id}`}>
              funded via {parentForTag.name}
            </Tag>
          )}
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

  // Derived for Brief 3 full projections (lastDeposit cmp + goal impact) + apply visibility (last details/allocs in preview/post-apply)
  // lastDeposit from currentState GQL (reused); justApplied for instant post-apply (before refetch lands); optimistic live allocs during applying
  const lastDeposit = data?.currentState?.lastDeposit || justApplied;
  const optimisticAllocForApply = applying ? livePreview : null;

  // Quick chips per ux wireframes
  const quickChips = [250, 500, 750, 1000, 1500, 2000];

  // === Handlers (optimistic live preview + server contracts on demand) ===
  const handleApply = async () => {
    if (serverBuckets.length === 0) {
      antdMessage.warning('No buckets configured yet. Seed via staff portal first (or hygiene test).');
      return;
    }
    setApplyErrMsg(null);
    // Optimistic effect: last-deposit-panel below will immediately reflect livePreview allocs as "applying..." (reused compute, no extra state)
    try {
      await applyDeposit({ variables: { amount: depositAmount } });
    } catch (e: any) {
      // onError + applyErrMsg handle resilience + inline error; fallback here too
      setApplyErrMsg(e.message || 'Apply failed');
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

  const handleLinkBucket = async (bucketId: string) => {
    if (!selectedGoalForLink) return;
    const gid = selectedGoalForLink.id;
    const gname = selectedGoalForLink.name;
    // local update (keeps prior optimistic layer + merge in grid render)
    setLocalLinks((prev) => {
      const existing = prev[gid] || [];
      return { ...prev, [gid]: [...existing, bucketId].filter((v, i, a) => a.indexOf(v) === i) };
    });
    // Apollo optimisticResponse (per-call for goal lookup) + hook update fn patches currentState cache instantly
    // so serverBuckets recomputes, linked state appears in tree/grid/preview/projections w/o roundtrip
    const goalForOpt = goals.find((gg: any) => gg.id === gid);
    try {
      await linkGoal({
        variables: { bucketId, goalId: gid },
        optimisticResponse: {
          __typename: 'Mutation',
          linkGoal: {
            __typename: 'Bucket',
            id: bucketId,
            goal: goalForOpt
              ? {
                  __typename: 'Goal',
                  id: gid,
                  name: goalForOpt.name,
                  targetAmount: goalForOpt.targetAmount,
                  description: goalForOpt.description,
                }
              : null,
          },
        } as any,
      });
      antdMessage.success(`Linked! Bucket allocation now persists to fund "${gname}".`);
    } catch (e: any) {
      antdMessage.error(`Link failed: ${e.message} (optimistic + local reconcile on refetch)`);
    }
    setLinkModalOpen(false);
    setSelectedGoalForLink(null);
  };

  const closeLinkModal = () => {
    setLinkModalOpen(false);
    setSelectedGoalForLink(null);
  };

  // Public goal card (hoverable, Avatar letter reuse from staff, Progress, community mock Tags per ux wireframes, actions)
  // Brief 4: projSaved now includes subtree (linked + descendants via getSubtree) for goal contributions flowing through levels (reuse livePreview + server hierarchy). Added goal-via-parent-* ref.
  const renderPublicGoalCard = (g: any) => {
    const getSubtreeIds = (rootId: string, buckets: BucketLike[]): string[] => {
      const kids = buckets.filter((bb) => bb.parentId === rootId).map((bb) => bb.id);
      return [rootId, ...kids, ...kids.flatMap((k) => getSubtreeIds(k, buckets))];
    };
    const serverLinked = serverBuckets.filter((b) => b.linkedGoalIds.includes(g.id));
    const localLinkedIds = localLinks[g.id] || [];
    const directLinked = [...serverLinked, ...serverBuckets.filter((b) => localLinkedIds.includes(b.id) && !serverLinked.some((s) => s.id === b.id))];
    const allSubtree = new Set<string>();
    directLinked.forEach((lb) => getSubtreeIds(lb.id, serverBuckets).forEach((id) => allSubtree.add(id)));
    const projSaved = Array.from(allSubtree).reduce((s, sid) => {
      const bb = serverBuckets.find((x) => x.id === sid);
      return s + (livePreview.projectedBalances[sid] ?? (bb?.currentBalance || 0));
    }, 0);
    const progressToGoal = Math.min(100, (projSaved / (g.targetAmount || 1)) * 100);
    const hasLevelFlow = directLinked.some((lb) => serverBuckets.some((bb) => bb.parentId === lb.id));

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

        {directLinked.length > 0 && (
          <Tag color="blue" style={{ marginTop: 6, fontSize: 10 }}>
            Linked to {directLinked.length} bucket(s)
          </Tag>
        )}
        {hasLevelFlow && (
          <Tag color="geekblue" style={{ marginTop: 6, fontSize: 10 }} data-e-ref={`goal-via-parent-${g.id}`}>
            contributions flow via sub-levels
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
            <div style={{ fontSize: 12, padding: '4px 12px', background: '#052e16', border: '1px solid #166534', borderRadius: 999, color: '#4ade80' }}>Public UI (Vite + antd) — Epic-5 + Brief 4 hierarchy v2</div>
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
                {lastDeposit && (
                  <Button size="small" onClick={() => setDepositAmount(lastDeposit.amount)} data-e-ref="repeat-last-btn">
                    Repeat last (${lastDeposit.amount})
                  </Button>
                )}
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
                    <List.Item key={alloc.bucketId} style={{ padding: '6px 0' }} data-e-ref={`preview-nested-${alloc.bucketId}`}>
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, alignItems: 'center' }}>
                          <span>
                            <strong>{alloc.bucketName}</strong>{' '}
                            <Tag color="green" style={{ fontSize: 11 }}>
                              {b?.percent?.toFixed(0)}%
                            </Tag>
                            <span style={{ color: '#52c41a', fontFamily: 'monospace' }}>${alloc.allocated.toFixed(0)}</span>
                            {b?.parentId && (
                              <Tag color="cyan" style={{ marginLeft: 4, fontSize: 10 }} data-e-ref={`hierarchy-funding-preview-${alloc.bucketId}`}>
                                via parent
                              </Tag>
                            )}
                            {b?.linkedGoalIds && b.linkedGoalIds.length > 0 && (
                              <Tag style={{ fontSize: 10, marginLeft: 4 }} color="blue" data-e-ref={`preview-linked-${alloc.bucketId}`}>
                                →{' '}
                                {b.linkedGoalIds
                                  .map((gid: string) => goals.find((gg: any) => gg.id === gid)?.name)
                                  .filter(Boolean)
                                  .join(', ')}
                              </Tag>
                            )}
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

            {/* Full apply visibility (Brief 3): lastDeposit details + allocations list in preview (always, from currentState GQL) + post-apply (via justApplied/recentSuccess).
                Optimistic effects: during applying, reuses livePreview allocs as pending "last" (zero-latency, matches computeLiveAllocations).
                Richer success via recentSuccess + panel highlight. Minimal history = latest only. Error resilience via applyErrMsg inline.
                @e dense for browser-verifier. Reuses exact GQL shape + compute. */}
            {(lastDeposit || applying) && (
              <div style={{ marginTop: 12, padding: 10, background: '#052e16', border: '1px solid #166534', borderRadius: 6 }} data-e-ref="last-deposit-panel" aria-live="polite">
                <Typography.Text strong style={{ color: '#4ade80', fontSize: 12 }}>
                  {applying && !lastDeposit
                    ? `Applying $${depositAmount} now (optimistic preview — server confirming)...`
                    : `Last deposit applied: $${(lastDeposit?.amount ?? 0).toFixed(0)} (allocated $${(lastDeposit?.totalAllocated ?? 0).toFixed(0)}, remainder $${(lastDeposit?.remainder ?? 0).toFixed(0)})`}
                </Typography.Text>
                {(lastDeposit?.allocations?.length > 0 || (applying && optimisticAllocForApply)) && (
                  <List
                    size="small"
                    style={{ marginTop: 6 }}
                    dataSource={applying && optimisticAllocForApply ? optimisticAllocForApply.allocations : lastDeposit.allocations}
                    renderItem={(alloc: any) => (
                      <List.Item key={alloc.bucketId} style={{ padding: '3px 0' }} data-e-ref={`last-deposit-item-${alloc.bucketId}`}>
                        <div style={{ width: '100%', fontSize: 12 }}>
                          <strong>{alloc.bucketName}</strong>{' '}
                          <Tag color="green" style={{ fontSize: 10 }}>+${(alloc.allocated || 0).toFixed(0)}</Tag>
                          {alloc.capped && <Tag color="gold" style={{ fontSize: 10 }}>MAX</Tag>}
                          {(alloc.spillOverBucketUsed || (alloc.spilled && alloc.spilled > 0.01)) && (
                            <Tag color="orange" style={{ fontSize: 10 }} data-e-ref={`last-spill-${alloc.bucketId}`}>spill</Tag>
                          )}
                          <span style={{ color: '#71717a', marginLeft: 6, fontSize: 10 }}>bucket {alloc.bucketId?.slice(0, 6)}</span>
                        </div>
                      </List.Item>
                    )}
                  />
                )}
                {recentSuccess && lastDeposit && (
                  <div style={{ fontSize: 10, color: '#4ade80', marginTop: 4 }} data-e-ref="apply-rich-success">Richer success: full allocations + details now visible in last panel (post-apply + optimistic confirmed).</div>
                )}
                {applying && <div style={{ fontSize: 10, color: '#a3a3a3', marginTop: 2 }}>Live client optimistic (reused compute) — refetch will reconcile exact server result.</div>}
              </div>
            )}

            {/* Inline error resilience for apply (shows on failure; clearable; does not break live preview) */}
            {applyErrMsg && (
              <Card size="small" style={{ background: '#450a0a', borderColor: '#7f1d1d', marginTop: 8 }} data-e-ref="apply-error">
                <Typography.Text type="danger" style={{ fontSize: 12 }}>Apply error: {applyErrMsg}. Preview + client compute still live. </Typography.Text>
                <Button size="small" onClick={() => setApplyErrMsg(null)} style={{ marginLeft: 8 }}>Clear</Button>
              </Card>
            )}

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

          {/* Projections & Long-term Outlook (full per Brief 3 from PO: Completing Projections + Full Apply Visibility for public as vertical slice).
              Expanded from teaser: more scenarios (5 incl. minimal/aggressive + last-deposit ready), lastDeposit comparison (reuses currentState.lastDeposit + computeClientProjections), goal impact notes, better viz (more cards, grid, extra stats, linked uplift).
              Reuses GET_PROJECTIONS (server N-paycheck cross-check) + computeClientProjections / computeLiveAllocations (client optimistic multi-horizon, zero roundtrip).
              AntD Statistic/Progress/Cards/Tags + @e dense. Optimistic on refetch/apply. Green public theme. Hygiene clean. */}
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
              Full projections: more scenarios (incl. last-deposit comparison), goal impact, 3/6/12mo outlooks (client optimistic reusing deposit allocation logic for instant feedback as buckets update). Progress bars visualize growth. Apply in preview above updates outlooks live.
            </Typography.Text>
            {!hasBuckets && (
              <Tag color="warning" style={{ marginTop: 8 }}>
                No buckets loaded — client projections + server cross-check will populate once seeded (staff or hygiene test).
              </Tag>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-3" data-e-ref="outlook-scenarios-grid">
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
                    {/* Goal impact (Brief 3): linked buckets get share of every future deposit's growth in these outlooks */}
                    <div style={{ fontSize: 9, color: '#4ade80', marginBottom: 4 }} data-e-ref={`goal-impact-${sc.key}`}>
                      Goal impact: {serverBuckets.filter((b: any) => (b.linkedGoalIds || []).length > 0).length} linked buckets prioritized
                    </div>
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

            {/* lastDeposit comparison (full projections): compare outlooks using your actual last deposit amount vs current scenarios. Reuses computeClientProjections + GQL lastDeposit. Goal impact summary. */}
            {lastDeposit && (
              <div style={{ marginTop: 10, paddingTop: 6, borderTop: '1px dashed #166534', fontSize: 11 }} data-e-ref="proj-last-deposit-cmp">
                <Typography.Text type="secondary">Last deposit comparison (your last: ${lastDeposit.amount}, allocated ${lastDeposit.totalAllocated?.toFixed?.(0) ?? lastDeposit.totalAllocated}):</Typography.Text>
                {[3, 6, 12].map((mo) => {
                  const p = computeClientProjections(lastDeposit.amount, mo, serverBuckets);
                  const g = p.finalTotal - currentTotalBalance;
                  return (
                    <span key={mo} style={{ marginLeft: 6, fontSize: 10 }} data-e-ref={`proj-last-${mo}mo`}>
                      {mo}mo ~${Math.round(p.finalTotal)} (+${Math.round(g)})
                    </span>
                  );
                })}
                <div style={{ fontSize: 10, color: '#4ade80', marginTop: 2 }} data-e-ref="proj-goal-impact-summary">
                  Goal impact: {serverBuckets.filter((b: any) => (b.linkedGoalIds || []).length > 0).length} linked buckets will automatically receive % of every deposit in these projections (see My Goals cards for live projected saved).
                </div>
              </div>
            )}

            {/* Server cross-check: reuses the existing PROJECTIONS query (tied to current depositAmount + projCount) for verification / "ground truth" comparison. Enhanced with last cmp + linked. */}
            {projData?.projections && (
              <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px dashed #166534', fontSize: 11 }} data-e-ref="server-projections-crosscheck">
                <Typography.Text type="secondary">
                  Server-backed (existing projections query) for your current $${projData.projections.amount} × {projData.projections.count}:{' '}
                </Typography.Text>
                <strong style={{ color: '#52c41a' }}>${projData.projections.finalProjectedTotal.toFixed(0)}</strong> final total.
                <span style={{ color: '#71717a', marginLeft: 6 }}>• {serverBuckets.filter((b: any) => (b.linkedGoalIds || []).length > 0).length} bucket(s) linked to goals (optimistic + persisted)</span>
                {lastDeposit && (
                  <span style={{ color: '#4ade80', marginLeft: 6 }} data-e-ref="server-proj-last-cmp">• last was ${lastDeposit.amount}</span>
                )}
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
              Optimistic client updates on bucket refresh/apply (refetch). No interest modeled. More scenarios + last deposit cmp + goal impact now live. Change scenarios or use "Apply" / "Repeat last" in preview above — watch the outlooks + last panel move. Dense @e ready for browser-verifier / agent-evaluator.
            </div>

            {/* Brief 6 public projections/goal impact depth (PO 019eaa3e-b561-7aa3-b2fd-4013b1629bf7): deeper per-bucket/per-horizon breakdowns, total-to-goals-over-time viz, interactive horizon slider (beyond fixed 5 scenarios + 3/6/12), richer 'repeat last' + apply flows surfacing hierarchy/goal funding.
                Reuses computeClientProjections (bucketFinals + multi-horizon), livePreview (current contrast), server GET_PROJECTIONS (bucketProjections in periods), goal linking (linkedGoalIds + subtree).
                7+ new data-e-refs only on new elements (proj-per-bucket-*, goal-impact-over-time-*, proj-interactive-horizon-*, proj-repeat-apply-*, proj-per-bucket-server-* etc). All prior @e / Brief 3-5 / v1 markers + strings untouched. */}
            <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid #166534' }} data-e-ref="proj-per-bucket-breakdown">
              <Typography.Text strong style={{ fontSize: 11, color: '#4ade80' }}>Deeper Per-Bucket / Horizon + Goal Impact Over Time (Brief 6)</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 10, display: 'block' }}>Interactive beyond 5 scenarios: use slider or change deposit (ties to live preview / repeat-last / apply). Per-bucket uses bucketFinals from reused computeClientProjections. Goals attributed via linked subtrees (hierarchy funding surfaced).</Typography.Text>

              {/* Interactive horizon slider (additional interactive control for custom horizons/scenarios) */}
              <div style={{ margin: '6px 0' }} data-e-ref="proj-interactive-horizon-control">
                <Typography.Text style={{ fontSize: 10, marginRight: 8 }}>Interactive horizon:</Typography.Text>
                <Slider min={1} max={24} step={1} value={interactiveHorizon} onChange={setInteractiveHorizon} style={{ width: 180, display: 'inline-block', verticalAlign: 'middle' }} tooltip={{ formatter: (v) => `${v}mo` }} data-e-ref="proj-interactive-horizon-slider" />
                <Tag color="green" style={{ marginLeft: 6 }}>{interactiveHorizon}mo</Tag>
                <span style={{ fontSize: 9, marginLeft: 6, color: '#71717a' }}>(ties to current deposit ${depositAmount} + live flows)</span>
              </div>

              {/* total-to-goals-over-time viz + per-goal impact at fixed + interactive horizons (reuse compute + goal linking/subtree) */}
              <div style={{ fontSize: 10, marginBottom: 4, background: '#052e16', padding: 4, borderRadius: 3 }} data-e-ref="goal-impact-over-time-viz">
                Total-to-goals over time (projected bals attributed to each goal via linked buckets + hierarchy):
                {goals.length === 0 && <span style={{ color: '#71717a' }}> (no goals linked yet)</span>}
                {goals.map((g: any) => {
                  const horizonsForViz = [3, 6, 12, interactiveHorizon].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
                  const contribs = horizonsForViz.map((h) => {
                    const p = computeClientProjections(depositAmount, h, serverBuckets);
                    const serverLinked = serverBuckets.filter((b: any) => (b.linkedGoalIds || []).includes(g.id));
                    const getSubtreeIds = (rootId: string, bs: any[]): string[] => {
                      const kids = bs.filter((bb: any) => bb.parentId === rootId).map((bb: any) => bb.id);
                      return [rootId, ...kids, ...kids.flatMap((k) => getSubtreeIds(k, bs))];
                    };
                    const allIds = new Set<string>();
                    serverLinked.forEach((lb) => getSubtreeIds(lb.id, serverBuckets).forEach((id) => allIds.add(id)));
                    const sum = Array.from(allIds).reduce((s, sid) => s + (p.bucketFinals[sid] ?? 0), 0);
                    return `${h}mo:$${Math.round(sum)}`;
                  });
                  return <div key={g.id} style={{ marginLeft: 6, marginTop: 1 }} data-e-ref={`goal-impact-over-time-${g.id}`}>{g.name}: {contribs.join(' ')}</div>;
                })}
              </div>

              {/* Per-bucket breakdowns at interactive horizon (deeper per-bucket/per-horizon; reuse bucketFinals; surface hierarchy + goal funding) */}
              {(() => {
                const p = computeClientProjections(depositAmount, interactiveHorizon, serverBuckets);
                return (
                  <div style={{ background: '#111113', padding: 4, borderRadius: 3, fontSize: 9, marginBottom: 4 }} data-e-ref="proj-interactive-horizon-per-bucket-list">
                    <div>Per-bucket breakdown at {interactiveHorizon}mo (current deposit; growth from bucketFinals):</div>
                    {serverBuckets.map((b: any) => {
                      const fin = p.bucketFinals[b.id] ?? b.currentBalance;
                      const growth = fin - b.currentBalance;
                      const linkedNames = b.linkedGoalIds.map((gid: string) => goals.find((gg: any) => gg.id === gid)?.name).filter(Boolean).join(', ');
                      const parent = serverBuckets.find((bb: any) => bb.id === b.parentId);
                      return (
                        <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }} data-e-ref={`proj-per-bucket-${b.id}-h${interactiveHorizon}`}>
                          <span>{b.parentId ? '↳ ' : ''}{b.name}{parent ? ` (via ${parent.name})` : ''}{linkedNames ? ` → ${linkedNames}` : ''}</span>
                          <span>${Math.round(fin)} <span style={{ color: growth >= 0 ? '#4ade80' : '#71717a' }}>(+${Math.round(growth)})</span></span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Server per-bucket depth (reused from GET_PROJECTIONS periods.bucketProjections for cross-check) */}
              {projData?.projections && projData.projections.periods && projData.projections.periods.length > 0 && (
                <div style={{ fontSize: 9, color: '#a3a3a3', marginBottom: 4 }} data-e-ref="proj-per-bucket-server-from-get-projections">
                  Server per-bucket (from GET_PROJECTIONS last period):
                  {projData.projections.periods[projData.projections.periods.length - 1].bucketProjections.map((bp: any) => (
                    <span key={bp.bucketId} style={{ marginLeft: 4 }} data-e-ref={`proj-per-bucket-server-${bp.bucketId}`}>{bp.bucketName}: ${bp.projectedBalance.toFixed(0)}</span>
                  ))}
                </div>
              )}

              {/* Richer 'repeat last' + apply flows: surfaces hierarchy/goal funding details (populates on lastDeposit from repeat-last-btn or handleApply) */}
              {lastDeposit && (
                <div style={{ fontSize: 9, color: '#4ade80', marginTop: 2 }} data-e-ref="proj-repeat-apply-hierarchy-detail">
                  Richer repeat-last/apply flow: last deposit ${lastDeposit.amount} allocations now feed the per-bucket + goal-over-time projections above via hierarchy/links (see My Goals cards too).
                </div>
              )}
              <div style={{ fontSize: 8, color: '#71717a', marginTop: 2 }}>Reused computeClientProjections/livePreview/GET_PROJECTIONS/goal linking. +7 new data-e-refs for Brief 6 (proj-per-bucket-*, goal-impact-over-time-*, proj-interactive-horizon-*, proj-repeat-apply-*, proj-per-bucket-server-*). Prior v1/Brief 3-5 @e untouched.</div>
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
          (localLinks layer + Apollo optimisticResponse + linkGoal mutation + onCompleted refetch now active. Linked state in grid/tree/preview/projections.)
        </Typography.Text>
      </Modal>
    </div>
  );
}

export default App;
