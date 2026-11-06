---
name: smart-links
description: This skill should be used when the user asks to track where members come from, create a tracked link for a bio, a video, a newsletter or a QR code, read a link's clicks, leads, checkouts, paid members and revenue, compare channels, embed plans on a website, or rename, expire or archive a link.
license: MIT
metadata:
  category: creators
  catalogue: 2026-05-01
---

# Smart Links

A Smart Link is a tracked address for one place the project is promoted. Every click is counted, every member who signs in within thirty days of clicking is credited to it, and the funnel shows what each channel brought: leads, checkouts, paying members and everything they ever paid. A **Direct** row holds the members no link brought, so the figures always add up to the project's own. On every plan.

## A link

`create_link` takes `name` (for the creator alone), `slug` (the segment after `/go/`: 2 to 32 lowercase letters, digits and hyphens, unique in the project), `destination` (the portal home, one plan with `plan_id`, whose checkout opens straight away, or the bot, which opens with the link's code in its start payload) and an optional `expires_at` (after it the address still lands on the portal, but nothing is counted). `update_link` renames or re-points it; a renamed slug moves the web address only. `archive_link` is the only removal: the address keeps landing on the portal so a printed flyer never shows an error, the figures stay, and an archived link cannot come back. `list_links` (`archived`, `search`) and `get_link` read them.

Every link answers at three addresses, all crediting the same link: the web address `https://my.subscriby.net/<handle>/go/<slug>`, the bot link carrying `via_<code>` in the start payload (empty until the project runs a bot that hands out start links), and the embed page `https://my.subscriby.net/<handle>/embed/plans?via=<code>` that any website may frame. The seven-character code is minted once and never changes, which is why a rename moves nothing but the web address; the dashboard draws the QR code of the web address.

## How a member is credited

A click is counted once per visitor address per hour. The visit is remembered in the browser for thirty days with the door (portal, bot, website embed) and any `utm_source`, `utm_medium`, `utm_campaign` tags. The member is credited the first time they sign in on the portal within those days, or at once when they arrive in the bot through the bot link. The last link wins until they pay; after a successful payment the source is fixed, so a paying member's lifetime revenue never moves between links. Campaign tags alone never displace a link.

## The funnel

`get_link_funnel` with a `link_id` answers one link's lifetime figures; without it, every link with the Direct row and totals that add up to the project's own: clicks, leads (everyone credited), checkouts (those who started a purchase), paid (at least one successful payment), conversion (paid per hundred clicks), revenue per currency and restated in US dollars. The figures are lifetime by design, counting removed members and ended purchases, so two channels compare on everything each ever brought. Every member and subscription object carries `source`, the link credited with the member, null for Direct.

## Do not

- Do not delete a link; archive it, and say the figures stay.
- Do not read a link's revenue against a dashboard period; it is lifetime.
- Do not hand-build a `/go/` address; read the three addresses from `get_link`.

## References

- [references/tools.md](references/tools.md): the six tools with their arguments.
- [references/events.md](references/events.md): `link.created`, `link.updated` and `link.archived` (clicks and attributions fire nothing; read the funnel).
- [references/endpoints.md](references/endpoints.md): the REST twins under `/v1/projects/{project}/links`.
- Documentation: [Smart Links](https://docs.subscriby.net/creators/smart-links), [sharing your project](https://docs.subscriby.net/creators/share).
