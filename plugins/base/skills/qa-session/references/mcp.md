# MCP surface

Probe as the agent client: list tools, call them, judge by what a calling agent receives.

## How to probe

1. Connect to the server the way a real client does — the repo's MCP config, `npx @modelcontextprotocol/inspector`, or a small stdio/HTTP client script.
2. List tools/resources/prompts. Judge against the work unit's claims: a tool the diff claims to add but `tools/list` does not return is a fail.
3. For each expectation, call the tool with the arguments an agent would plausibly send — including the malformed or edge arguments the tool description claims to handle.
4. Judge the result envelope: content blocks, `isError` flag, error message quality. An agent consuming this must be able to tell success from failure without guessing.
5. Check tool descriptions and JSON schemas: they are the agent's only always-loaded context. Vague descriptions that would mis-trigger a model are a real defect.

## Evidence

Capture per expectation: tool name, arguments sent, full result envelope. For schema issues, quote the schema fragment.
