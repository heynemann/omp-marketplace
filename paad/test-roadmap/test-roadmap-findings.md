# Findings log — omp-plugin-base

## F1 — dead ternary in the `openrouter` command handler

**Where:** plugins/base/extensions/openrouter-usage.js:87

**Behavior:** `const text = (ctx || lastCtx)?.ui?.setStatus && lastCtx ? "refreshed" : "refreshed"` always
evaluates to `"refreshed"` — both ternary branches are identical.

**Contradicts:** the ternary's own condition, which checks `ui?.setStatus && lastCtx` as if the two cases
meant to render different messages.

**Action:** simplify to `const text = "refreshed"` or make the false branch meaningful (e.g. `"but status bar is not available"`).

**Pinned by:** Phase 3 — its tests lock the refresh path's observable behavior; the handler text itself is not
asserted, so fixing this does not turn a test red. Reconcile on touch.
