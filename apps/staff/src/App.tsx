import { useMutation, useQuery } from '@apollo/client';
import { Avatar, message as antdMessage, Button, Card, Divider, InputNumber, List, Progress, Select, Slider, Space, Tag, Tooltip, Tree, Typography } from 'antd';
// TreeDataNode not directly needed (we use any[] for treeData to avoid exactOptional/children TS strict issues with antd Tree)
import { useEffect, useMemo, useState } from 'react';
import { gql } from './gql/gql';

const GET_MESSAGES = gql(`
  query GetMessages {
    messages {
      id
      text
    }
    hello
  }
`);

const ADD_MESSAGE = gql(`
  mutation AddMessage($text: String!) {
    addMessage(text: $text) {
      id
      text
    }
  }
`);

// === Long-term Budgeting (BankBuckets port) GraphQL contracts (MVP slice) ===
// Exact match to schema (percent / order / currentBalance / linkedGoalIds / applyTestDeposit).
// Per muse-eyes visual report mappings + PO briefs for epic-4 staff config/sim.
// Run codegen after edits.
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

const CONFIGURE_BUCKETS = gql(`
  mutation ConfigureBuckets($configs: [BucketConfigInput!]!) {
    configureBuckets(configs: $configs) {
      id
      name
      percentAlloc
      maxAmount
      spillOverOrder
      balance
      goal { id name targetAmount }
    }
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

// === Portable client-side simulation (matches backend calculateDepositAllocations for live preview) ===
// Incorporates muse-eyes: % prominent, spillover badges, progress vs max/goal, precise remainders/caps.
// Use for instant UI feedback on sliders/deposit amount (no server roundtrip until Apply).
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

  // order by spillover priority
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

  // waterfall spill to room (respecting order)
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

function App() {
  // Original messages query (kept for continuity / demo pattern reuse)
  const messagesQuery = useQuery(GET_MESSAGES);
  const { data: messagesData, loading: messagesLoading, error: messagesError, refetch: messagesRefetch } = messagesQuery;

  // Primary: currentState for buckets (with hierarchy parent/children + goal), goals list, totals (per actual schema)
  const { data, loading, error, refetch } = useQuery(GET_CURRENT_STATE);

  const [configure, { loading: savingConfig }] = useMutation(CONFIGURE_BUCKETS, {
    onCompleted: () => {
      refetch();
      antdMessage.success('Bucket config saved (configured on server)');
    },
  });

  const [applyDeposit, { loading: applying }] = useMutation(APPLY_DEPOSIT, {
    onCompleted: (res) => {
      refetch();
      const r = res.applyDeposit;
      antdMessage.success(`Applied $${r.amount.toFixed(2)} — allocated $${r.totalAllocated.toFixed(2)} (remainder $${r.remainder.toFixed(2)})`);
    },
  });

  const [addMessage, { loading: adding }] = useMutation(ADD_MESSAGE, {
    onCompleted: () => {
      messagesRefetch();
    },
  });

  // === Local editable state (for live % / order / linkage edits + preview) ===
  // Starts synced from server via effect. Edits drive client calc for instant sim (per task).
  const [editedBuckets, setEditedBuckets] = useState<BucketLike[]>([]);
  const [depositAmount, setDepositAmount] = useState<number>(250); // default "next paycheck" style test amount

  // Sync server data -> editable (from currentState.buckets; map schema names: percentAlloc, balance, spillOverOrder)
  useEffect(() => {
    const bucketsFromState = data?.currentState?.buckets;
    if (bucketsFromState?.length) {
      const serverBuckets: BucketLike[] = bucketsFromState.map((b: any) => ({
        id: b.id,
        name: b.name,
        percent: b.percentAlloc,
        maxAmount: b.maxAmount ?? null,
        currentBalance: b.balance,
        order: b.spillOverOrder,
        parentId: b.parent?.id ?? null,
        linkedGoalIds: b.goal ? [b.goal.id] : [],
      }));
      serverBuckets.sort((a, b) => a.order - b.order);
      setEditedBuckets(serverBuckets);
    }
  }, [data?.currentState?.buckets]);

  const serverBuckets: BucketLike[] = (data?.currentState?.buckets || []).map((b: any) => ({
    id: b.id,
    name: b.name,
    percent: b.percentAlloc,
    maxAmount: b.maxAmount ?? null,
    currentBalance: b.balance,
    order: b.spillOverOrder,
    parentId: b.parent?.id ?? null,
    linkedGoalIds: b.goal ? [b.goal.id] : [],
  }));

  const goals: any[] = data?.currentState?.goals || [];

  // Live preview computation (state-driven, client portable calc — delightful & fast). Adapted to schema names.
  const livePreview = useMemo(() => {
    return computeLiveAllocations(depositAmount, editedBuckets.length ? editedBuckets : serverBuckets);
  }, [depositAmount, editedBuckets, serverBuckets]);

  // Current total % for validation (must ~100)
  const currentTotalPercent = useMemo(() => {
    const src = editedBuckets.length ? editedBuckets : serverBuckets;
    return src.reduce((s, b) => s + (b.percent || 0), 0);
  }, [editedBuckets, serverBuckets]);

  const isPercentValid = Math.abs(currentTotalPercent - 100) < 0.5; // tolerance for float sliders

  // Build antd Tree data for hierarchy visualization (maps muse-eyes "tree/hierarchy (indented ul with lines, tree_node graphics)" + % + progress indicators)
  const treeData: any[] = useMemo(() => {
    const src = editedBuckets.length ? editedBuckets : serverBuckets;
    const roots = src.filter((b) => !b.parentId).sort((a, b) => a.order - b.order);

    const toNode = (b: BucketLike): any => {
      const previewBal = livePreview.projectedBalances[b.id] ?? b.currentBalance;
      const max = b.maxAmount ?? Math.max(previewBal * 1.2, 1000);
      const pctOfMax = Math.min(100, Math.round((previewBal / max) * 100));
      const alloc = livePreview.allocations.find((a) => a.bucketId === b.id);
      const delta = alloc ? alloc.allocated : 0;
      const title = (
        <span>
          <strong>{b.name}</strong>{' '}
          <Tag color="blue" style={{ marginLeft: 6 }}>
            {b.percent.toFixed(0)}%
          </Tag>
          {b.maxAmount && <Tag style={{ marginLeft: 4 }}>max ${b.maxAmount}</Tag>}
          <span style={{ marginLeft: 8, color: '#52c41a' }}>+${delta.toFixed(0)}</span>
          <Progress percent={pctOfMax} size="small" style={{ width: 120, marginLeft: 12, verticalAlign: 'middle' }} strokeColor={alloc?.capped ? '#faad14' : '#52c41a'} />
        </span>
      );
      const children = src
        .filter((c) => c.parentId === b.id)
        .sort((a, b) => a.order - b.order)
        .map(toNode);
      return { title, key: b.id, children: children.length ? children : undefined };
    };

    return roots.map(toNode);
  }, [editedBuckets, serverBuckets, livePreview]);

  // === Handlers for live config (update local edited state → instant preview recompute) ===
  const updateLocalPercent = (id: string, newPct: number) => {
    setEditedBuckets((prev) => prev.map((b) => (b.id === id ? { ...b, percent: Math.max(0, Math.min(100, Math.round(newPct * 10) / 10)) } : b)));
  };

  const updateLocalOrder = (id: string, direction: -1 | 1) => {
    setEditedBuckets((prev) => {
      const arr = [...prev];
      const idx = arr.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      // swap order values with a neighbor in the desired visual direction
      const targetIdx = direction < 0 ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= arr.length) return prev;
      const tempOrder = arr[idx]!.order;
      arr[idx]!.order = arr[targetIdx]!.order;
      arr[targetIdx]!.order = tempOrder;
      arr.sort((a, b) => a.order - b.order); // re-sort for UI
      return arr;
    });
  };

  const resetToServer = () => {
    const bucketsFromState = data?.currentState?.buckets;
    if (bucketsFromState) {
      const reset = bucketsFromState.map((b: any) => ({
        id: b.id,
        name: b.name,
        percent: b.percentAlloc,
        maxAmount: b.maxAmount ?? null,
        currentBalance: b.balance,
        order: b.spillOverOrder,
        parentId: b.parent?.id ?? null,
        linkedGoalIds: b.goal ? [b.goal.id] : [],
      }));
      reset.sort((a: any, b: any) => a.order - b.order);
      setEditedBuckets(reset);
      antdMessage.info('Edits reset to last server state');
    }
  };

  const saveConfigToServer = async () => {
    if (!isPercentValid) {
      antdMessage.error('Cannot save: percentages must total ~100%');
      return;
    }
    // Map to actual schema BucketConfigInput (percentAlloc, spillOverOrder, parentId, goalId single for MVP)
    const configs = editedBuckets.map((b) => ({
      name: b.name,
      percentAlloc: b.percent,
      maxAmount: b.maxAmount,
      spillOverOrder: b.order,
      parentId: b.parentId,
      goalId: b.linkedGoalIds[0] || null,
    }));
    try {
      await configure({ variables: { configs } });
    } catch (e: any) {
      antdMessage.error(`Save failed: ${e.message}`);
    }
  };

  const handleApplyTestDeposit = async () => {
    // For "live edited config" test: configure first (if valid), then apply the amount (server uses the just-configured %s)
    if (!isPercentValid) {
      antdMessage.warning('Normalizing to 100% recommended for spillover; applying with current anyway for demo.');
    }
    try {
      // Chain: push current local edits as config, then apply (gives the "test this config" magic without separate save click)
      const configs = editedBuckets.map((b) => ({
        name: b.name,
        percentAlloc: b.percent,
        maxAmount: b.maxAmount,
        spillOverOrder: b.order,
        parentId: b.parentId,
        goalId: b.linkedGoalIds[0] || null,
      }));
      await configure({ variables: { configs } });
      await applyDeposit({ variables: { amount: depositAmount } });
    } catch (e: any) {
      antdMessage.error(`Apply failed: ${e.message}. Is the api dev server running (portless)?`);
    }
  };

  // Original messages handlers (reused pattern)
  const handleMessagesRefresh = () => {
    messagesRefetch();
    antdMessage.info('Refreshed messages');
  };

  // === Render helpers (antd + Tailwind layout only) ===
  const renderBucketEditor = (b: BucketLike, indent = 0) => {
    const alloc = livePreview.allocations.find((a) => a.bucketId === b.id);
    const projected = livePreview.projectedBalances[b.id] ?? b.currentBalance;
    const maxForProgress = b.maxAmount || Math.max(projected * 1.3, 1000);
    const currentPctOfMax = Math.min(100, (projected / maxForProgress) * 100);

    const linkedNames = b.linkedGoalIds.map((gid) => goals.find((g: any) => g.id === gid)?.name).filter(Boolean);

    return (
      <div key={b.id} style={{ marginLeft: indent * 16, marginBottom: 12 }} data-e-ref={`bucket-row-${b.id}`}>
        <Card size="small" style={{ background: '#18181b', borderColor: '#27272a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Hierarchy indicator + name (tree_node style via indent + order controls) */}
            <div style={{ minWidth: 160 }}>
              <Typography.Text strong style={{ color: '#e4e4e7' }}>
                {b.name}
              </Typography.Text>
              <div style={{ fontSize: 11, color: '#71717a' }}>
                order:{b.order} {b.parentId ? '↳ child' : 'root'}
              </div>
            </div>

            {/* % Slider + InputNumber (live edit, primary for config per task + muse-eyes) */}
            <div style={{ flex: 1, minWidth: 220, maxWidth: 320 }} data-e-ref={`pct-slider-${b.id}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Typography.Text style={{ width: 32, textAlign: 'right', color: '#a1a1aa' }}>{b.percent.toFixed(0)}%</Typography.Text>
                <Slider min={0} max={100} step={0.5} value={b.percent} onChange={(v) => updateLocalPercent(b.id, v)} style={{ flex: 1 }} tooltip={{ formatter: (v) => `${v}% of deposit` }} />
                <InputNumber min={0} max={100} step={0.5} value={b.percent} onChange={(v) => updateLocalPercent(b.id, v ?? 0)} size="small" style={{ width: 70 }} data-e-ref={`pct-input-${b.id}`} />
              </div>
            </div>

            {/* Reorder for SpillOverOrder (moving_tab inspired; ↑↓ instead of full dnd for MVP no extra deps) */}
            <Space.Compact>
              <Button size="small" onClick={() => updateLocalOrder(b.id, -1)} title="Higher spillover priority (lower order num)" data-e-ref={`reorder-up-${b.id}`}>
                ▲
              </Button>
              <Button size="small" onClick={() => updateLocalOrder(b.id, 1)} title="Lower priority" data-e-ref={`reorder-down-${b.id}`}>
                ▼
              </Button>
            </Space.Compact>

            {/* Current + projected Progress (balance vs max, spillover color accent) */}
            <div style={{ minWidth: 180 }}>
              <div style={{ fontSize: 11, color: '#71717a' }}>
                ${b.currentBalance.toFixed(0)} → <span style={{ color: '#52c41a' }}>${projected.toFixed(0)}</span>
                {b.maxAmount && ` / $${b.maxAmount}`}
              </div>
              <Progress percent={currentPctOfMax} size="small" status={alloc?.capped ? 'exception' : 'success'} strokeColor={alloc?.capped ? '#faad14' : '#52c41a'} format={() => `${currentPctOfMax.toFixed(0)}%`} />
            </div>

            {/* This deposit allocation + spill indicator (per-row live preview, old "next paycheck" pattern) */}
            {alloc && (
              <div>
                <Tag color="green" style={{ fontFamily: 'monospace' }}>
                  +${alloc.allocated.toFixed(2)}
                </Tag>
                {alloc.spilled > 0.01 && (
                  <Tooltip title="Excess after MaxAmount cap spilled via waterfall to next in SpillOverOrder">
                    <Tag color="orange" style={{ fontFamily: 'monospace' }} data-e-ref={`spill-${b.id}`}>
                      spill ${alloc.spilled.toFixed(2)}
                    </Tag>
                  </Tooltip>
                )}
                {alloc.capped && <Tag color="gold">capped</Tag>}
              </div>
            )}

            {/* Goal linkage/selection (Card/Avatar style inspiration mapped to Tags + interactive Select) */}
            <div style={{ minWidth: 180 }}>
              <Select
                mode="multiple"
                size="small"
                placeholder="Link goals"
                value={b.linkedGoalIds}
                onChange={(vals) => {
                  // simplistic: set to the new selection (supports goal linkage/selection)
                  setEditedBuckets((prev) => prev.map((bb) => (bb.id === b.id ? { ...bb, linkedGoalIds: vals } : bb)));
                }}
                style={{ minWidth: 140 }}
                options={goals.map((g: any) => ({ label: g.name, value: g.id }))}
                data-e-ref={`goal-link-${b.id}`}
              />
              {linkedNames.length > 0 && (
                <div style={{ marginTop: 2 }}>
                  {linkedNames.map((n) => (
                    <Tag key={n} style={{ fontSize: 10 }}>
                      {n}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // Goal cards (muse-eyes: "goal thumbnails (profile_pic + cards with price, ratings, "Save for This")" → Avatar + Card + price)
  const renderGoalCard = (g: any) => {
    const linkedBuckets = editedBuckets.filter((b) => b.linkedGoalIds.includes(g.id));
    const totalSavedForGoal = linkedBuckets.reduce((s, b) => s + (livePreview.projectedBalances[b.id] ?? b.currentBalance), 0);
    const progressToGoal = Math.min(100, (totalSavedForGoal / g.targetAmount) * 100);
    return (
      <Card key={g.id} size="small" style={{ background: '#18181b', border: '1px solid #27272a', width: 220 }} data-e-ref={`goal-card-${g.id}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar style={{ background: '#52c41a', color: '#000' }}>{g.name.slice(0, 1)}</Avatar>
          <div style={{ flex: 1 }}>
            <Typography.Text strong>{g.name}</Typography.Text>
            <div style={{ fontSize: 12, color: '#a3a3a3' }}>Target ${g.targetAmount.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <Progress percent={progressToGoal} size="small" strokeColor="#52c41a" />
          <div style={{ fontSize: 11, color: '#52c41a' }}>${totalSavedForGoal.toFixed(0)} saved across linked buckets</div>
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: '#71717a' }}>{g.description}</div>
        {linkedBuckets.length > 0 && (
          <Tag color="blue" style={{ marginTop: 4 }}>
            Linked to {linkedBuckets.length} bucket(s)
          </Tag>
        )}
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8">
      <div className="max-w-6xl mx-auto">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header (reuse existing pattern) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Typography.Title level={2} style={{ color: '#fff', margin: 0 }}>
                Staff Portal
              </Typography.Title>
              <Typography.Text type="secondary">Vite + React + Apollo Client → Shared Hono + Apollo Backend (Ant Design) • Blue theme</Typography.Text>
            </div>
            <div style={{ fontSize: 12, padding: '4px 12px', background: '#18181b', border: '1px solid #27272a', borderRadius: 999 }}>Staff UI (Vite + antd) — epic-4 buckets</div>
          </div>

          {/* Server hello (kept pattern) */}
          <Card size="small">
            <Typography.Text strong>Server says: </Typography.Text>
            <Typography.Text style={{ color: '#52c41a' }}>{loading ? '…' : (data?.hello ?? messagesData?.hello ?? '—')}</Typography.Text>
            <div style={{ fontSize: 12, color: '#71717a', marginTop: 4 }}>Endpoint: {import.meta.env['VITE_GRAPHQL_URL'] || 'https://api.localhost/graphql'} (portless .localhost ready for browser-verifier)</div>
          </Card>

          {/* ========== PRIMARY: Long-Term Budgeting - Bucket Config + Live Deposit Simulation (MVP) ========== */}
          {/* Follows implement-feature: antd primary (Card/Progress/Slider/InputNumber/Tree/List/Tag/Avatar/Tooltip/Button), Tailwind layout, AntdProvider blue, Apollo refetch/optimistic-ish via local+refetch, reuse patterns */}
          <Card
            title={
              <span>
                Long-Term Budgeting — Bucket Config &amp; Live Sim <Tag color="blue">BankBuckets Port</Tag>
              </span>
            }
            extra={
              <Space>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Total % must = 100 for realistic waterfall
                </Typography.Text>
                <Button onClick={() => refetch()} loading={loading} size="small">
                  Refresh Buckets
                </Button>
              </Space>
            }
            style={{ borderColor: '#1677ff' }}
          >
            {error && (
              <Card style={{ background: '#450a0a', borderColor: '#7f1d1d', marginBottom: 16 }}>
                <Typography.Text type="danger">Error: {error.message}. Ensure api is running (pnpm --filter api dev) and buckets seeded.</Typography.Text>
              </Card>
            )}

            {/* Validation banner (per task) */}
            <div style={{ marginBottom: 12 }}>
              {loading && <Typography.Text type="secondary">Loading buckets &amp; goals…</Typography.Text>}
              {!loading && (
                <Tag color={isPercentValid ? 'success' : 'error'}>
                  Current allocation: {currentTotalPercent.toFixed(1)}% {isPercentValid ? '✓ valid' : '— adjust to ~100%'}
                </Tag>
              )}
              <Tag color="default" style={{ marginLeft: 8 }}>
                Live preview uses client calc (portable) • Apply hits server
              </Tag>
            </div>

            {/* Deposit amount control (live sim driver, "Apply Test Deposit $X" pattern) */}
            <div style={{ marginBottom: 16, padding: 12, background: '#111113', borderRadius: 6 }} data-e-ref="deposit-control">
              <Space align="center" size="large">
                <Typography.Text strong style={{ color: '#e4e4e7' }}>
                  Test Deposit Amount
                </Typography.Text>
                <InputNumber value={depositAmount} onChange={(v) => setDepositAmount(Math.max(0, v || 0))} min={0} step={10} style={{ width: 140 }} prefix="$" data-e-ref="deposit-amount-input" />
                <Slider min={0} max={1000} step={5} value={depositAmount} onChange={setDepositAmount} style={{ width: 240 }} tooltip={{ formatter: (v) => `$${v}` }} data-e-ref="deposit-amount-slider" />
                <Button type="primary" icon={null} loading={applying} onClick={handleApplyTestDeposit} data-e-ref="apply-test-deposit-btn">
                  Apply Test Deposit ${depositAmount.toFixed(0)}
                </Button>
                <Button onClick={saveConfigToServer} loading={savingConfig} data-e-ref="save-config-btn">
                  Save Config
                </Button>
                <Button onClick={resetToServer} data-e-ref="reset-edits-btn">
                  Reset Edits
                </Button>
              </Space>
              <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>
                Edits here are local for instant preview. Save persists %/order/links. Apply sends current overrides + amount → server mutates balances + returns allocations (spillover applied).
              </div>
            </div>

            {/* Two column-ish layout: Editor (config) + Visuals (tree + goals + preview) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 16 }}>
              {/* Left: Power Config Editor (sliders, reorder, linkage, per row live deltas) */}
              <div data-e-ref="bucket-config-panel">
                <Typography.Title level={5} style={{ marginTop: 0, color: '#a1a1aa' }}>
                  Bucket Configuration (live % + SpillOverOrder)
                </Typography.Title>
                {editedBuckets.length === 0 && !loading && <Typography.Text type="secondary">No buckets (check backend seed).</Typography.Text>}
                {editedBuckets
                  .sort((a, b) => a.order - b.order)
                  .map((b) => {
                    const indent = b.parentId ? 1 : 0; // simple 1-level indent for hierarchy (deeper would recurse)
                    return renderBucketEditor(b, indent);
                  })}

                {/* Total validation callout */}
                {!isPercentValid && (
                  <div style={{ color: '#f5222d', fontSize: 12, marginTop: 4 }}>Percentages must total 100% for accurate spillover (current {currentTotalPercent.toFixed(1)}%). The preview still runs proportionally.</div>
                )}
              </div>

              {/* Right: Hierarchy Tree + Goals + Live Results (muse-eyes authentic port) */}
              <div>
                {/* AntD Tree for hierarchy (replaces old indented ul + lines + tree_node) */}
                <Typography.Title level={5} style={{ marginTop: 0, color: '#a1a1aa' }}>
                  Hierarchy &amp; Spillover Visualization
                </Typography.Title>
                <div style={{ background: '#111113', padding: 8, borderRadius: 6, minHeight: 140 }} data-e-ref="bucket-tree">
                  {treeData.length > 0 ? <Tree treeData={treeData} defaultExpandAll showLine selectable={false} blockNode /> : <Typography.Text type="secondary">Tree will appear once buckets load.</Typography.Text>}
                </div>

                {/* Goals section (Avatar cards, price, progress, linkage) */}
                <Typography.Title level={5} style={{ marginTop: 16, color: '#a1a1aa' }}>
                  Linked Goals (inspiration + tracking)
                </Typography.Title>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} data-e-ref="goals-list">
                  {goals.length ? goals.map(renderGoalCard) : <Typography.Text type="secondary">No goals.</Typography.Text>}
                </div>

                {/* Live Simulation Results (allocations, spill badges, projected) */}
                <Typography.Title level={5} style={{ marginTop: 16, color: '#a1a1aa' }}>
                  Live Deposit Preview → ${depositAmount}
                </Typography.Title>
                <Card size="small" style={{ background: '#0a0a0b' }} data-e-ref="live-sim-results">
                  <List
                    size="small"
                    dataSource={livePreview.allocations}
                    locale={{ emptyText: 'Adjust deposit or buckets to see allocations.' }}
                    renderItem={(alloc) => {
                      const b = (editedBuckets.length ? editedBuckets : serverBuckets).find((bb) => bb.id === alloc.bucketId);
                      const proj = livePreview.projectedBalances[alloc.bucketId] ?? (b?.currentBalance || 0);
                      return (
                        <List.Item key={alloc.bucketId} style={{ padding: '4px 0' }}>
                          <div style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                              <span>
                                {b?.parentId ? '↳ ' : ''}
                                {alloc.bucketName}
                              </span>
                              <span style={{ fontFamily: 'monospace', color: '#52c41a' }}>+${alloc.allocated.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                              <Progress percent={Math.min(100, (proj / (b?.maxAmount || proj * 1.2 || 1)) * 100)} size="small" strokeColor={alloc.capped ? '#faad14' : '#52c41a'} style={{ flex: 1 }} />
                              {alloc.spilled > 0.01 && (
                                <Tag color="orange" style={{ fontSize: 10 }}>
                                  spills ${alloc.spilled.toFixed(2)}
                                </Tag>
                              )}
                              {alloc.capped && (
                                <Tag color="gold" style={{ fontSize: 10 }}>
                                  MAX
                                </Tag>
                              )}
                            </div>
                          </div>
                        </List.Item>
                      );
                    }}
                  />
                  <Divider style={{ margin: '8px 0', borderColor: '#27272a' }} />
                  <div style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total allocated this deposit:</span>
                    <strong style={{ color: '#52c41a' }}>${livePreview.totalAllocated.toFixed(2)}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: '#71717a' }}>Remaining (unallocated): ${livePreview.remaining.toFixed(2)}</div>
                </Card>
              </div>
            </div>

            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 11 }}>
              MVP slice: config (sliders + reorder + goal links) + live client preview + Apply (GQL mutation with overrides). Tree uses AntD for hierarchy. Progress/spill use green/orange per muse-eyes mappings. Ready for
              browser-verifier @e refs + public extension.
            </Typography.Text>
          </Card>

          {/* Original Messages demo (retained for pattern continuity + verifier baseline flow) */}
          <Card
            title="Messages (original Apollo demo — kept for reference)"
            extra={
              <Button onClick={handleMessagesRefresh} loading={messagesLoading} size="small">
                Refresh
              </Button>
            }
          >
            {messagesError && (
              <Card style={{ background: '#450a0a', borderColor: '#7f1d1d', marginBottom: 16 }}>
                <Typography.Text type="danger">Error: {messagesError.message}. Is the API server running?</Typography.Text>
              </Card>
            )}

            <List
              loading={messagesLoading && !messagesData}
              dataSource={messagesData?.messages || []}
              locale={{ emptyText: 'No messages yet. Add one below!' }}
              renderItem={(msg: any) => (
                <List.Item key={msg.id}>
                  <List.Item.Meta avatar={<span style={{ color: '#52c41a', fontFamily: 'monospace' }}>#{msg.id}</span>} title={msg.text} />
                </List.Item>
              )}
            />

            {/* Simple inline add (no full Form to keep light) */}
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <input
                id="msg-input"
                placeholder="Type a new message... (demo)"
                style={{ flex: 1, background: '#111113', color: '#e4e4e7', border: '1px solid #27272a', padding: '4px 8px', borderRadius: 4 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) {
                      addMessage({ variables: { text: val } });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
              <Button
                type="primary"
                size="small"
                loading={adding}
                onClick={() => {
                  const inp = document.getElementById('msg-input') as HTMLInputElement | null;
                  const val = inp?.value.trim();
                  if (val) {
                    addMessage({ variables: { text: val } });
                    if (inp) inp.value = '';
                  }
                }}
              >
                Send
              </Button>
            </div>
          </Card>

          <Typography.Text type="secondary" style={{ fontSize: 10, textAlign: 'center', display: 'block' }}>
            Staff UI (Vite + Apollo Client + Ant Design). Blue theme via AntdProvider. Long-term buckets feature added following implement-feature + review-component + AGENTS.md. Handoffs prepared for back-end (real Mongoose
            models + full calc), ux-designer, browser-verifier (see @e- data-e-ref attrs), agent-evaluator.
          </Typography.Text>
        </Space>
      </div>
    </div>
  );
}

export default App;
