# heynemann — omp plugin marketplace

Plugin marketplace for [omp](https://omp.sh).

```
omp plugin marketplace add heynemann/heynemann
omp plugin install base@heynemann
```

## Plugins

- **base** — your standard omp setup in one install: OpenRouter spend toolbar
  (month-to-date + remaining credits in the status bar), 79 bundled skills
  (samber golang set, mattpocock engineering set, test-roadmap, vercel,
  hallmark, beads), and MCP servers. See
  [`plugins/base/README.md`](plugins/base/README.md).

## Layout

```
.omp-plugin/marketplace.json   # catalog
plugins/base/                  # base plugin
```

## Adding a plugin

1. `mkdir plugins/<name>`, add `package.json` with an `omp` manifest
   (`extensions`, and/or conventional `skills/`, `commands/`, `hooks/`,
   `tools/`, `agents/`, `.mcp.json`).
2. Add an entry to `.omp-plugin/marketplace.json`.
3. Test locally: `omp plugin marketplace add ./` then
   `omp plugin install <name>@heynemann`.
