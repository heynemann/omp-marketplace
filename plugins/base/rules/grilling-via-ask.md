---
description: How grilling rounds must be delivered to the user
alwaysApply: true
---

# Grilling must use `ask`

When running the `grilling` skill (or any "grill the user" flow), every
question round MUST be delivered through the `ask` tool — NEVER as a formatted
list of text in the reply.

Requirements per question:

- One `ask` call with the whole round as `questions` (one entry per question).
- Each question provides exactly **3 options** in `options` — never 2, never
  more than 3 — each with a short `label` and a one-line `description`
  capturing the tradeoff.
- Exactly one option is marked as recommended via the zero-based
  `recommended` index.
- Option labels must not use reserved labels: `Other (type your own)`,
  `Chat about this`, `Next →` (the runtime adds its own controls).

The `❓/➡️` text format from the grilling skill applies only to content
(question title, question body, rationale for the recommendation) — it never
replaces the `ask` call itself. Put the question body into `question` and the
recommendation rationale into the recommended option's `description`.

If the session has no interactive UI (headless/`-p` mode), say so and stop the
grilling flow instead of falling back to a text list.
