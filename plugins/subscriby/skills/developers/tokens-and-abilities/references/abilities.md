# Abilities: Tokens and Abilities

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An ability is `entity:action`; a token carries an explicit list and is frozen to one team. `enforced` means an endpoint or a tool checks it today; `pending` means it exists for a surface still to come; `no-api-surface` means it opens something in the dashboard or subscribes to events only; `deprecated` cannot be granted to a new token.

## `projects`

| Ability | Status | Note |
| --- | --- | --- |
| `project:view-any` | enforced |  |
| `project:view` | enforced |  |
| `project:create` | enforced |  |
| `project:update` | enforced |  |
| `project:delete` | enforced |  |

## `project-resources`

| Ability | Status | Note |
| --- | --- | --- |
| `project-payment-method:view-any` | enforced |  |
| `project-payment-method:view` | enforced |  |
| `project-payment-method:create` | pending |  |
| `project-payment-method:update` | enforced |  |
| `project-payment-method:delete` | enforced |  |
| `project-resource:view-any` | enforced |  |
| `project-resource:view` | enforced |  |
| `project-resource:create` | enforced |  |
| `project-resource:update` | enforced |  |
| `project-resource:delete` | enforced |  |
| `project-access-code:view-any` | enforced |  |
| `project-access-code:view` | pending |  |
| `project-access-code:create` | enforced |  |
| `project-access-code:update` | pending |  |
| `project-access-code:delete` | enforced |  |
| `project-coupon:view-any` | enforced |  |
| `project-coupon:view` | enforced |  |
| `project-coupon:create` | enforced |  |
| `project-coupon:update` | enforced |  |
| `project-coupon:delete` | enforced |  |
| `project-subscription:view-any` | enforced |  |
| `project-subscription:view` | enforced |  |
| `project-subscription:create` | pending |  |
| `project-subscription:update` | enforced |  |
| `project-subscription:delete` | pending |  |
| `project-subscription-plan:view-any` | enforced |  |
| `project-subscription-plan:view` | enforced |  |
| `project-subscription-plan:create` | enforced |  |
| `project-subscription-plan:update` | enforced |  |
| `project-subscription-plan:delete` | enforced |  |
| `project-user:view-any` | enforced |  |
| `project-user:view` | enforced |  |
| `project-user:create` | pending |  |
| `project-user:update` | enforced |  |
| `project-user:delete` | pending |  |
| `project-recovery:view-any` | enforced |  |
| `project-recovery:view` | enforced |  |
| `project-recovery:create` | enforced |  |
| `project-recovery:update` | enforced |  |
| `project-recovery:delete` | enforced |  |
| `project-connector:view-any` | enforced |  |
| `project-connector:view` | enforced |  |
| `project-connector:create` | enforced |  |
| `project-connector:update` | enforced |  |
| `project-connector:delete` | enforced |  |
| `project-referral:view-any` | enforced |  |
| `project-referral:view` | enforced |  |
| `project-referral:create` | enforced |  |
| `project-referral:update` | enforced |  |
| `project-referral:delete` | enforced |  |
| `project-link:view-any` | enforced |  |
| `project-link:view` | enforced |  |
| `project-link:create` | enforced |  |
| `project-link:update` | enforced |  |
| `project-link:delete` | enforced |  |
| `project-sequence:view-any` | enforced |  |
| `project-sequence:view` | enforced |  |
| `project-sequence:create` | enforced |  |
| `project-sequence:update` | enforced |  |
| `project-sequence:delete` | enforced |  |
| `project-knowledge:view-any` | enforced |  |
| `project-knowledge:view` | enforced |  |
| `project-knowledge:create` | enforced |  |
| `project-knowledge:update` | enforced |  |
| `project-knowledge:delete` | enforced |  |

## `support`

| Ability | Status | Note |
| --- | --- | --- |
| `support-conversation:view-any` | enforced |  |
| `support-conversation:view` | enforced |  |
| `support-conversation:create` | pending |  |
| `support-conversation:update` | enforced |  |
| `support-conversation:delete` | pending |  |
| `support-canned-reply:view-any` | enforced |  |
| `support-canned-reply:create` | enforced |  |
| `support-canned-reply:update` | enforced |  |
| `support-canned-reply:delete` | enforced |  |

## `teams`

| Ability | Status | Note |
| --- | --- | --- |
| `team:view-any` | enforced |  |
| `team:view` | enforced |  |
| `team:create` | enforced |  |
| `team:update` | enforced |  |
| `team:delete` | enforced |  |
| `team-member:view-any` | enforced |  |
| `team-member:view` | enforced |  |
| `team-member:invite` | enforced |  |
| `team-member:remove` | enforced |  |
| `team-member:update-role` | enforced |  |

## `rbac`

| Ability | Status | Note |
| --- | --- | --- |
| `role:view-any` | enforced |  |
| `role:view` | enforced |  |
| `role:create` | enforced |  |
| `role:update` | enforced |  |
| `role:delete` | enforced |  |
| `group:view-any` | enforced |  |
| `group:view` | enforced |  |
| `group:create` | enforced |  |
| `group:update` | enforced |  |
| `group:delete` | enforced |  |

## `copilot`

| Ability | Status | Note |
| --- | --- | --- |
| `copilot:use` | no-api-surface | The team permission that opens Subscriby Copilot in the dashboard and the platform bot. The Copilot runs in-app and has no REST or MCP surface of its own; the MCP server is the door for outside agents. |

## `account`

| Ability | Status | Note |
| --- | --- | --- |
| `account:read` | enforced |  |
| `account:write` | enforced |  |
| `account:export` | enforced |  |

## `billing`

| Ability | Status | Note |
| --- | --- | --- |
| `billing:read` | no-api-surface | Subscribes an endpoint to the billing.* webhook events. The creator's own Subscriby billing has no REST surface to read. |
| `billing:manage` | no-api-surface | The creator's own Subscriby billing is deliberately dashboard-only. |

## `tokens`

| Ability | Status | Note |
| --- | --- | --- |
| `token:view-any` | enforced |  |
| `token:view` | enforced |  |
| `token:create` | enforced |  |
| `token:delete` | enforced |  |

## `payments`

| Ability | Status | Note |
| --- | --- | --- |
| `payment:view-any` | pending |  |
| `payment:view` | pending |  |
| `payment:refund` | pending |  |

## `passes`

| Ability | Status | Note |
| --- | --- | --- |
| `pass-window:view-any` | enforced |  |
| `pass-window:view` | enforced |  |
| `pass-window:create` | enforced |  |
| `pass-window:update` | enforced |  |
| `pass-window:delete` | enforced |  |

## `webhooks`

| Ability | Status | Note |
| --- | --- | --- |
| `webhook-endpoint:view-any` | enforced |  |
| `webhook-endpoint:view` | enforced |  |
| `webhook-endpoint:create` | enforced |  |
| `webhook-endpoint:update` | enforced |  |
| `webhook-endpoint:delete` | enforced |  |
| `webhook-endpoint:manage` | deprecated | Split into the five webhook-endpoint verbs plus the two webhook-delivery abilities. Still grants all seven on tokens that carry it; cannot be granted to a new one. |
| `webhook-delivery:view-any` | enforced |  |
| `webhook-delivery:retry` | enforced |  |

## `bot`

| Ability | Status | Note |
| --- | --- | --- |
| `broadcast:read` | enforced |  |
| `broadcast:send` | enforced |  |

## `analytics`

| Ability | Status | Note |
| --- | --- | --- |
| `dashboard:read` | enforced |  |

## `distribution`

| Ability | Status | Note |
| --- | --- | --- |
| `distribution:read` | enforced |  |

## `activity`

| Ability | Status | Note |
| --- | --- | --- |
| `activity:read` | enforced |  |
