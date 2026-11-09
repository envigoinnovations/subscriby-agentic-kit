# REST endpoints: REST API, the `payment-methods` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `payment-methods`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/payment-methods` | `project-payment-method:view-any` | List a project's payment methods | `list_payment_methods` |
| DELETE | `/v1/projects/{project}/payment-methods/{method}` | `project-payment-method:delete` | Delete a payment method | `delete_payment_method` |
| GET | `/v1/projects/{project}/payment-methods/{method}` | `project-payment-method:view` | Get a payment method | `get_payment_method` |
| POST | `/v1/projects/{project}/payment-methods/{method}/activate` | `project-payment-method:update` | Activate a payment method | `activate_payment_method` |
| POST | `/v1/projects/{project}/payment-methods/{method}/deactivate` | `project-payment-method:update` | Deactivate a payment method | `deactivate_payment_method` |
| POST | `/v1/projects/{project}/payment-methods/{method}/sync` | `project-payment-method:update` | Sync a payment method's plans | `sync_payment_method_plans` |

### GET `/v1/projects/{project}/payment-methods`

```bash
curl https://api.subscriby.net/v1/projects/$PROJECT_ID/payment-methods \
  -H "Authorization: Bearer <token>"
```

Every payment method attached to the project, newest first.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### DELETE `/v1/projects/{project}/payment-methods/{method}`

```bash
curl -X DELETE https://api.subscriby.net/v1/projects/$PROJECT_ID/payment-methods/$METHOD_ID \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

Returns `204 No Content`. The row is soft-deleted: subscriptions sold through it keep their gateway for refunds and history, and configuring the same provider and mode again later revives the row instead of creating a duplicate. Buyers lose that way to pay at once. Emits `project.payment_method.deleted` with a credential-free snapshot; an already-deleted id is a `404`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `method` (path, string, required): The method, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/payment-methods/{method}`

The method without its credentials. A method is resolved within the project: a method id that does not belong to the project, or a project outside the caller's tenant, is `404 RESOURCE_NOT_FOUND`, so foreign rows never leak.

- `provider` is the stored provider key: a gateway slug (`stripe`, `paypal`, `razorpay`, `paystack`, `ceypay`, `skrill`, `coinpayments`, `accesscode`) or a `connector:provider` key for a currency a connector brings (`telegram:stars` for Telegram Stars). A project carries one method per provider key and mode, so two connectors can each bring their own currency to the same project. Rows created before provider keys existed carried `platformcurrency`; the connector's data migration rewrites them, and until it has run that word still reads as the native method of the project's connector.
- `connector` is the connector behind a native payment method (`telegram` for a `telegram:stars` row), `null` for every gateway and for access codes. A connector declares its native providers through its manifest's `native_payments` capability, and the dashboard offers one option per provider of every connector that is connected on the project.
- `mode` is `test` or `live`. Drives which set of provider credentials is used.
- `linked` is true once the provider handshake (OAuth callback, API-key verify, etc.) has completed successfully.
- `active` is the creator's toggle. A linked-but-inactive method cannot be used to charge subscribers.

> **Credentials never leave.** Provider credentials (API keys, webhook secrets, connected account ids, Stripe Connect onboarding state) live in the encrypted configuration and are **never** serialised through REST or MCP, even for tokens with `view` ability. The dashboard is the only surface that reveals them, and only to the creator.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `method` (path, string, required): The method, resolved within the project by the route binder.


### POST `/v1/projects/{project}/payment-methods/{method}/activate`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/payment-methods/$METHOD_ID/activate \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

Offers the method at checkout again and re-queues the plan sync for that gateway. Answers `200` with the method. Idempotent: switching a method to the state it is already in writes nothing and emits nothing; when the switch flips, `project.payment_method.updated` fires once with `changes.active`.

> **Stripe needs its Connect handshake first.** A Stripe method whose Connect onboarding never finished is refused: the row exists only so the creator can resume onboarding, and switching it on would offer buyers a gateway that fails at checkout. Finish onboarding from the dashboard, the only place the Connect handshake can complete.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `method` (path, string, required): The method, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/payment-methods/{method}/deactivate`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/payment-methods/$METHOD_ID/deactivate \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

The creator's switch. A deactivated method is no longer offered at checkout; the subscriptions already sold through it keep renewing with their gateway. Re-queues the plan sync like activating does. Answers `200` with the method; idempotent, and `project.payment_method.updated` fires once with `changes.active` when the switch flips.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `method` (path, string, required): The method, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/payment-methods/{method}/sync`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/payment-methods/$METHOD_ID/sync \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

Queues a push of the project owner's plans into the gateway's catalogue (Stripe products and prices, PayPal, Razorpay or CoinPayments plans) and answers `202 Accepted`. The work runs in the background; each plan reports through `plan.sync_completed` as it lands. Queuing twice pushes the same catalogue twice, which is harmless.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `method` (path, string, required): The method, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

