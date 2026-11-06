---
description: Diagnose a project's connectors, places and recovery readiness, read-only, and report every gap with the tool or dashboard step that fixes it.
argument-hint: "[project name or id]"
disable-model-invocation: true
---

Diagnose the project `$ARGUMENTS` (or ask which one, listing `list_projects` when the argument is empty or matches more than one project). Everything here is a read or a diagnosis; change nothing.

1. `get_project` for the project's state (active, handle, counts of plans, resources, subscribers, payment methods).
2. `list_connector_installations`; for each installation, `get_connector_installation` and `run_connector_doctor`, which runs the connector's own diagnosis of the installation and its places.
3. `list_resources` for every place and perk with its state.
4. `get_recovery_readiness` for the readiness checklist (standby, failover, mirrors).
5. `list_plans` to see which plans grant a place that is detached, inactive or on a degraded installation.

Report as one card: each installation with its state and the doctor's findings; each place that is detached, inactive or unhealthy, with the plans that grant it; the readiness items that are missing; and for every gap, the fix: a tool from the kit (`verify_connector_installation`, `activate_resource`, `reissue_subscription_grants`, `restore_connector_access`) or the dashboard step (reconnect, add the bot as administrator, fix the role order, link a place). Order the gaps by what blocks sales first. If everything is healthy, say so in one line.
