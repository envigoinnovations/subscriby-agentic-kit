---
name: connector-sdk
description: This skill should be used when the user wants to build a Subscriby connector for a platform, asks what a connector is, how to start a package on subscriby/connector-sdk, which ports every connector binds, or how the package, the provider and the Connector class fit together.
license: MIT
metadata:
  category: connector-sdk
  catalogue: 2026-05-01
---

# Building a connector on the SDK

Subscriby runs paid memberships on messaging and community platforms, and the core knows nothing about any particular platform: it keeps projects, plans, members, subscriptions, payments and grants, and asks a **connector** for everything that touches a platform. A connector is a Composer package on `subscriby/connector-sdk` with two things in it: a `connector.json` that says what the connector is and can do, and PHP classes that implement the SDK's **ports**, the interfaces the core calls. The SDK's service provider wires the package in, the core renders the install form from the manifest, and the marketplace builds the connector's page from the same file. A connector is reviewed and installed by Subscriby, never uploaded at runtime; a third-party package carries the **Community** badge.

This skill is the map. The sibling skills carry the detail: `connector-manifest` (every block of the file), `connector-ports` (every port and the Core API), `connector-data-rules` (tables), `connector-testing` (the fakes and the conformance kit), `connector-publishing` (versions, translations, review, lanes).

## What the core does, and what crosses the boundary

- Installations, identities, spaces and grants live in the core's tables; a connector records and reads them through the Core API (`Subscriby\Connector\Core\*`) and never stores who a member is or what a subscription grants.
- Money is the core's: checkout, settlement, refunds, dunning and entitlement. A connector that offers the platform's own payment method implements one contract and lets the core account for it.
- Messages are written once by the core, in a canonical HTML subset with a closed set of actions; the connector renders them within the limits its manifest declares.
- Health and recovery are one model: the core probes installations and places and runs the Disaster Recovery Program; the connector answers probes and performs the platform-side steps it declares.
- Every surface is fed at once: the dashboard, the REST API, the MCP server, webhooks, Zapier and n8n read the same manifest and rows, so a connector appears everywhere by existing.

The only thing that crosses between the core and a connector is the SDK. A connector imports `Subscriby\Connector\*` and nothing under the application's namespace (the suite fails a package that does); the core never imports a connector's namespace and reaches it through the registry, the ports and typed UI slots; data crosses as SDK value objects (`InstallationRef`, `IdentityRef`, `SpaceRef`, `GrantRequest`, `Message`), never as Eloquent models.

## The package

```text
my-connector/
├── connector.json            the manifest
├── composer.json             requires subscriby/connector-sdk, declares the provider
├── config/                   optional: connector-<key>.php and client config
├── database/migrations/      optional: the connector's own tables, prefixed <key>_
├── lang/                     optional: <locale>.json translations
├── resources/views/          optional: slot views, published as connector-<key>::
├── routes/inbound.php        optional: the platform's webhook routes
├── routes/web.php            optional: browser routes (a sign-in callback, a probe)
├── src/
│   ├── <Name>ConnectorServiceProvider.php
│   ├── <Name>Connector.php
│   └── Ports/…               one class per port
└── tests/
```

`composer.json` requires `php ^8.5`, `illuminate/contracts` and `illuminate/support` (and `illuminate/http` for a client) at `^13.0`, and `subscriby/connector-sdk ^1.0`; a PSR-4 autoload for `src/`; and `extra.laravel.providers` naming the provider, which is how the application discovers the package. The provider must sit at `src/<Provider>.php`: the SDK finds the package root as its grandparent and loads everything else from there. The manifest's own `sdk` constraint is checked at boot too, and the registry refuses a package built against an SDK the application does not run. The SDK is published from `github.com/envigoinnovations/subscriby-connector-sdk`, a read-only mirror of Subscriby's monorepo with a changelog per version.

## The provider and the Connector class

The provider extends `Subscriby\Connector\ConnectorServiceProvider` and returns the connector from `connector()`; the base class does the rest at boot. It reads and validates `connector.json` (every problem at once, each with its dotted path), registers the connector under that manifest, and loads `database/migrations`, `resources/views` as `connector-<key>::`, `lang/*.json`, `routes/inbound.php` behind the core's `connector.inbound` middleware (which authenticates each call through the `InboundGateway`, drops a replayed event and refuses a paused connector), `routes/web.php` behind `web`, the console commands from `packageCommands()`, the listeners from `packageListeners()` on the SDK's events, the seeders from `packageSeeders()` (run after the core's currencies and countries and before its demo projects) and every `config/*.php` under its file name.

```php
final class ExampleConnectorServiceProvider extends ConnectorServiceProvider
{
    protected function connector(): Connector
    {
        return $this->app->make(ExampleConnector::class);
    }
}

final class ExampleConnector implements Connector
{
    public function register(ConnectorRegistrar $registrar): void
    {
        $registrar->port(InstallationLifecycle::class, $this->lifecycle);
        $registrar->port(IdentityResolver::class, $this->identities);
        $registrar->port(InboundGateway::class, $this->gateway);
        $registrar->port(FailureClassifier::class, $this->failures);
        $registrar->port(TextRenderer::class, $this->renderer);
        $registrar->port(UiSlots::class, $this->slots);
        $registrar->port(Messenger::class, $this->messenger);
        $registrar->port(AccessController::class, $this->access);
    }
}
```

What the connector *is* never lives in the class: the manifest describes it, the class binds ports, and the registry refuses a package whose bindings disagree with its file (a capability without its port, a port without its capability, `native_payments` on a package Subscriby has not configured as official).

## The ports

Seven ports are bound by every connector, whatever the platform: `InstallationLifecycle` (connect, verify, describe, disconnect), `IdentityResolver` (who an event is from, what the platform knows about an account), `InboundGateway` (authenticate and decode what the platform sends), `FailureClassifier` (why the platform refused, in the core's kinds), `TextRenderer` (the canonical HTML into the platform's formatting), `SettingsSchema` (the forms as data, bound for you from the manifest's fields unless they depend on the installation) and `UiSlots` (bound even to return nothing). Every other port is bound when the manifest declares the matching capability: `Messenger`, `AccessController`, `SupportRelay`, `PortalLoginMethod`, `RegistersCreators`, `ManagementSurface`, `CopilotSurface`, `ProvidesPaymentMethods` (official only), `RecoverySupport`, `SpaceBrowser`, `Announcer`, `InstallationActions`; `SpaceCatalog` needs no capability and is bound by almost every connector with access control. The `connector-ports` skill has each port's contract.

Rules every port shares: refs in, results out (never a model, never a request); credentials arrive per call in a `CredentialBag` and are never stored or logged; a platform refusal is a classified `DeliveryFailure`, never an exception; every operation is idempotent because the core retries; a facet the manifest denies throws `UnsupportedByConnector`; nothing from the application's namespace.

## The core's rows and your own

A connector never queries the application's database. It records and reads installations, identities, spaces, grants and support messages through the Core API contracts the core binds in its container; everything they take and return is an SDK value object. What the platform makes the connector keep (a bot row, a webhook id, a cached title) goes into its own tables, prefixed with the key and pointing inward with `installation_id` or `project_id`, while the core's row carries a `storage_ref` string back to it. The `connector-data-rules` skill has the five rules and what uninstall and purge do.

## The fake connector

The SDK ships a complete connector to copy from, `Subscriby\Connector\Testing\FakeConnector`, with its own `connector.json` beside it. It deliberately violates every assumption a Telegram-shaped core would make: 280-character messages, no files, membership grants instead of invite links, a `creator_task` kind the creator fulfils by hand, no early admission, three admin commands, a one-message-a-second pace, identities that look nothing like chat ids. Read its manifest as the smallest that passes the kit, and the Telegram connector's as the one that declares everything.

## The path

1. Write `connector.json` and validate it against the published schema (`connector-manifest`).
2. Implement the seven required ports, then the ports the capabilities need (`connector-ports`).
3. Keep every migration inside the data rules (`connector-data-rules`).
4. Run the conformance kit until it is green and test the ports against a fake of the platform's client (`connector-testing`).
5. Fill the listing, translate, pass the review checklist and submit (`connector-publishing`).

The documentation's tutorial builds a connector for an imaginary forum with private boards, from an empty directory to a package that passes the kit, in ten chapters: the package, the manifest, installation, inbound webhooks, messages, boards as resources, portal sign-in, slots and translations, tests, shipping. Read it beside the reference when a decision needs a worked example.

## Do not

- Do not import anything from the application's namespace; the SDK is the only thing that crosses.
- Do not store members, grants or subscriptions of your own; record them through the Core API.
- Do not build or edit the manifest in PHP; the file is the source, and the kit compares the two.
- Do not compose messages or truncate the core's copy; declare the platform's real limits and render.
- Do not hard-code pacing or a sleep; the `pacing` block is data the core reads.
- Do not keep a credential outside the `CredentialBag`, log one, or put one in an exception message or a view.
- Do not rename the key after first publish; it names tables, config, views, routes and limiters for the life of the connector.

## References

- Documentation: [Connectors for developers](https://docs.subscriby.net/sdk/v1), [getting started](https://docs.subscriby.net/sdk/v1/building), [the tutorial](https://docs.subscriby.net/sdk/v1/tutorial), [the marketplace](https://docs.subscriby.net/connectors/marketplace).
- The SDK: [github.com/envigoinnovations/subscriby-connector-sdk](https://github.com/envigoinnovations/subscriby-connector-sdk) and its changelog.
- Related skills: `connector-manifest`, `connector-ports`, `connector-data-rules`, `connector-testing`, `connector-publishing`; `connectors` for what creators see.
