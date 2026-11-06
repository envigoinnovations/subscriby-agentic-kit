---
type: llm
---

PASS if the reply says to retry with the same Idempotency-Key so the server either replays the first response or performs the write once, mentions the 24-hour replay window or the Idempotent-Replay header, and warns that a retry with a new key could create a second plan.
FAIL if it says to simply retry without mentioning the key, or says retrying is unsafe.
