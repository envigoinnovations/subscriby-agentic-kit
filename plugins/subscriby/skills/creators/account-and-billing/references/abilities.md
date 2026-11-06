# Abilities: Account and Billing

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An ability is `entity:action`; a token carries an explicit list and is frozen to one team. `enforced` means an endpoint or a tool checks it today; `pending` means it exists for a surface still to come; `no-api-surface` means it opens something in the dashboard or subscribes to events only; `deprecated` cannot be granted to a new token.

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
