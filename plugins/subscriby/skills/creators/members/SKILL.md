---
name: members
description: "This skill should be used when the user asks about a project's members or subscribers, who lapsed or churned, a member's connected accounts, members waiting on a connection, banning, unbanning or kicking someone, the perks still to hand over, or a member's access grants and invite links."
license: MIT
metadata:
  category: creators
  catalogue: 2026-05-01
---

# Members

A member is anyone who touched the project: a person who opened the bot, started a trial, bought a plan, left, or was banned. Every member lives inside exactly one project and carries exactly one status; a member's purchases are subscriptions (the `subscriptions-and-payments` skill), and their access to each place is a grant.

## The five statuses

| Status | Meaning |
| --- | --- |
| `lead` | Interacted with the bot, never subscribed or trialled. Costs nothing and counts against no quota. |
| `trialing` | Inside a trial of a plan. |
| `customer` | Has an active paid subscription. |
| `churned` | Was a customer or trialing and no longer has an active subscription. |
| `banned` | Blocked from the project: cannot subscribe or interact. |

The status moves on its own as the person's relationship changes (lead to trialing on a trial, to customer on a payment, to churned when the last subscription ends); nothing sets it by hand except a ban.

## Reading members

- `list_subscribers` pages a project's members (`status`, `access: waiting` for the ones whose purchase includes a place on a platform they have not connected, `search` by name or email, `limit`, `page`). Cap the walk: ask for the first fifty and say more exist.
- `get_subscriber` answers one member: the account, the status, the connected accounts with the platform's own id, who referred them and whom they referred, the Smart Link they came from, when they joined, and every subscription and pass with its state, dates, the code it was redeemed with and the gateway reference.
- `get_pass_roster` (the `plans-and-passes` skill) answers the members against the dates a project's pass plans sell: who holds which date, where each stands on it, and who was moved from where when a date was cancelled; `list_pass_moves` is one purchase's trail of those moves.
- `find_member_by_identity` finds a member from a platform account (`connector` and the platform's `external_id`), the way a support question usually arrives; `list_member_identities` lists one member's accounts and `unlink_member_identity` detaches one (destructive; the member can link again from the portal).
- The activity log (`get_activity_log`, the `analytics` skill) is the timeline behind a dispute: every sign-up, renewal, payment, cancellation and bot interaction.

There is no tool to add a member by hand or to edit a profile: members join through the bot or the portal, and a gift is an access code on a free or access-code-only plan (`coupons-and-access-codes`).

## Waiting on a connection

A member who bought a plan with a place on a platform they have not connected has access the connector cannot give yet: the place waits as a pending grant, the member sees a **Connect** button everywhere they look, and one reminder goes out a day later by itself. `list_subscribers` with `access: waiting` lists them; `remind_member_to_connect` with the `subscription_id` sends the reminder at once (at most once a day). The moment the account is linked, every live purchase waiting on it is granted and `member.resource_added` fires.

## Bans and removals

- `ban_member` (with a `reason`) blocks the person from the project: removed from the places, unable to subscribe or interact; `unban_member` lifts it. Both destructive: confirm, and name the member by what `get_subscriber` answered, never by a guess.
- `kick_member` (with a `reason`) removes the member from the places now without banning them: the status rolls to `churned` and they can subscribe again later; the kick is visible to the room. Their subscription is the `subscriptions-and-payments` skill's business (cancel, or suspend access).
- A ban can also come from inside a place or from the bot's admin command; the activity timeline says which.

## Grants and invites

`list_subscription_grants` lists what one subscription granted, place by place, with whether the invite was used (joined, not joined); `reissue_subscription_grants` hands the member fresh access, to one `resource_id` or to every place, revoking the old links. Reach for it when a member lost their invite, or after a place was replaced; it is destructive because the old links die.

`nudge_pending_readmissions` belongs to a recovery operation's roll call (`operation_id`) and reminds the members a failover is still waiting to re-admit; the `disaster-recovery` skill owns that flow.

## Creator tasks

A manual perk is delivered by hand. `list_creator_tasks` (`status` `open`, `completed`, `all`) lists what is still owed to whom after a purchase, and `complete_creator_task` records that it was delivered, which tells the member. Read the tasks before promising a member anything about a perk.

## Do not

- Do not ban, kick or unlink on a description alone: read the member first and show the user who it is.
- Do not walk every member of a large project to answer a count; use `analytics` (`get_subscriber_analytics`) and the filters.
- Do not paste member data outside the conversation or into another service.

## References

- [references/tools.md](references/tools.md): the fourteen tools with their arguments.
- [references/events.md](references/events.md): the `member.*` and `creator_task.*` events (joined, converted, churned, banned, kicked, resource pending, added, reissued, removed, identity linked and unlinked).
- [references/endpoints.md](references/endpoints.md): the REST twins under `/v1/projects/{project}/members` and the creator tasks.
- Documentation: [Managing members](https://docs.subscriby.net/creators/managing-members), [a member on the platform](https://docs.subscriby.net/subscribers/on-the-platform), [what a member sees](https://docs.subscriby.net/connectors#what-a-member-sees).
