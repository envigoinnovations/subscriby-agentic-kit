# Abilities: Webhooks

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An ability is `entity:action`; a token carries an explicit list and is frozen to one team. `enforced` means an endpoint or a tool checks it today; `pending` means it exists for a surface still to come; `no-api-surface` means it opens something in the dashboard or subscribes to events only; `deprecated` cannot be granted to a new token.

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
