---
type: llm
---

PASS if the reply names subscription.activated (and may add member.joined or subscription.created) for a new paying member, and at least one of subscription.cancelled, subscription.expired or member.churned for leaving, and adds a handling rule such as deduplicating on the event id, not relying on delivery order, or fetching the object by id because payloads carry ids rather than whole objects.
FAIL if it invents event names, or only says to subscribe to every event.
