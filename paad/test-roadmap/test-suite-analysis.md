# Test-suite analysis — omp-plugin-base

Grading (Stage 2) skipped: no tests existed — greenfield.

## Ledger — test doubles & fixtures (proposed)

Classes, in plain words:
- `boundary` — a real external edge the test keeps real (network, clock, env vars).
- `scaffold` — a stand-in that only exists because the code is hard to test as written; it marks test debt to retire later.
- `data` — constructed test data that is permanent and correct.

| Double / fixture | Phase | Class | Notes |
|---|---|---|---|
| `fetch` stub returning canned credits/key payloads | 3 | scaffold | `refresh()` takes no fetch injection; a module-level stub stands in for the network. Retired by an injectable-fetch refactor if one is ever planned. |
| `ctx` stub exposing `ui.setStatus` | 3 | scaffold | omp context object rebuilt by hand; retires with an exported status-composition function. |
| Temp-dir lockfile + `HOME`/`PLUGINS_NM` redirection | 4, 5 | data | Constructed fs state, permanent and correct. |
| Real bundled `plugins/base/skills/` dir read | 5 | data | Doctor's skills-count check reads the repo's own tree; the test runs from the repo so the real dir is the fixture. |
| `process.env.OPENROUTER_API_KEY` manipulation | 5 | boundary | Env is a real external edge; tests set/unset it deliberately. |
| Network reachability check in `doctor()` | 5 | boundary | Tests leave the key unset so the network branch is skipped — no mock of the live API. |

Silence defaults to `scaffold`: any double not classified above is scaffold debt.