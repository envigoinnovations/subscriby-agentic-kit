---
type: llm
---

PASS if the reply lists only read abilities (view-any, view and read abilities such as project:view-any, project:view, project-subscription:view-any, project-user:view-any, dashboard:read, activity:read), advises against write abilities or granting everything, and mentions the team scope (and optionally restricting to chosen projects).
FAIL if it includes a create, update or delete ability, or tells the user to tick every ability.
