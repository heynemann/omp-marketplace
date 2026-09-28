# Test roadmap — omp-plugin-base

## Decisions

- Test runner: `vitest` (developer choice over `node:test`; zero-dep repo gains a dev dependency + config,
  accepted).
- Suite strategy: unit-first, risk-ordered (developer choice) — densest branches (`fmtUsd`, `pickMonthUsage`)
  first, then status-text logic, then doctor checks.
- Weak-test rewrite: N/A — no tests existed; grading skipped.
- Test organization (detected): new `plugins/base/tests/` tree with `unit/` and `integration/` subdirs;
  vitest default include.
- e2e tier: none planned — the surface is an interactive omp session, not scriptable here. Not omitted; checked.
- Coverage tool: none installed. Phase gap-finding used agent judgment reading source, not coverage output.
  Vitest coverage needs `@vitest/coverage-v8` — install it with vitest before running coverage commands.

Tiers (run | coverage):

- unit: `npx vitest run plugins/base/tests/unit` |
  `npx vitest run plugins/base/tests/unit --coverage`
- integration: `npx vitest run plugins/base/tests/integration` |
  `npx vitest run plugins/base/tests/integration --coverage`
- e2e: (none planned) | (none)

## Phase 1: fmtUsd money formatting

Tier: unit
Catches: a threshold regression in `fmtUsd` (e.g. `>=1000` drifting to `>1000` or the `>=100` Math.round band
misfiring) that corrupts every status-bar dollar figure; non-finite values rendering as `$NaN` instead of `"?"`.
Produces: plugins/base/tests/unit/openrouter-usage-fmt.test.js
Branch: test-roadmap
Landed: 2026-09-28 08f0dd5 (flip comparison >= to >; negate condition)

## Phase 2: pickMonthUsage precedence

Tier: unit
Catches: a precedence reorder in `pickMonthUsage` that surfaces the per-key reset-window figure (`usage_monthly`)
when a calendar-month field exists, or stops falling back to `null` when the API reports nothing usable.
Produces: plugins/base/tests/unit/openrouter-usage-pick.test.js
Branch: test-roadmap
Landed: 2026-09-28 1d95793 (drop state transition: usage_month removed from priority loop; negate condition)

## Phase 3: refresh() status-text composition

Tier: unit
Catches: the status bar losing its "left" segment when `limit_remaining` is absent but lifetime credits are known;
the `Math.max(0, …)` clamp regressing to negative leftovers; a network/auth error wiping the last good status
instead of keeping it; a missing `OPENROUTER_API_KEY` failing to clear the status.
Produces: plugins/base/tests/unit/openrouter-usage-refresh.test.js
Branch: test-roadmap
Landed: 2026-09-28 d8e123f (negate condition ×3: left-fallback guard, Math.max clamp constant, no-key guard ×2)

## Phase 4: base-doctor lockfile & plugin presence

Tier: unit
Catches: `pluginPresent` returning true when the lockfile lacks the entry (or the node_modules dir is gone) —
the doctor then skips installing plugins a fresh machine actually needs; `readLockfile` crashing instead of
returning `{plugins:{}}` on a missing/corrupt lockfile.
Produces: plugins/base/tests/unit/base-doctor-presence.test.js
Branch: test-roadmap
Landed: 2026-09-28 207fb93 (negate condition: lock-entry guard; alter constant: lockfile fallback map)

## Phase 5: doctor() check aggregation

Tier: integration
Catches: the doctor skipping a check silently (env, bundled-skills count, hypa shim fallback) or miscounting
failures so "all checks passed" prints over real failures.
Produces: plugins/base/tests/integration/base-doctor-aggregation.test.js
Branch: test-roadmap
Landed: 2026-09-28 371195d (flip comparison: skills threshold >=79 to >79; negate condition: summary zero-failure guard)
