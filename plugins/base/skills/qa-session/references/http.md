# HTTP API surface

Probe as the client: real requests against the running API, judged by what a consumer gets back.

## How to probe

1. Identify the endpoints the work unit touched and the requests a consumer would send (method, path, payload, auth).
2. Send each expectation as an actual request — `curl` or the repo's existing client/test harness. Include the headers a real client sends (`Content-Type`, auth).
3. Judge the full response: status, body shape, field values, error messages. A 200 with a wrong payload is a fail, not a pass.
4. For expectations the contract claims (validation, auth, idempotency), send the negative case too: bad input, missing auth, duplicate request. The existing skills `api-negative-testing`, `api-contract-testing`, and `api-idempotency-testing` hold detailed design rules — read them when the expectation is contract-shaped.

## Evidence

Capture the exact response (status + body) per expectation. For failures, also capture the request you sent and the server log line if reachable.
