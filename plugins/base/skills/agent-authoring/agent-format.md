# Agent definition format

Reference for omp task-agent `.md` files. Loaded by the `agent-authoring` skill at the write step.

## File location

| Home | Path | Scope |
| --- | --- | --- |
| Project | `<repo>/.omp/agents/<name>.md` | Repo-shared; overrides user on name collision |
| User | `~/.omp/agent/agents/<name>.md` | Personal, all projects |
| Plugin | `<plugin>/agents/<name>.md` | Distributed with the plugin |

First-wins by exact `name` (case-sensitive): project beats user beats plugin beats bundled. One bad file skips that file only — discovery continues.

## Frontmatter

Required:

- `name` — exact dispatch name. Lowercase, no spaces.
- `description` — the model-facing trigger pointer (craft rules in the skill, step 2).

Optional:

- `tools` — CSV or array. Read-only set: `read, find, grep, glob, web_search`. Mutation set adds `edit, write, bash`. `yield` is auto-added. Omit for the full default set.
- `spawns` — `*` (anything), CSV of agent names, or omit (no children). If `tools` includes `task`, spawns defaults to `*`.
- `model` — one selector, CSV, or array tried in order. Role aliases (`@smol`, `@slow`, `@plan`, custom `@role`) resolve through `modelRoles` in `config.yml`; concrete form: `provider/model:effort`.
- `thinking-level` — `off|minimal|low|medium|high|xhigh|max|auto`.
- `output` — schema object; parent receives parsed payload at `agent://<id>`. `properties` (required) + `optionalProperties` (omittable). Invalid payloads reject after retries.
- `blocking: true` — parent waits even when async is enabled. Omit for fire-and-forget.
- `read-summarize: false` — `read` returns verbatim file content instead of structural summaries. For agents needing exact bytes.
- `autoloadSkills` — skill names from the parent session injected before the first prompt.
- `prewalk` — hands off to the smol model at first edit/write. `"@smol"` or a selector.
- `advisor: true` — pairs the agent with an advisor model reviewing each turn.

## Body

The body is the agent's system prompt. Inputs arrive in order: the parent's `context` string, then the dispatch `task` text. Structure that survives dispatch:

```
One-line job statement.

<contract>: what the agent receives, what it returns, constraints,
completion criteria. RFC 2119 for correctness-critical behavior.
```

Precedence the definition cannot override: plan mode restricts tools to `read, grep, glob, web_search` regardless of `tools`; `task.maxRecursionDepth` (default 2) strips `task` from children at the cap; `task.disabledAgents` and the parent's spawn policy gate dispatch.

## Worked example

```md
---
name: release-notes
description: Use for changelog and release-note drafting from merged commits — triggers include "release notes", "changelog entry", "what shipped".
tools: read, find, grep, glob, bash
model: "@smol"
---

Draft release notes from git history. You receive a version range; return markdown
ready to paste.

# Contract
- MUST base every entry on commits reachable in the given range (`git log`).
- MUST group user-visible changes; skip refactor/chore commits.
- Return only the notes: no preamble, no commit hashes.
```

Smoke dispatch: `{"agent": "release-notes", "task": "v1.2.0..v1.2.1"}`
