# gRPC surface

Probe as the client: real RPCs against the running service, judged by status codes and messages.

## How to probe

1. Find the service definition the work unit touched: `.proto` files, server reflection, or generated stubs.
2. Call each expectation with a real client — `grpcurl` (with `-plaintext` for non-TLS, `-import-path`/`-proto` or reflection), or the repo's generated client via a throwaway script.
3. Judge: gRPC status code (`OK`, `INVALID_ARGUMENT`, `NOT_FOUND`, ...), message payload, and for streams the full sequence (count, ordering, trailing status).
4. For streaming expectations, capture every message received, not a sample — ordering and termination are part of the contract.
5. Error expectations: wrong input MUST come back as the specific status the contract promises, not a generic `UNKNOWN`.

## Evidence

Capture per expectation: method called, request message, status code, response message(s). Keep messages verbatim — truncation hides the bug.
