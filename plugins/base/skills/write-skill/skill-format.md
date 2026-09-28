# Skill pack format

Reference for agent skill directories. Loaded by the `write-skill` skill at the write step.

## Layout

```text
<skills-root>/
  <skill-name>/            # one level under skills/ — nested deeper is not discovered
    SKILL.md               # required: frontmatter + body
    references/            # optional: disclosed reference files
    scripts/               # optional: executable helpers
```

| Home | Path |
| --- | --- |
| Project | `<repo>/.omp/skills/<skill-name>/` |
| User | `~/.agents/skills/<skill-name>/` |
| Plugin | `<plugin>/skills/<skill-name>/` |

Discovery is non-recursive: exactly `<skills-root>/<skill-name>/SKILL.md`. Dedup is first-wins by `name`; higher-precedence provider wins (native > plugins > user dirs).

## SKILL.md frontmatter

Required in practice:

- `name` — defaults to directory name; set it explicitly.
- `description` — the model-facing trigger pointer. The only always-loaded text the skill spends; the wording decides when the skill fires. For user-invoked skills it becomes a human-facing one-liner.

Optional:

- `disable-model-invocation: true` — user-invoked: strips the agent's reach, zero context load. The `description` loses its trigger lists.
- `hide: true` — hidden from the prompt listing; still reachable via `skill://<name>` and `/skill:<name>`.
- `globs` — path patterns surfaced in the prompt listing; advisory, not enforced for selection.
- `alwaysApply: true` — full body injected every turn (rare: costs context every run; prefer a sharp `description`).

## Body

The body is the workflow the agent follows when the skill fires. Two content types mix freely:

- **Steps** — ordered actions, each ending on a completion criterion.
- **Reference** — rules/facts consulted on demand; a flat peer-set on one rung is fine.

Split across files when the cut earns it:

- `SKILL.md` — the main path: steps every run takes, plus pointers.
- `references/<topic>.md` — disclosed reference: material only some branches reach. The pointer names the file and states the branches that reach it.
- `scripts/<task>.<ext>` — deterministic executables a step can run with the terminal tool. A script replaces prose the agent would improvise; it does not replace judgement.

All paths resolve against the skill directory. Reach assets via `skill://<name>/references/<file>` (read) or `skill://<name>/scripts/<file>` (run); absolute paths and `..` traversal are rejected.

## Worked example

```text
pdf/
  SKILL.md               # steps: extract → summarize → verify
  references/
    table-formats.md     # only the table-extraction branch reads this
  scripts/
    extract.py           # deterministic text extraction
```

```md
---
name: pdf
description: Use for PDF extraction, tables, and form data — triggers include "read this PDF", "extract tables", form fields.
---

Extract PDF content deterministically. Run scripts/extract.py with the terminal tool;
resolve paths against this skill directory.

## Table extraction
Read skill://pdf/references/table-formats.md before parsing any table.
...
```
