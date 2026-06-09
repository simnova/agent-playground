# Token Effectiveness Summary
**Generated:** 2026-06-09T00:34:36.352Z
**Workspace:** /Volumes/files/src/agentPlayground

## Summary
- **Distinct models seen:** grok-build
- **Sampled inference turns:** 50
- **Total sampled model time:** 353677 ms
- **Subagents analyzed:** 1

## Subagents (Tier Breakdown)
| Subagent ID | Model | Messages |
|-------------|-------|----------|
| 019ea8fa-8d7e-7882-9ab1-01562cfd1f3f | grok-build | 6864 |

## Recent Inference Timing (model_elapsed_ms samples)
(Lower times = cheaper/faster models doing the work)
| Timestamp | Model Time (ms) |
|-----------|-----------------|
| 2026-06-09T00:31:24.329Z | 5687 |
| 2026-06-09T00:31:29.067Z | 4365 |
| 2026-06-09T00:31:34.484Z | 4287 |
| 2026-06-09T00:31:43.504Z | 8905 |
| 2026-06-09T00:34:03.116Z | 14544 |
| 2026-06-09T00:34:05.833Z | 2711 |
| 2026-06-09T00:34:17.863Z | 12023 |
| 2026-06-09T00:34:25.642Z | 7756 |
| 2026-06-09T00:34:28.959Z | 3292 |
| 2026-06-09T00:34:33.373Z | 3974 |

## Interpretation (for self-improvement)
- High volume of low-ms turns on deepseek-4-fast indicates successful use of juniors.
- Descaling after grok-4-* work should show subsequent cheap subagents handling follow-ups.
- Run this periodically via agent-evaluator to track shifts in tier utilization and cost per value.

*This report is generated as part of the work being accomplished and committed for visibility (parallel to screenshots).*