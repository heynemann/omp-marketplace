# GraphQL surface

Probe as the client: real queries against the running endpoint, judged by the response envelope.

## How to probe

1. Read the schema the work unit touched — introspection query or the SDL in the repo. Confirm the fields/types the diff claims to add are actually in the live schema.
2. Send each expectation as a real operation: the query a frontend or API consumer would run, with realistic variables. Use `curl` or the repo's client.
3. Judge the envelope: `data` AND `errors` together. Partial data with errors is a distinct outcome — decide from the contract whether the expectation tolerates it. A query that returns data but silently drops a requested field (null without error) is a fail.
4. Error expectations: the `errors[].message` and any `extensions.code` a consumer branches on must match what the work unit promises.
5. Check N+1 and authz only where the work unit claims performance or authorization behavior — do not broaden scope silently.

## Evidence

Capture per expectation: operation sent (query + variables) and the full response JSON. Errors verbatim.
