---
type: llm
---

PASS if the reply answers no, because a connector never alters a core table, and tells the user to keep the board id in a table of the connector's own, prefixed agora_, that points at the core row (by resource, installation or project id) while the core's storage_ref points back, and mentions the conformance kit's migration rule that scans migrations for a table the connector does not own. Mentioning that a raw SQL statement is forbidden too, or that the scan does not catch one, is correct and must not count against the reply.
FAIL if the reply says the column is allowed, or recommends a raw SQL statement as the way to add it, or gives no connector-owned table as the alternative.
