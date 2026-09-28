# Docker Compose surface

Probe the stack: does `docker compose up` deliver a working system the user can reach.

## How to probe

1. Bring the stack up the way the user would: `docker compose up -d --build` (or the repo's documented variant). Note warnings and errors during startup — a service that crashes and restarts into a degraded state is a defect.
2. Wait for readiness with evidence, not vibes: poll healthchecks, `docker compose ps`, and the first successful request. Record how long startup took.
3. Verify the wiring a user touches: service-to-service calls succeed, published ports respond from the host, env vars/config the compose file sets actually reach the containers.
4. Exercise the surface expectations through the stack's public entry point (website or API on the published port) — not by exec-ing into containers. If the work unit also touches a website/API, load that surface's reference and probe through the compose stack.
5. Restart resilience where claimed: `docker compose restart <service>` and confirm recovery, only if the work unit promises it.

## Evidence

Capture per expectation: the command/URL exercised, its output (status, body), and `docker compose ps` state. For startup failures, the failing container's logs.
