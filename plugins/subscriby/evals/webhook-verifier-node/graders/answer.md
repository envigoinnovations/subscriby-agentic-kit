---
type: llm
---

PASS if the code parses t= and v1= from the SB-Signature header, computes an HMAC-SHA256 over the timestamp, a dot and the raw body with the endpoint secret, compares the result in constant time, and rejects a timestamp more than about 300 seconds from now; the reply should also say to verify before parsing the JSON and to keep the secret in the environment.
FAIL if it hashes a re-serialised JSON object instead of the raw body, compares with === or ==, or has no timestamp check.
