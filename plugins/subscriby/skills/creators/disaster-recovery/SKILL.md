---
name: disaster-recovery
description: This skill should be used when the user asks about a banned bot, place or account, an outage or degraded installation, recovery incidents and operations, standbys, the live mirror, automatic failover, readiness, the roll call, undo, allowances or outage compensation.
license: MIT
metadata:
  category: creators
  catalogue: 2026-05-01
---

# The Disaster Recovery Program

A platform can take three things away: the account the creator signs in with, the bot that serves a project (the connection), and a place a plan grants. The program watches all three around the clock, opens an incident the moment one stops answering its platform, alerts the creator, and moves them to a replacement with every paying member re-admitted automatically; plans, subscriptions and payments are never touched, nothing is deleted, and a swap can be undone for 24 hours. Detection and every recovery are on every plan, Free included; the safeguards that make a recovery one click or none (a backup account, a standby bot, standby places with a live mirror, automatic failover) are the Growth Plan's.

Fair use, in one sentence: the program is for creators banned or restricted through no fault of their own; each kind of recovery is self-service once per rolling 90 days (several place swaps within 24 hours count once; an undo and an on-demand Swap & Grant of a healthy place count nothing), anything beyond goes through support, who audit the account first, and there is zero tolerance for using it as a way around a platform's rules.

## Reading the state

- `get_recovery_readiness` (account-wide): the checklist tiles, two about the account (two-factor or a passkey; a backup sign-in account) and, per connector, a standby bot for every project, a standby for every place, automatic failover on, a live mirror of every broadcast place; with two reminders no tile can verify (a copy of the content outside the platform; a second human administrator in every place).
- `get_recovery_allowances` (account-wide): where each kind's 90-day allowance stands.
- `list_recovery_incidents` (`status` `open`, `resolved`, `all`), `get_recovery_incident`: what is broken, the project, the place or bot, the platform's reason, when it was detected.
- `list_recovery_operations` (`kind` `account`, `bot`, `resources`; `status` `started`, `completed`, `failed`, `reverted`), `get_recovery_operation`: every recovery ever run, by whom (the creator, automatic, on demand, a support grant), what changed, whether it is still revertible and until when.
- `get_recovery_roll_call` (`operation_id`): re-admitted of total, joined, could not be messaged, told by email.
- `get_recovery_settings` and `update_recovery_settings` per project: `auto_failover`, `accepts_email_fee` (the $0.01 per email consent for members the bot cannot reach during a failover) and `email_delivery` (`platform`: Subscriby emails unreachable members their new access at $0.01 each; `self`: nobody is emailed and the creator downloads the member list).
- An installation's outage (`sales_paused`, the outage block) is read with `get_connector_installation` in the `connectors` skill; `update_project` carries `outage_compensations`.

## Acting

Every write here moves real members or spends an allowance: confirm each with the incident or the resource in front of the user.

- **A lost place**: `request_resource_replacement` asks the connector to have the creator pick the new place on the platform (a place of the same kind, created first; the bot takes the rights through the pick, or the creator makes it an administrator and confirms the offer); `withdraw_resource_replacement_request` cancels a waiting request. On Growth with a healthy standby, `use_resource_standby` swaps it in with no round trip. The swap re-points the resource, re-admits everyone with active access through the queue, leaves the old place as it is, and fires `project.resource.updated`.
- **The roll call**: `notify_members_of_recovery` re-sends the "has moved" message to everyone who has not joined yet, once an hour at most; nothing is minted or emailed again.
- **Undo**: `revert_recovery_operation` (optionally one `resource_id`) within 24 hours puts a place swap or an automatic failover back; a bot replacement has no undo, and an account relink is undone from the signed link in the security email alone. An undo spends no allowance.
- **Standbys (Growth)**: `get_resource_standby`, `request_resource_standby` (the creator picks it on the platform; it is probed beside the resource), `withdraw_resource_standby_request`, `remove_resource_standby`, `set_resource_standby_mirror` (`mirror` true copies every post of a channel into its standby from then on; nothing is backfilled, so switch it on early; groups are not mirrored), `remove_standby_installation` (the project's standby bot).
- **After a connector was installed again**: `restore_connector_access` brings back every place the uninstall detached that the connector still controls, and every member with a live purchase gets fresh access to exactly those places.
- Connecting new credentials for a banned bot, switching to a standby bot or a backup account, and relinking an account are dashboard and bot steps, because a credential or a handshake is involved; say which page.

## Outages and compensation

A connector outage is the platform refusing the project's live installation (a revoked or regenerated token, a deleted bot; never a rate limit, a passing error or a Disconnect). While it runs, every plan unlocking a place on that connector is off sale everywhere, existing members keep what they have, and `connector.outage_opened` fires once. It ends when the probe finds the installation healthy, the creator reconnects, a standby takes over or the connector is uninstalled (`connector.outage_closed`). With Outage Compensation on, an outage of an hour or more that ended by recovery or replacement banks its length on every affected purchase: a one-time purchase ends later at once, a recurring one receives the time at the end of the membership; passes and perk-only plans are left alone; `member.access_extended` and `connector.outage_compensated` announce it.

## Automatic failover

Runs with nobody signed in when the project owner is on Growth, the switch is on, a healthy standby exists, the reason is a real loss (chat not found, bot removed; never a missing right) and the allowance has a use left: a banned place is swapped for its standby, a refused bot is replaced by the standby bot (members emailed their new link at the fee accepted), the incident resolves and the creator is told. When it cannot run, the creator is told why and the incident stays open.

## Do not

- Do not swap, revert or notify without the incident or the resource named and confirmed.
- Do not spend an allowance on a healthy place; a planned move is Swap & Grant on the dashboard.
- Do not describe the program as a way around a ban; the fair-use rule is part of every answer about it.

## References

- [references/tools.md](references/tools.md): the twenty-one tools with their arguments.
- [references/events.md](references/events.md): the thirteen `recovery.*` events.
- [references/endpoints.md](references/endpoints.md): the REST twins under `/v1/recovery`.
- Documentation: [Disaster Recovery](https://docs.subscriby.net/disaster-recovery), [how detection works](https://docs.subscriby.net/disaster-recovery/how-detection-works), [replacing a lost place](https://docs.subscriby.net/disaster-recovery/replacing-places), [active prevention](https://docs.subscriby.net/disaster-recovery/active-disaster-prevention), [history and undo](https://docs.subscriby.net/disaster-recovery/history-and-undo), [connector outages](https://docs.subscriby.net/disaster-recovery/connector-outages), [allowances](https://docs.subscriby.net/disaster-recovery/allowances-and-support-review).
