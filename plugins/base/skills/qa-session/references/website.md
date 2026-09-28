# Website surface

Probe as the user: drive a real browser, exercise flows end to end, judge what renders and what responds.

## Tools

- `agent-browser` skill for navigation, clicks, forms, screenshots, and scripted flows.
- Chrome DevTools MCP (`xd://mcp__chrome_devtools_*`) or Lightpanda MCP for a11y-tree inspection, console messages, and network requests.

## How to probe

1. Load the app entry point the user would start from (home, dashboard, deep link from the work unit).
2. Walk each confirmed expectation as the user would: navigate, click, fill, submit. Never verify a flow by reading code or API calls alone when the surface is the rendered page.
3. At each expectation point capture evidence: screenshot, plus console messages and network requests when something looks wrong.
4. Verify feedback states, not just end states: loading, empty, error, and success views a user touches on the way.

## Watch for

- Silent failures: request returned 4xx/5xx while the page kept rendering stale or empty content.
- Console errors that do not surface visibly to the user but corrupt the flow downstream.
- Happy path works, but the state a returning user lands in (refresh, back navigation, stale tab) diverges.
