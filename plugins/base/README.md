# base

Base omp plugin: install once, get your full setup.

- **OpenRouter toolbar** — month-to-date spend + remaining credits in the omp
  status bar (`⚡ $305.70 this month • $124.30 left`). Refreshes every 10 min;
  `/openrouter` forces a refresh. Needs `OPENROUTER_API_KEY`.
- **Skills** — bundled skill packs (79): all 46 `golang-*` skills
  ([samber/cc-skills-golang](https://github.com/samber/cc-skills-golang)), the
  [mattpocock/skills](https://github.com/mattpocock/skills) engineering set,
  `test-roadmap` from [Ovid/paad](https://github.com/Ovid/paad) (MIT), and
  `vercel-composition-patterns`, `vercel-react-best-practices`
  ([vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)),
  `agent-browser` ([vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser)),
  `frontend-design`, `hallmark` ([nutlope/hallmark](https://github.com/nutlope/hallmark)),
  `beads` ([gastownhall/beads](https://github.com/gastownhall/beads)).
  Plus `base-config`, which documents this setup to the agent.
- **MCP servers** — add entries to `.mcp.json` here.
- **Rules** — `rules/` dir; always-apply rules injected into every session
  (e.g. `grilling-via-ask`: grilling rounds must use the `ask` tool with 3
  options, one recommended).
- **Auto-setup** — on first session start, installs missing required omp
  plugins: `@kryoz/caveman-plugin`, `@dietrichgebert/ponytail`,
  `npm:@hypabolic/pi-hypa`. Install happens in the background; restart or
  `/reload-plugins` activates newly installed ones.
- **`/base-doctor`** — verifies `OPENROUTER_API_KEY`, required plugins, the
  `hypa` binary, bundled skills, and OpenRouter API reachability.

## Install

```
omp plugin marketplace add heynemann/heynemann
omp plugin install base@heynemann
```

## Updating bundled skills

Skills are vendored copies of their upstream repos. To refresh one: delete
`skills/<name>/`, copy the new version from the upstream repo (or your
`~/.agents/skills/<name>` if you installed it there), bump the version in
`package.json` + `.omp-plugin/marketplace.json`, and reinstall with
`omp plugin install --force base@heynemann`.

## Layout

```
base/
  package.json                  # omp.extensions manifest
  extensions/openrouter-usage.js
  skills/                       # 79 vendored skills
  .mcp.json                     # MCP servers shipped by this plugin
```
