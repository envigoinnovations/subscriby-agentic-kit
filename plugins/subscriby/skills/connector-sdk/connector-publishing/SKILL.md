---
name: connector-publishing
description: "This skill should be used when the user is preparing a Subscriby connector for release, asks how to version it or pin the SDK, write the listing and marketing words, pass review, submit a package, update it after first publish, or what the lanes, badges, pausing and retiring mean."
license: MIT
metadata:
  category: connector-sdk
  catalogue: 2026-05-01
---

# Publishing a connector

A connector is installed by Subscriby, not uploaded, so publishing means getting a package to the state Subscriby can review and install, then keeping it there release after release. Marketplace submission and per-connector pricing are not open yet: to get a package reviewed today, use **Request a connector** on the marketplace or write to support@subscriby.net with the repository URL, the tag to review and the kit's report; Subscriby reads the package against the checklist, runs the kit in its own suite and installs a reviewed connector itself. Check the marketplace's "building now" and "on the roadmap" lanes first: those are platforms Subscriby is building connectors for itself, so write to support before starting one; a platform on no lane is open.

## Before the first release

1. **Version the package.** `connector.json`'s `version` is the package's semantic version: `1.0.0` when the ports it declares work on the platform, `0.x` while they do not; bumped with every release.
2. **Pin the SDK.** `"sdk": "^1.0"` in the manifest and `"subscriby/connector-sdk": "^1.0"` in `composer.json` say the same thing; the registry refuses the package at boot when the application's SDK does not satisfy the constraint. Read the SDK changelog before raising the minor you depend on, and ask before raising it past what production runs.
3. **Translate every string.** Field labels, help texts and steps, resource-kind labels, the portal button, readiness items, slot views and the listing's tagline and overview are translation keys resolved through `lang/<locale>.json`. Ship all ten locales Subscriby ships: `english`, `spanish`, `french`, `german`, `italian`, `portuguese`, `turkish`, `hindi`, `bengali`, `sinhalese`. The application's parity tests fail a key present in one file and missing in another, and review fails English copied ten times.
4. **Write the listing** (below).
5. **Pass the kit and the review checklist** (the `connector-testing` skill, then the eight items below), including the two on-disk rules.
6. **Keep a changelog** at `changelog_url` and a `CHANGELOG.md` in the package, so Subscriby knows what a version changed before installing it.

## The listing

Nothing on a connector's marketplace page is typed by hand: the card, the detail page, the in-app directory, `GET /connectors` and the MCP catalogue all read the manifest's `listing` block (the `connector-manifest` skill has every field). What to put in it:

- `category` shelves the connector: `messaging`, `community`, `payments` or `productivity`.
- `tagline`: the one line under the name, 80 characters at most, shown whole on the card.
- `overview`: the Overview tab in Markdown, saying what the connector does for a creator and for a member; the capability section under it is generated from the manifest, so do not repeat the feature list. Write `:app` for the product.
- `links`: `documentation` is your own guide for creators, `support` where a creator writes (a `mailto:` is fine), `privacy` and `terms` are the platform's policies (the legal pages link `privacy` for members), `homepage` the platform's site. All `https://` or `mailto:`.
- `added_at` is the first publication date and drives the **New** chip for sixty days; it never changes on an update. `changelog_url` is where releases are announced. `sign_in_required` tells creators whether they must sign in to the platform to install (an OAuth connector says true).
- `marketing` lends the public site its words, since the site never spells a platform: `audience`, `place`, `places`, `installation`, `identity`, and `native_payment` when there is one; lower case except proper nouns, as they would read mid-sentence. A sentence built on a word the block lacks is dropped; leave the block out and the site says nothing about the connector.
- `seo` is optional and worth writing: it turns `/connectors/<key>` into a search landing page that may lead with the platform's name, the only page on the marketing site allowed to.

What Subscriby stamps, and a package cannot claim: **Official** (Subscriby's own connectors; every other package is **Community**), the lane, **New** (`added_at` within sixty days), **Trending** (the most installed connector over thirty days), **Installed on**, **Made by** (`vendor`).

## The review checklist

Each item is something the kit cannot judge alone:

1. The kit is green, including `manifest.file_is_the_source` and `migrations.own_tables_only`.
2. Nothing from the application's namespace is imported; the connector talks to the core through `Subscriby\Connector\Core\*` and the SDK's value objects only.
3. Credentials never reach a log, an exception message or a view; tokens live in the core's encrypted `CredentialBag`, and your tables hold one only when the platform's client forces it.
4. Every slot contribution has a placeholder that mirrors its loaded layout, and every string it shows comes from the package's `lang/*.json` in all ten locales.
5. The listing tells the truth: the tagline and overview describe what the bound ports do, `privacy` and `terms` are the platform's, `documentation` resolves.
6. The platform's terms allow it; a connector that automates something the platform forbids is not installed, however well it works.
7. Idempotency and pacing are respected: repeated grants and revokes are safe, `pacing` matches the platform's published limits, and the classifier maps the platform's rate-limit response to `RateLimited` with its retry-after.
8. Native payments are official-only; a community package that declares `native_payments` is refused at boot.

## After install: the lanes

Whether creators can install a connector is Subscriby's decision, never the package's claim.

| Lane | Meaning | Creators see |
| --- | --- | --- |
| **Under Development** | Installed by Subscriby, not switched on | A card in the "building now" lane, no install button |
| **Experimental** | Switched on and marked beta | Installable, marked experimental |
| **Available Now** | Switched on | Installable everywhere |
| **Paused** | Switched off by Subscriby during an incident on its side or the platform's | The card says paused; nothing is sent, and what members send waits on the platform until it is switched back on |

## Updating a connector

- Additive migrations only once a version is installed anywhere: a data move is expand → verify → contract, with your own verification before any drop (the `connector-data-rules` skill).
- Bump `version`; `added_at` stays as it was.
- A new capability is a manifest change and a port binding in the same release; the registry refuses one without the other. Declare it only when it works on the platform.
- A removed capability revokes nothing by itself: installations keep running and the core stops calling the port. Say so in the changelog, because creators who used it will notice.
- A raised SDK constraint waits for Subscriby to run that SDK.
- Renaming the key is not an update: the key names tables, config, views and routes for the life of the connector. A new key is a new connector.

## Pausing and retiring

Subscriby can pause a connector during an incident; ask for it when the platform is misbehaving in a way that would fail every send, and the core queues rather than fails. Retiring a connector is an uninstall on every project (grants revoked, resources detached, identities and your tables kept), after which Subscriby switches the connector off; nothing is deleted, and a purge later follows the data rules.

## Do not

- Do not raise the SDK constraint past what production runs without asking.
- Do not change `added_at` on a release, or the key ever.
- Do not declare a capability before it works on the platform, or remove one silently.
- Do not ship English copied into the other nine locale files.

## References

- Documentation: [publishing](https://docs.subscriby.net/sdk/v1/building/publishing), [listing and review](https://docs.subscriby.net/sdk/v1/building/listing), [the listing block](https://docs.subscriby.net/sdk/v1/manifest/listing), [the marketplace](https://www.subscriby.net/connectors), [the SDK changelog](https://github.com/envigoinnovations/subscriby-connector-sdk/blob/main/CHANGELOG.md).
- Related skills: `connector-manifest`, `connector-testing`, `connector-data-rules`; `connectors` for what creators see on the marketplace.
