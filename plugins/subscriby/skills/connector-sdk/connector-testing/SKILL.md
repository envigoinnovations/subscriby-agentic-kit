---
name: connector-testing
description: This skill should be used when the user is testing a Subscriby connector, asks about the SDK's fake connector or port fakes and their assertions, how to run the conformance kit with TestRegistry or inside Subscriby's suite, what the kit's rules check, or what only the platform can prove.
license: MIT
metadata:
  category: connector-sdk
  catalogue: 2026-05-01
---

# Testing a connector

Two things to test: that the ports do the right thing against the platform, and that the core does the right thing with the connector. The SDK ships fakes for the second, the conformance kit for the shape of the first, and the platform's own client fake is yours to write for the rest.

## The fake connector

`Subscriby\Connector\Testing\FakeConnector` is the reference implementation and the double every core path is tested against; its manifest is the `connector.json` beside it, read through the same loader as every package. It violates every assumption a single-platform core would make (280-character messages with two buttons a row and no files, `membership` grants plus a `creator_task` kind, no early admission, three admin commands, a one-message-a-second pace, phone-number-shaped identities), and Subscriby registers it whenever tests run, so a core path that still assumes one platform fails against it.

## The port fakes

Each fake implements one port, keeps what it was asked in memory, answers something plausible, and has a trigger (a value in the input that makes it fail the way a platform would). Register them beside a real port of yours to test one port in isolation, or all of them to test a flow.

| Fake | Behaviour | Triggers and assertions |
| --- | --- | --- |
| `FakeInstallationLifecycle` | Connects in one step; start links on `https://fake.test/<id>?start=<payload>`; answers a platform installation | A token `revoked` verifies as revoked (`token_revoked`, creator-actionable); a token starting `steps-` asks a `region` field before completing; one starting `oauth-` returns a `continueUrl` and completes from `returned['code']`, minting `oauth-<code>` into `meta`; `returned['error']` is a platform refusal |
| `FakeIdentityResolver` | Reads the actor from the payload's `from`; external ids look like `+15550001`, so a path that treats them as numeric chat ids fails | Adopting keeps no row: the storage ref is derived from the id |
| `FakeInboundGateway` | Authentic when `X-Fake-Token` is `fake`; the body's `id` is the idempotency key and its `kind` the event kind | Post the same `id` twice for the replay path |
| `FakeFailureClassifier` | An exception is `Transient`; an array with `error` maps named codes to kinds | A `RateLimited` code carries a five-second retry-after |
| `FakeTextRenderer` | Canonical HTML to plain text | |
| `FakeSettingsSchema` | One secret to install with, one text setting | |
| `FakeUiSlots` | No contributions | |
| `FakeMessenger` | Keeps every send; delivers as `fake-message-N` | `blocked-` identities are `Unreachable`; files fail as `Configuration`; `assertSentTo($externalId, ?$containing)`, `assertNotSentTo(…)`, `assertNothingSent()` |
| `FakeAccessController` | Memberships in memory (`membership:<space>:<identity>`), never links; granting twice is one membership, revoking a stranger is revoked | `blocked-` identities fail `Unreachable`; `assertGranted($space, $identity)`, `assertNotGranted(…)`, `assertAnnounced($identity, ?$windowId)`, `assertNotAnnounced($identity)` |
| `FakeSpaceCatalog` | Parks one link request per creator and purpose; describes a place as `Room <id>`; records every diagnosis | A space whose external id starts `lost-` diagnoses as not a member, creator-actionable |
| `FakeManagementSurface` | Renders the manifest's three commands; records every envelope | |
| `FakeCopilotSurface` | Records every display opened, repainted, finished and failed; handles `fake-display-N` | `blocked-` identities cannot be shown anything; `assertOpenedFor($externalId)`, `assertFinishedFor($externalId, ?$containing)`, `assertNothingOpened()` |
| `FakePortalLoginMethod` | "Continue with Fake" with a `sparkles` icon; a start link carrying the handshake token | |
| `FakeRecoverySupport` | Probes only: healthy probes, a vocabulary, readiness items; every other facet throws `UnsupportedByConnector` | An identity marked deleted probes `TargetMissing` (`account_deleted`); a `blocked-` one probes `Unreachable` |

```php
$messenger = new FakeMessenger;
$registrar->port(Messenger::class, $messenger);
$messenger->assertSentTo('member-42', containing: 'Payment received');
```

## What your own suite covers

Test each port against a fake of the platform's client (an HTTP fake for a REST platform, a recorded socket for a gateway), never against the live platform, and pin the wire format with characterisation tests that record what the connector sends for each core message and admin flow and fail on any change, so a behaviour change is a deliberate commit. Never a catch-all fake that answers everything with success: fake each call one answer at a time and let an unexpected call fail the test.

| Port | Cover at least |
| --- | --- |
| `InstallationLifecycle` | Connect with a good and a bad credential, reconnect naming the existing installation, verify healthy and revoked, disconnect after the platform already revoked |
| `IdentityResolver` | An event with an actor, one without, adoption twice for the same account returning the same row |
| `InboundGateway` | A signed and an unsigned request, a body with two events and their idempotency keys, an empty body |
| `FailureClassifier` | One row per platform error you map, plus a network exception and an unknown string |
| `TextRenderer` | Each of the eight tags, a nested pair, entities, plain text unchanged |
| `Messenger` | A send the platform refuses inside a 200, a rate limit with its retry-after, a file when the manifest allows one |
| `AccessController` | Grant twice yielding one grant, revoke of a missing grant reporting revoked, a held grant admitted, reconcile letting a banned holder back in |
| `SupportRelay` | A reply with and without a quote, an attachment the platform serves and one it cannot |
| `RecoverySupport` | Each probe's three answers, a standby registered and removed |

For the core's side, register the connector beside the fake in a Subscriby test run and assert the same scenario on both: a purchase grants, a cancellation revokes, a member with no identity waits as `pending_identity` and materialises after a handshake. A difference means the manifest says something the fake's does not, or the core has a platform assumption left; either is worth a report.

## Running the kit

In the package's own suite, with no Subscriby checkout, the SDK's `TestRegistry` stands in for the application's registry and runs the same manifest-to-port checks at `register()` (through `PortAgreement`): a capability without its port, a port without its capability, a missing required port, or fields declared in the file and bound as a schema throw `InvalidManifest` with production's words before a rule runs. Its constructor takes what the application reads from configuration: `official` (a connector declaring `native_payments` passes `official: ['example']` or is refused), `available`, `disabled`.

```php
it('passes the conformance kit', function (): void {
    $registry = new TestRegistry;
    $registry->register(ManifestFile::load(dirname(__DIR__).'/connector.json'), new ExampleConnector);

    $report = (new ConformanceSuite($registry))->run('example', packagePath: dirname(__DIR__));

    expect($report->passed())->toBeTrue($report->summary());
});
```

Inside Subscriby's suite instead: put the package under `packages/subscriby-connector-<key>/` in a checkout; its Pest configuration includes every such `tests` directory, the provider boots with the application, and the suite runs against `app(ConnectorRegistry::class)` as the first-party connectors do. Three checks need no registry and belong in every package from the first commit: `ManifestFile::load()` for the manifest, `MigrationRules::violations('<key>', …)` for the data rules, and the `Field` and `MessageAction` constructors for forms and buttons.

Passing the package path adds the two on-disk rules. Every rule is guarded: a port that throws fails its own rule with the exception's class and message while the rest still run. `ConformanceReport` is all-or-nothing: `passed()`, `failures()`, `checks` (name, passed, detail) and `summary()` (one line when green, otherwise one line per failure, such as `example: settings.install_fields — install fields: "token" has no label`).

## The rules

- Manifest: `manifest.key_matches`, `manifest.sdk_constraint`, `manifest.listing_links` (`https://` or `mailto:` only, `changelog_url` included), `manifest.resource_kinds` (label, portal label, icon), `manifest.file_is_the_source` (on disk: the file matches the registered key, name, version, SDK constraint, capability count and field counts).
- Ports and forms: `ports.required_bound` (the seven), `settings.install_fields` (`Field` entries, unique names, labels; an input and a secret for `paste_credential`), `settings.settings_fields` (the same shape, asked with no installation, so an own schema answers defaults for null).
- Rendering and failures: `text.plain_text_survives` (`render('Hello, world')` is the identity, byte for byte), `text.canonical_sample_renders` (the eight words `Bold`, `italic`, `underline`, `struck`, `link`, `code`, `pre`, `quote` survive), `failures.classifies_anything` (a `RuntimeException` and the string `conformance probe` both classify to a `DeliveryFailure`; accept `mixed`, fall back to `Transient` for a throwable and `Other` for a value).
- Inbound, identity and slots: `inbound.tolerates_empty_request` (`POST /conformance` with `{}`: `authenticate()` a boolean, `decode()` an iterable, `immediateResponse()` null or a `Response`), `identity.tolerates_empty_envelope` (`resolveInbound()` on an empty envelope answers null or an `IdentitySummary`), `identity.answers_reachability` (`deliveryTarget()` for an unknown account answers null or a `Recipient`, from what you hold, never by calling the platform), `slots.well_formed` (`SlotContribution` entries, no slot twice, every one with a placeholder).
- Capability rules, when the port is bound: `access.declares_kinds`, `management.commands_match_manifest`, `relay.modes_match_manifest`, `recovery.vocabulary_and_readiness` (six non-empty nouns; readiness items with unique keys for a synthetic installation with zero UUIDs), `portal_login.button` (label and icon), `payments.provider_keys` (`<key>:<provider>` keys, a label, at least one currency).
- Migrations: `migrations.own_tables_only` (on disk).

Empty is a valid input everywhere: the core hands a connector less than it expects, and a connector answers "nothing here" rather than throwing.

## Beyond the kit

Subscriby's own architecture tests hold every installed connector to three more rules the kit cannot see from outside: no import from the application's namespace in the package (the only thing that crosses is the SDK), translation parity across the ten locales in `lang/<locale>.json`, and skeleton parity (a slot's placeholder mirrors its loaded layout). Review then reads for what no test can judge: credentials never in a log, an exception message or a view; the platform's terms allow what is automated; the listing describes what the bound ports do and every declared capability works rather than throwing; repeated grants and revokes are safe, `pacing` matches the platform's published limits, the classifier maps the rate-limit answer to `RateLimited` with its retry-after; the ten locales are real translations.

## What only the platform proves

The kit and the fakes cannot tell you that a real bot can add a real member to a real room, that the platform's rate limit is where its documentation says, or that a revoked token answers the way you classified it. Keep one sandbox installation on the platform, run the connector against it by hand before each release, and record what you see into the characterisation snapshots.

## Do not

- Do not test against the live platform in the suite, and never with a catch-all fake.
- Do not let a port throw on an empty request, an empty envelope or an unknown account.
- Do not read the kit's green as proof that a capability works; the platform proves that.

## References

- Documentation: [testing a connector](https://docs.subscriby.net/sdk/v1/building/testing), [the conformance kit](https://docs.subscriby.net/sdk/v1/conformance) and its rule pages ([manifest](https://docs.subscriby.net/sdk/v1/conformance/manifest-rules), [ports and forms](https://docs.subscriby.net/sdk/v1/conformance/ports-and-forms), [rendering and failures](https://docs.subscriby.net/sdk/v1/conformance/rendering-and-failures), [inbound, identity and slots](https://docs.subscriby.net/sdk/v1/conformance/inbound-identity-slots), [capability rules](https://docs.subscriby.net/sdk/v1/conformance/capability-rules), [migration rules](https://docs.subscriby.net/sdk/v1/conformance/migration-rules), [beyond the kit](https://docs.subscriby.net/sdk/v1/conformance/beyond-the-kit)), [the tutorial's tests chapter](https://docs.subscriby.net/sdk/v1/tutorial/09-tests).
- Related skills: `connector-ports`, `connector-data-rules`, `connector-publishing`.
