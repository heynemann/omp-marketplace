---
name: write-skill
description: Use when creating, designing, or fixing an agent skill (SKILL.md pack) — triggers include "write a skill", "make me a skill", "create a skill", skill directories, and skills that fail to trigger or fire on the wrong tasks.
---

# write-skill

Turn a capability into an agent skill: grill the design, write the pack, smoke the trigger. Three steps, in order. Each ends on a completion criterion; do not advance early.

## 1. Grill

Map the skill as a **design tree** and interview the user per the grilling-via-ask rule. Facts you can look up (existing skills, naming collisions, tool availability) are yours — check the candidate home directories first; the *decisions* are the user's.

Frontier branches, in rough order:

- **Job**: what the agent does differently when the skill fires. One sentence.
- **Invocation**: model-invoked (agent reaches it from a `description`; pays context load) or user-invoked (`disable-model-invocation: true`; only the human fires it). If several user-invoked skills pile up, a router skill names them.
- **Branches**: the distinct cases that take different paths through the skill. Branches decide what stays inline and what goes behind a pointer.
- **Assets**: does the skill need `references/` (disclosed reference files) or `scripts/` (executable helpers)? Rules in step 2.
- **Triggers**: the words a user or agent says that should fire it. These become the `description`.
- **Home**: project `.omp/skills/`, user `~/.agents/skills/`, or a plugin's `skills/` dir (distributed with base@heynemann).

Completion: frontier empty **and** the user confirms the design. Read back the tree before writing anything.

## 2. Write

Read [`skill-format.md`](skill-format.md), then write one skill directory named `<skill-name>/` containing `SKILL.md` in the home the user picked.

Craft rules (one lever each, applied while writing):

- **Hierarchy**: steps in order, reference on demand, everything only some branches need pushed behind a pointer.
- **Pointers**: the `description` and in-file pointers front-load the trigger words and list the branches; the wording, not the target, decides when the material is reached.
- **Leading words**: collapse spelled-out triads into one pretrained token the agent thinks with (`red`, `tracer bullet`, `tight`); coin a word only when no existing one fits.
- **Positive phrasing**: prompt the target behavior; a prohibition earns its place only as a hard guardrail, paired with the positive target.
- **Pruning**: one meaning in one place; restatements of the environment are caches — keep only what the agent cannot find by looking; delete sentences that fail the no-op test.
- **Completion criteria**: every step ends checkable and exhaustive; vague bounds invite premature completion.
- **RFC 2119**: MUST/SHOULD/OPTIONAL with real weight — MUST for correctness-critical behavior, never for style.

**Assets**: `references/` and `scripts/` live inside the skill folder next to `SKILL.md` and resolve via `skill://<name>/references/...`. Include `references/` when some branches need material the others never touch (per-topic rules, format specs, worked examples); include `scripts/` when a step needs a deterministic executable (a checker, a formatter, a data fetch) that prose would make the agent improvise. A skill needs neither when one file carries it. Reach for a `references/` file before splitting the skill in two; split the skill only on a real invocation boundary.

Completion: files written, frontmatter parses (name + description non-empty), every pointer names a file that exists. Re-read the pack once before advancing.

## 3. Smoke

Prove the skill works as a skill, not as prose: confirm discovery (`omp skill list` shows it from the chosen home), then exercise the core path — run any script with the terminal tool, `read` each reference through `skill://`, and dispatch a representative task to confirm the description fires on its trigger words and the body's steps are followable end to end. Fix what the smoke exposes — a missed trigger, a dead pointer, an unrunnable script — then smoke again.

Completion: discovery confirmed and the core path exercised without improvisation.

Report to the user: skill directory, the trigger `description` verbatim, and the smoke result.
