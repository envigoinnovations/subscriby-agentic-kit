---
name: connector-data-rules
description: This skill should be used when the user is writing a migration or a model for a Subscriby connector, asks which tables a connector may create or alter, how its rows relate to the core's rows, what storage_ref is, or what disconnect, uninstall, reinstall and purge do to data.
license: MIT
metadata:
  category: connector-sdk
  catalogue: 2026-05-01
---

# Data rules for a connector

The core owns the rows that describe a membership: installations, identities, spaces, grants, members, subscriptions and payments. A connector owns only what the platform makes it keep (a bot row with its token, a cached chat title, a webhook id) and keeps it in tables of its own. The rules make it possible to remove a connector from the codebase without breaking the core, and to uninstall one from a project without cascading into anything a member paid for.

## The five rules

1. **Prefix every table with the connector key.** A connector keyed `example` creates `example_bots`, never `bots`. The kit reads the migration sources and fails a `Schema::create` without the prefix before anything runs.
2. **Never alter a core table.** No `Schema::table`, `drop`, `dropIfExists` or `rename` on a table the connector does not own. Anything to record about a project, a member or a grant goes through the Core API into the core's tables.
3. **Foreign keys point inward only.** A connector table may hold `project_id`, `installation_id` or `identity_id` with `cascadeOnDelete`, so a project's deletion tidies the connector's rows. The core never holds a foreign key into a connector table: its rows carry a soft `storage_ref` string naming the connector's row, and the connector resolves it.
4. **Additive after first publish.** Once a version is installed anywhere, later migrations add. A change of shape is expand → verify → contract: add the new column or table, move the data and prove it moved, and drop the old shape in a later release, never the same one.
5. **Tenant filtering is explicit.** The core's tenant scope is inert for connector ingress, so a connector repository filters by project or installation itself (`forProject()`, `forInstallation()`) rather than trusting a global scope.

```php
Schema::create('agora_forums', function (Blueprint $table): void {
    $table->uuid('id')->primary();
    $table->uuid('installation_id')->nullable()->index();
    $table->string('forum_url');
    $table->string('bot_user_id');
    $table->string('webhook_id')->nullable();
    $table->timestamps();
});
```

The tutorial's one table: prefixed, pointing into the core through `installation_id`, holding no secret (the webhook signing secret went to the core with the credentials), while the core's installation row points back through `storage_ref`.

## What the core keeps for you

| Core table | Holds | Reached through |
| --- | --- | --- |
| `connector_installations` | One row per installation: project or platform scope, live or standby role, state, encrypted credentials, health, `storage_ref` | `Core\Installations` |
| `connector_identities` | One row per account the connector has seen, with the installation that saw it and `storage_ref` | `Core\Identities` |
| `connector_spaces` | One row per gated place, with kind, parent and health | `Core\Spaces` |
| `access_grants` | One row per subscription, resource and window: mode, state, the connector's reference, failure kind | `Core\Grants` |
| `connector_inbound_events` | The idempotency keys of inbound events, pruned after seven days | The core, before your port |

Credentials are encrypted at rest in `connector_installations.credentials` and handed to the ports as a `CredentialBag`; copy a token into your own table only when the platform's client library forces it, and never log one.

## Disconnect, uninstall, reinstall, purge

- **Disconnect** wipes the installation's credentials and stops it acting; your tables are untouched.
- **Uninstall** revokes the connector's grants, detaches its resources (external ids kept) and keeps the installation row, the identities and your tables. Nothing is deleted, so a **reinstall** re-links detached places and can restore access.
- **Purge** is run by Subscriby's operators for a retention rule or an erasure request, only after an uninstall, for one project on that connector: it deletes the core's grants (their creator tasks with them), the spaces the project's resources point at, the member identity links and the uninstalled installation rows; your rows go with the installation rows through the `installation_id` cascades rule 3 asks for. Identities, members, subscriptions, payments, support threads and the resource rows stay as the audit trail; a member's own erasure goes through the identity unlink path. Operators rehearse it first (the same per-table counts, nothing deleted). It deletes data, never schema.

## How the kit checks

`MigrationRules::violations($key, $migrationsPath)` reads every `*.php` file under `database/migrations` as text and matches `Schema::create('<table>'` and `Schema::table|drop|dropIfExists|rename(…)`, single or double quotes, whitespace tolerated; every table without the prefix is reported as `file: what`. It runs inside the conformance suite as `migrations.own_tables_only` when a package path is passed, and alone with no application:

```php
expect(MigrationRules::violations('example', __DIR__.'/../database/migrations'))->toBe([]);
```

A missing migrations directory passes. It does not catch a raw `DB::statement('ALTER TABLE …')` (review reads for it; hold the package to the same standard), it does not check a foreign key's direction (a connector table pointing into the core is the intended shape), and it says nothing about the columns inside your own tables.

## Do not

- Do not create a table without the prefix, or touch a core table from a migration or a raw statement.
- Do not point a core row at yours with a real foreign key; `storage_ref` is the only link outward.
- Do not keep a member, a grant or a subscription of your own.
- Do not change a shape in one release after first publish.
- Do not trust a global tenant scope on connector ingress.

## References

- Documentation: [data rules](https://docs.subscriby.net/sdk/v1/building/data), [migration rules](https://docs.subscriby.net/sdk/v1/conformance/migration-rules), [the Core API](https://docs.subscriby.net/sdk/v1/core-api).
- Related skills: `connector-ports` for the Core API contracts, `connector-testing` for running the rule, `connector-publishing` for additive updates.
