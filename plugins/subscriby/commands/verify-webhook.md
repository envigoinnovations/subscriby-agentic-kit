---
description: "Write a Subscriby webhook signature verifier and its test into the current repository, in the project's language and conventions, with the signed fixture that proves it."
argument-hint: "[node|php|python]"
disable-model-invocation: true
---

Add a verified Subscriby webhook receiver to the repository the user is working in, following the `webhooks` skill.

1. Find the language: `$ARGUMENTS` when given; otherwise `package.json` means Node or TypeScript (Express, Fastify, Next, Hono as the framework present), `composer.json` means PHP (Laravel when `laravel/framework` is there), `pyproject.toml` or `requirements.txt` means Python (Flask, FastAPI or Django as present). Ask when nothing fits.
2. Copy the matching reference verifier from `${CLAUDE_PLUGIN_ROOT}/skills/developers/webhooks/references/verifiers.md` (`verify.mjs`, `verify.php` or `verify.py`) into the repository's conventions: a module or class in the place the project keeps such helpers, taking the secrets from the application's own secret store or configuration (the current secret and, during a rotation, the previous one), never from a literal in the source. Keep the behaviour: raw body, constant-time comparison, a 300-second tolerance, a list of secrets.
3. Add the route or middleware that receives `POST` deliveries on a path the user agrees to, in this order: verify, answer 400 on a bad signature, deduplicate on `SB-Event-Id` with the store the project already has (say so when it has none and use an in-memory set with a comment-free note in the reply), hand the parsed event to the project's queue or handler, answer 200 at once. Branch on `data.synthetic` for test deliveries.
4. Add a test in the project's test runner that generates a fixture with the `make-fixture.mjs` from the same reference, copied beside the test (or embeds one generated once; the fixture carries the `now` the verifier must be given, so it never goes stale), and asserts the four cases: valid passes, stale fails, tampered fails, rotated passes only with both secrets.
5. Run the test and show the result. Then tell the user the three steps left to them: register the endpoint (`create_webhook_endpoint` or the dashboard) with the events the job needs, store the secret the response shows once in the environment, and fire `test_webhook_endpoint` to see a synthetic delivery land.

Never print a real secret, never commit one, and never claim the receiver is verified until the test ran green in this session.
