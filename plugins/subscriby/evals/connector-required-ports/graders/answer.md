---
type: llm
---

PASS if the reply lists the seven required ports (InstallationLifecycle, IdentityResolver, InboundGateway, FailureClassifier, TextRenderer, SettingsSchema and UiSlots), notes that SettingsSchema is usually bound from the manifest's fields and that UiSlots may return nothing, and that Messenger is bound by the messaging capability rather than required.
FAIL if it misses one of the seven, or lists Messenger as always required.
