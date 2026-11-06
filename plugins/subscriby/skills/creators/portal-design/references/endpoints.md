# REST endpoints: Portal Design

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `portal-design`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/portal-design` | `project:view` | Get a project's portal design | `get_portal_design` |
| PUT | `/v1/projects/{project}/portal-design` | `project:update` | Save portal design changes | `update_portal_design` |
| POST | `/v1/projects/{project}/portal-design/discard` | `project:update` | Discard the portal design draft | `discard_portal_design_draft` |
| POST | `/v1/projects/{project}/portal-design/images/{slot}` | `project:update` | Store a portal design picture |  |
| POST | `/v1/projects/{project}/portal-design/publish` | `project:update` | Publish the portal design | `publish_portal_design` |

### GET `/v1/projects/{project}/portal-design`

```bash
curl https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/portal-design \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

The published document, the draft when there is one, when each last moved, and a fresh preview address, or null for a project without a handle. Every key of the fourteen sections comes back in the stored shape `PUT` takes, so a design read here can be changed and sent back. `draft` is `null` and `has_draft` false while nothing is drafted.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


### PUT `/v1/projects/{project}/portal-design`

```bash
curl -X PUT https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/portal-design \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: 7c1f0d3a-6b2e-4f88-9a41-2d5e6c7b8a90" \
  -H "Content-Type: application/json" \
  -d '{"preset": "midnight", "accent": "#22d3ee", "font_display": "space-grotesk"}'
```

Changes the keys sent in the draft, starting one from the published design when none exists; every key is optional and an omitted one keeps its drafted value. Members keep seeing the published design until `publish`. Pictures are stored first through the images endpoint and their addresses written into `gallery`, a quote's `avatar_url` or `social_card_url`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `preset` (one of `classic`, `dark`, `midnight`, `paper`, `pastel`, `bold`): The starting palettes a portal design is built from. A preset sets every colour of the design at once and stays editable afterwards; `Classic` is the exact look every portal had before the designer existed, which is why its light palette is the design's default. Each preset carries a light and a dark palette drawn by hand, because an inverted light palette reads as broken on a dark screen: the dark half keeps the accent and re-draws the backgrounds and the text.
- `color_mode` (one of `light`, `dark`, `system`): Which of a preset's two palettes the portal paints with. `System` paints the light palette and switches to the dark one when the visitor's browser asks for a dark scheme, through a media query the layout emits beside the light declarations; the other two paint one palette whatever the visitor prefers. Every preset carries a drawn dark palette, so the dark half is never an inversion of the light one.
- `accent` (string): The accent, on the buttons, the highlights and the chosen plan's ring, as a six-digit lowercase hex such as `#a3e635`. The text drawn on it is picked by luminance.
- `accent_secondary` (string): The second accent, on the pass-series and pass strips, as a hex colour; `null` paints the preset's own.
- `background` (string): The page colour behind the cards, as a hex colour.
- `grid` (boolean): Whether the faint dotted grid is drawn over the page colour.
- `surface` (string): The cards' colour, as a hex colour.
- `text` (string): The body text colour, as a hex colour. It must read on the surface and on the background: a pair under a 3:1 contrast ratio is refused.
- `heading` (string): The colour of the project's name and every heading, as a hex colour, under the same contrast rule as `text`.
- `muted` (string): The colour of the captions, the labels and the small print, as a hex colour, under the same contrast rule as `text`.
- `tagline` (string): One line under the project's name, up to 80 characters, or `null` for none.
- `social_links` (array of string): Up to 12 links under the card, each `{network, url, label}`: `network` one of {social_networks}; `url` an https address; `label` the name shown for a `custom` link, up to 40 characters, ignored on the others.
- `font_display` (one of `asap-condensed`, `inter`, `poppins`, `montserrat`, `space-grotesk`, `bebas-neue`, `oswald`, `dm-serif-display`, `playfair-display`, `lora`, `manrope`, `sora`): The curated faces a portal may set its display and body type in. Twelve faces, every one an open licence and self-hosted as a latin subset, so a member's browser never calls a font service; the two the portal always had head the list. A face names itself rather than a translated word, as a brand does, and says whether it is a serif so the fallback stack behind it reads the same way while it loads.
- `font_body` (one of `asap-condensed`, `inter`, `poppins`, `montserrat`, `space-grotesk`, `bebas-neue`, `oswald`, `dm-serif-display`, `playfair-display`, `lora`, `manrope`, `sora`): The curated faces a portal may set its display and body type in. Twelve faces, every one an open licence and self-hosted as a latin subset, so a member's browser never calls a font service; the two the portal always had head the list. A face names itself rather than a translated word, as a brand does, and says whether it is a serif so the fallback stack behind it reads the same way while it loads.
- `heading_case` (one of `uppercase`, `as_written`): How the portal's headings set their letters. The portal always shouted its headings in capitals; a serif or a script face reads better as written, so the case is a choice of its own rather than a property of the face.
- `type_scale` (one of `compact`, `regular`, `large`): How large the portal sets its type. One factor over every text size the templates use, so the page keeps its proportions; the regular scale is exactly the size every portal had, and emits nothing.
- `radius` (one of `sharp`, `soft`, `round`): How rounded the portal's corners are. One choice moves every corner together, the two surface cards and the plan cards included, through the bundle's own radius tokens; the round setting is exactly the look every portal had and emits nothing.
- `button_style` (one of `pill`, `rounded`, `square`): The shape of the portal's buttons. The pill is the shape every portal had; the rounded button follows the corner radius the design chose, and the square one is nearly sharp whatever the corners do.
- `button_fill` (one of `accent`, `dark`, `outline`): How the portal's buttons are filled. The dark fill every portal had reads the palette's heading colour and the surface it sits on, so it stays a dark button on a light palette and a light one on a dark palette; the accent fill reads the accent and the foreground picked for it; the outline keeps the surface and draws the heading colour around and inside the button.
- `button_case` (one of `uppercase`, `as_written`): How the portal's headings set their letters. The portal always shouted its headings in capitals; a serif or a script face reads better as written, so the case is a choice of its own rather than a property of the face.
- `shadow` (one of `none`, `soft`, `strong`): How much the portal's surfaces lift off the page. Three shadows move together: the one under the surface and plan cards, the one under anything that floats (a modal, a menu) and the soft one under small things like the project photo; the strong setting is the depth every portal had.
- `card_border` (boolean): Whether the cards carry a hairline border.
- `arrangement` (one of `sidebar_left`, `sidebar_right`, `stacked`, `hero`): Where the portal's sidebar card sits against the main card. The sidebar on the left is the arrangement every portal had; on the right the two columns swap; stacked puts the sidebar card above the main card, centred and narrow; the hero does the same with the banner at full width and taller, so the page opens on the image.
- `content_width` (one of `narrow`, `regular`, `wide`): How wide the portal's column is on a large screen. Regular is the width every portal had; narrow suits a page with little beside the plans, wide a page with several plan columns. The classes that draw each width live in the page template, where the bundle reads them.
- `sticky_sidebar` (boolean): Whether the sidebar card stays in view while the plans scroll.
- `plan_grid` (one of `list`, `two`, `three`): How many columns the plan cards fill on a wide screen. The list is the one column every portal had; two and three columns fold back to one on a phone, as the cards were drawn for that width from the start.
- `plan_density` (one of `compact`, `roomy`): How much room a plan card takes. Roomy is the padding every portal had; compact tightens the card and the space between cards, for a portal with many plans or several columns.
- `plans_heading` (boolean): Whether the heading over the plans is shown.
- `metrics_subscribers` (boolean): Whether the member count is shown on the card.
- `metrics_followers` (boolean): Whether the follower count is shown on the card.
- `metrics_threshold` (integer): The count a figure must reach before it is shown, 0 to 1,000,000, so a young project never shows a small number.
- `plans_title` (string): The heading over the plans, up to 60 characters; `null` for the built-in wording.
- `plans_subtitle` (string): The line under that heading, up to 120 characters; `null` for the built-in wording.
- `label_login` (string): The Login button's label, up to 24 characters; `null` for the built-in wording.
- `label_share` (string): The Share button's label, up to 24 characters; `null` for the built-in wording.
- `label_subscribe` (string): The button on every plan card, up to 24 characters; `null` for the built-in wording.
- `checkout_title` (string): The checkout's heading, up to 60 characters; `null` for the built-in wording.
- `checkout_subtitle` (string): The line under the checkout's heading, up to 120 characters; `null` for the built-in wording.
- `checkout_note` (string): A note under the checkout, up to 240 characters; `null` for none.
- `success_title` (string): The heading of the thank-you screen, up to 60 characters; `null` for the built-in wording.
- `success_message` (string): The thank-you screen's message, up to 400 characters; `null` for the built-in wording.
- `perks_title` (string): The heading over the perks, up to 60 characters; `null` for the built-in one.
- `perks` (array of string): Up to 12 perks, each a line of up to 120 characters; the block shows only with at least one.
- `faq_title` (string): The heading over the questions, up to 60 characters; `null` for the built-in one.
- `faq` (array of string): Up to 12 questions, each `{question, answer}`, the question up to 160 characters and the answer up to 800, both required.
- `about_name` (string): The name on the card about the creator, up to 60 characters, or `null`; the card shows when a name or a bio is set.
- `about_bio` (string): The bio on the card about the creator, up to 600 characters, or `null`.
- `custom_button_label` (string): The second button's label, up to 24 characters, sent together with `custom_button_url` or both `null`.
- `custom_button_url` (string): Where the second button leads, an https or http address up to 255 characters, sent together with `custom_button_label` or both `null`.
- `footer_refund_url` (string): The refund policy link in the footer, an https or http address, or `null`.
- `footer_contact_url` (string): The contact link in the footer, an https, http or `mailto:` address, or `null`.
- `footer_imprint_url` (string): The imprint link in the footer, an https or http address, or `null`.
- `footer_line` (string): A line of small print in the footer, up to 120 characters, or `null`.
- `footer_help` (boolean): Whether the Help link is shown in the footer.
- `announcement_text` (string): The strip across the top of the page, up to 160 characters, or `null` for no strip.
- `announcement_url` (string): Where the strip leads, an https or http address, or `null`.
- `announcement_starts_at` (string): When the strip starts showing, ISO 8601 in any zone and stored in UTC, or `null` for at once.
- `announcement_ends_at` (string): When the strip comes down, ISO 8601 and after the start, or `null` for never.
- `video_url` (string): A YouTube or Vimeo address in any shape the share button gives, stored as the canonical watch address, or `null` for no video.
- `gallery_title` (string): The heading over the gallery, up to 60 characters; `null` for the built-in one.
- `gallery` (array of string): Up to 8 picture addresses, each stored through `POST /v1/projects/{project}/portal-design/images/gallery`.
- `testimonials_title` (string): The heading over the quotes, up to 60 characters; `null` for the built-in one.
- `testimonials` (array of string): Up to 12 quotes from members, each `{quote, name, subtitle, avatar_url}`: the words up to 300 characters and the name up to 60, both required; `subtitle` what they are, up to 60 characters, or `null`; `avatar_url` a photo stored through `POST /v1/projects/{project}/portal-design/images/avatar`, or `null` for the first letter of the name.
- `sidebar_items` (array of string): The sidebar card's parts in order, each `{key, shown}` with `key` one of `tagline`, `metrics`, `buttons`, `description`, `social_links`, `footer`, every key exactly once; a part left out is appended, shown.
- `content_blocks` (array of string): The blocks under the plans in order, each `{key, shown}` with `key` one of `perks`, `about`, `faq`, `video`, `gallery`, `testimonials`, every key exactly once; a block left out is appended, shown.
- `locale_switcher` (boolean): Whether the list of languages under the card is shown.
- `featured_plan_id` (string): The plan that carries the Most popular badge, one of the project's own plan ids, or `null` for none.
- `coupon_box` (one of `always`, `link`): When the checkout offers the coupon box. A box on every checkout invites a buyer to go looking for a code; a box that opens only once a coupon arrived with the visit keeps the price plain for everyone else.
- `share_button` (boolean): Whether the Share button is shown in the header.
- `share_networks` (array of string): Which networks the share sheet offers, kept in the sheet's own order: {share_networks}.
- `login_button` (boolean): Whether the Login button is shown in the header.
- `social_proof` (boolean): Whether a line over the plans says how many members joined in the last seven days; it shows only from three up.
- `seats_badges` (boolean): Whether a pass series card shows how many seats are left.
- `seo_indexable` (boolean): Whether search engines may list the portal; `false` adds a noindex directive. A portal the project's own readiness keeps out stays unlisted either way.
- `seo_social_card` (boolean): Whether a shared link unfurls with a card image; `false` leaves the title and the description alone.
- `pixel_meta` (string): The creator's own Meta Pixel id, 10 to 20 digits, or `null`.
- `pixel_ga4` (string): The creator's own Google Analytics 4 measurement id, `G-` followed by 4 to 15 letters or digits, or `null`.
- `pixel_tiktok` (string): The creator's own TikTok Pixel id, 10 to 30 letters or digits, or `null`.
- `pixel_google_ads` (string): The creator's own Google Ads conversion id, `AW-` followed by 6 to 12 digits, or `null`.
- `custom_css` (string): A stylesheet of up to 16,384 characters printed after the theme so its rules win; refused when it would load, run or escape (`@import`, `url(`, `expression(`, `javascript:`, a closing `style` tag and the like); `null` for none.
- `seo_title_suffix` (string): The words after the project's name in the page title, up to 60 characters, or `null` for the built-in ones.
- `seo_description` (string): The description search engines and shared links show, up to 160 characters, or `null` for one cut from the project's text.
- `social_card_url` (string): A card image of the creator's own, stored through `POST /v1/projects/{project}/portal-design/images/card` and sent in the generated card's place, or `null` for the generated card.
- `default_locale` (any or null): The language the portal's own address opens in, as a code from `locales`, or `null` for the platform's default.
- `locales` (array of string): The languages the switcher offers, as codes from `en`, `fr`, `es`, `it`, `hi`, `bn`, `de`, `pt`, `tr`, `si`, never empty and always carrying `default_locale`.


### POST `/v1/projects/{project}/portal-design/discard`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/portal-design/discard \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: 5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c8d"
```

Throws the draft away and keeps what members see; a picture only the draft named is removed with it. Answers the design, the published document alone.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/portal-design/images/{slot}`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/portal-design/images/gallery \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: 1b2c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e" \
  -F "image=@lounge.jpg"
```

Stores a picture for the design, cut from the centre to the slot's size: `gallery` to 1200 by 800, `avatar` to 160 by 160, `card` to 1200 by 630. The answer carries the address to write into the design with `PUT`; a picture nothing names any longer is removed on the next save, publish or discard. The banner and the project photo are not slots here; they live on the project.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `slot` (path, string, required): The slot the picture is for: `gallery`, `avatar` or `card`; it sets the size.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/portal-design/publish`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/portal-design/publish \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: 9e2b4c6d-1a3f-4e5b-8c7d-0f1a2b3c4d5e"
```

Makes the draft the design members see; the portal, the plan embed and the social card paint with it on their next render, and `project.design_published` is emitted naming the sections that changed. Answers the design with no draft left.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


## `distribution`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/distribution/deep-link` | `distribution:read` | Build a deep link | `get_deep_link` |
| GET | `/v1/projects/{project}/distribution/portal-url` | `distribution:read` | Get the portal URL | `get_portal_url` |

### GET `/v1/projects/{project}/distribution/deep-link`

Builds a start link against the project's connected installation. The payload depends on which query parameter you pass (at most one; an access code wins over a plan, and a plan over a custom parameter):

| Query parameter | Resulting payload           | Acted on by the bot?                                         |
| --------------- | --------------------------- | ------------------------------------------------------------ |
| `access_code`   | the code verbatim           | Yes: redeemed on open.                                       |
| `plan_id`       | the plan's bare UUID        | Yes: opens that plan's checkout flow.                        |
| `custom`        | the caller-supplied string  | No, see below.                                               |
| *(none)*        | `project_<uuid>`            | No: falls through to the project home, which is the intent.  |

> **Only a bare UUID is acted on.** The bot acts on a start payload only when it is a bare UUID: it is matched against the project's plans first, then tried as an access code. `custom` payloads and the default `project_<uuid>` do not match that shape, so the bot ignores them and opens its home screen. `custom` is therefore a passthrough for **your own** tracking: the platform delivers it and you can read it off the update in a webhook consumer, but Subscriby neither stores it nor attaches it to the member.

```bash
curl "https://api.subscriby.net/v1/projects/$PROJECT_ID/distribution/deep-link?plan_id=$PLAN_ID" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan_id` (query, string or null): A plan of this project; the link then opens that plan's checkout. Answers 404 for a plan outside the project. Ignored when `access_code` is also sent.
- `access_code` (query, string or null): An access code, carried verbatim and redeemed when the link is opened. Wins over `plan_id` and `custom`.
- `custom` (query, string or null): Your own tracking string, 1 to 64 characters of letters, digits, underscore or hyphen. Delivered by the platform but not acted on or stored by Subscriby. Used only when neither `access_code` nor `plan_id` is sent.


### GET `/v1/projects/{project}/distribution/portal-url`

The portal URL always uses the project's current `handle`. If you change the handle the portal URL updates in lock-step; any old link answers 404 on the portal host.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.

