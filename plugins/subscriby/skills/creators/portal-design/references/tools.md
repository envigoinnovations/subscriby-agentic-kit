# Tools: Portal Design

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Kinds: a read is side-effect free and safe to fan out; an additive tool adds something new and runs without a confirmation; a destructive tool changes or removes existing data and asks first. A tool refuses with `TOKEN_MISSING_ABILITY` when the credential lacks the ability named beside it.

| Tool | Kind | Ability | What it does |
| --- | --- | --- | --- |
| `get_portal_design` | read | `project:view` | Reads a project's portal design: `published`, the document members see, and `draft`, the one being edited or null, each with every key of the fourteen sections (colours, typography, shape, layout, wording, blocks, button and footer, announcement bar, media, sections, behaviour, visibility and code, language) in the stored shape `update_portal_design` takes back, plus `has_draft`, `draft_updated_at`, `published_at` and a preview_url that shows the draft for ten minutes, null until the project has a handle. |
| `update_portal_design` | additive | `project:update` | Changes some keys of a project's portal design in its draft; anything you omit keeps its drafted value and members keep seeing the published design until `publish_portal_design`. |
| `publish_portal_design` | destructive | `project:update` | Makes a project's drafted portal design the one members see; the portal, the embed and the social card paint with it on their next render, and `project.design_published` is emitted naming the sections that changed. |
| `discard_portal_design_draft` | destructive | `project:update` | Throws a project's drafted portal design away and keeps what members see; a picture only the draft named is removed with it. |
| `get_portal_url` | read | `distribution:read` | Builds the subscriber-portal URL for a project: `{frontend_url}/{handle}`. |
| `get_deep_link` | read | `distribution:read` | Builds a shareable deep link into a project's bot on its connector, carrying a `start` payload. |

## `get_portal_design`

Read · requires `project:view`

Reads a project's portal design: `published`, the document members see, and `draft`, the one being edited or null, each with every key of the fourteen sections (colours, typography, shape, layout, wording, blocks, button and footer, announcement bar, media, sections, behaviour, visibility and code, language) in the stored shape `update_portal_design` takes back, plus `has_draft`, `draft_updated_at`, `published_at` and a preview_url that shows the draft for ten minutes, null until the project has a handle. Requires `project_id`. Unknown or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project whose portal design to read.

## `update_portal_design`

Additive · requires `project:update` · idempotent

Changes some keys of a project's portal design in its draft; anything you omit keeps its drafted value and members keep seeing the published design until `publish_portal_design`. Requires `project_id`; every other argument is one key of the document `get_portal_design` returns, in the same shape: a `preset` recolours the six colours unless a colour is sent beside it, a text colour that blends into the surface or the background is refused, `featured_plan_id` must be one of the project's plans, `locales` must carry `default_locale`, and every list has its ceiling. Pictures are stored over REST (`POST /v1/projects/{project}/portal-design/images/{slot}`) and their addresses written here. Refused with `VALIDATION_FAILED` naming the key. Unknown or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project whose portal design to change.
- `preset` (one of `classic`, `dark`, `midnight`, `paper`, `pastel`, `bold`): The palette the colours started from: `classic`, `dark`, `midnight`, `paper`, `pastel` or `bold`. Sending it recolours the six colours below from the preset and keeps the colour mode and the grid; send a colour beside it to override that one.
- `color_mode` (one of `light`, `dark`, `system`): `light` or `dark` paints one palette for everyone; `system` paints the light one and switches to the preset's drawn dark palette when the visitor's browser asks for a dark scheme.
- `accent` (string): The accent, on the buttons, the highlights and the chosen plan's ring, as a six-digit lowercase hex such as `#a3e635`. The text drawn on it is picked by luminance.
- `accent_secondary` (string): The second accent, on the pass-series and pass strips, as a hex colour; `null` paints the preset's own.
- `background` (string): The page colour behind the cards, as a hex colour.
- `grid` (boolean): Whether the faint dotted grid is drawn over the page colour.
- `surface` (string): The cards' colour, as a hex colour.
- `text` (string): The body text colour, as a hex colour. It must read on the surface and on the background: a pair under a 3:1 contrast ratio is refused.
- `heading` (string): The colour of the project's name and every heading, as a hex colour, under the same contrast rule as `text`.
- `muted` (string): The colour of the captions, the labels and the small print, as a hex colour, under the same contrast rule as `text`.
- `tagline` (string): One line under the project's name, up to 80 characters, or `null` for none.
- `social_links` (array of object): Up to 12 links under the card, each `{network, url, label}`: `network` one of `website`, `instagram`, `x`, `youtube`, `tiktok`, `facebook`, `linkedin`, `discord`, `telegram`, `whatsapp`, `threads`, `custom`; `url` an https address; `label` the name shown for a `custom` link, up to 40 characters, ignored on the others.
- `font_display` (one of `asap-condensed`, `inter`, `poppins`, `montserrat`, `space-grotesk`, `bebas-neue`, `oswald`, `dm-serif-display`, `playfair-display`, `lora`, `manrope`, `sora`): The face of the headings: `asap-condensed`, `inter`, `poppins`, `montserrat`, `space-grotesk`, `bebas-neue`, `oswald`, `dm-serif-display`, `playfair-display`, `lora`, `manrope` or `sora`.
- `font_body` (one of `asap-condensed`, `inter`, `poppins`, `montserrat`, `space-grotesk`, `bebas-neue`, `oswald`, `dm-serif-display`, `playfair-display`, `lora`, `manrope`, `sora`): The face of everything but the headings, from the same twelve as `font_display`.
- `heading_case` (one of `uppercase`, `as_written`): `uppercase` or `as_written`, for every heading.
- `type_scale` (one of `compact`, `regular`, `large`): `compact`, `regular` or `large`: one multiplier on every text size.
- `radius` (one of `sharp`, `soft`, `round`): `sharp`, `soft` or `round` corners on the cards and the fields.
- `button_style` (one of `pill`, `rounded`, `square`): `pill`, `rounded` or `square` buttons.
- `button_fill` (one of `accent`, `dark`, `outline`): `accent` fills the buttons with the accent, `dark` with the heading colour, `outline` draws them hollow.
- `button_case` (one of `uppercase`, `as_written`): `uppercase` or `as_written`, for every button label.
- `shadow` (one of `none`, `soft`, `strong`): `none`, `soft` or `strong` shadows under the cards.
- `card_border` (boolean): Whether the cards carry a hairline border.
- `arrangement` (one of `sidebar_left`, `sidebar_right`, `stacked`, `hero`): `sidebar_left` or `sidebar_right` put the card beside the plans, `stacked` puts it above them, `hero` runs the banner across the top.
- `content_width` (one of `narrow`, `regular`, `wide`): `narrow`, `regular` or `wide`: how wide the page runs.
- `sticky_sidebar` (boolean): Whether the sidebar card stays in view while the plans scroll.
- `plan_grid` (one of `list`, `two`, `three`): `list`, `two` or `three`: how many plan cards sit side by side.
- `plan_density` (one of `compact`, `roomy`): `compact` or `roomy` plan cards.
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
- `faq` (array of object): Up to 12 questions, each `{question, answer}`, the question up to 160 characters and the answer up to 800, both required.
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
- `testimonials` (array of object): Up to 12 quotes from members, each `{quote, name, subtitle, avatar_url}`: the words up to 300 characters and the name up to 60, both required; `subtitle` what they are, up to 60 characters, or `null`; `avatar_url` a photo stored through `POST /v1/projects/{project}/portal-design/images/avatar`, or `null` for the first letter of the name.
- `sidebar_items` (array of object): The sidebar card's parts in order, each `{key, shown}` with `key` one of `tagline`, `metrics`, `buttons`, `description`, `social_links`, `footer`, every key exactly once; a part left out is appended, shown.
- `content_blocks` (array of object): The blocks under the plans in order, each `{key, shown}` with `key` one of `perks`, `about`, `faq`, `video`, `gallery`, `testimonials`, every key exactly once; a block left out is appended, shown.
- `locale_switcher` (boolean): Whether the list of languages under the card is shown.
- `featured_plan_id` (string): The plan that carries the Most popular badge, one of the project's own plan ids, or `null` for none.
- `coupon_box` (one of `always`, `link`): `always` shows the coupon box on every checkout; `link` shows it only once a coupon arrived with the visit.
- `share_button` (boolean): Whether the Share button is shown in the header.
- `share_networks` (array of string): Which networks the share sheet offers, kept in the sheet's own order: `bluesky`, `buffer`, `email`, `facebook`, `flipboard`, `line`, `linkedin`, `mix`, `pinterest`, `reddit`, `telegram`, `threads`, `tumblr`, `x`, `vk`, `whatsapp`, `xing`.
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
- `default_locale` (one of `en`, `fr`, `es`, `it`, `hi`, `bn`, `de`, `pt`, `tr`, `si`): The language the portal's own address opens in, as a code from `locales`, or `null` for the platform's default.
- `locales` (array of string): The languages the switcher offers, as codes from `en`, `fr`, `es`, `it`, `hi`, `bn`, `de`, `pt`, `tr`, `si`, never empty and always carrying `default_locale`.

## `publish_portal_design`

Destructive · requires `project:update`

Makes a project's drafted portal design the one members see; the portal, the embed and the social card paint with it on their next render, and `project.design_published` is emitted naming the sections that changed. Requires `project_id`. Refused with `VALIDATION_FAILED` when nothing is drafted. Unknown or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project whose drafted portal design to publish.

## `discard_portal_design_draft`

Destructive · requires `project:update`

Throws a project's drafted portal design away and keeps what members see; a picture only the draft named is removed with it. Requires `project_id`. Refused with `VALIDATION_FAILED` when nothing is drafted. Unknown or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project whose portal design draft to discard.

## `get_portal_url`

Read · requires `distribution:read`

Builds the subscriber-portal URL for a project: `{frontend_url}/{handle}`. Always reflects the current handle — updating the handle via `update_project` invalidates previously distributed portal URLs. Returns `{ project_id, handle, portal_url }`.

**Arguments**

- `project_id` (string, required): UUID of the project whose portal URL to return.

## `get_deep_link`

Read · requires `distribution:read`

Builds a shareable deep link into a project's bot on its connector, carrying a `start` payload. Pass `plan_id` (UUID) to pre-select that plan, or `access_code` (UUID) to hand out a one-time redemption link — the bot acts on the raw UUID. `custom` (1–64 chars of A–Za–z0–9_-) is an arbitrary passthrough for external click tracking; the bot itself opens the project home for it. Without any of those, the link opens the bot on the project home flow. Returns `VALIDATION_FAILED` with `reason=no_bot_attached` if the project has no bot connected.

**Arguments**

- `project_id` (string, required): UUID of the project whose bot URL to embed in the deep-link.
- `plan_id` (string): Optional plan UUID. When set, the payload is that UUID verbatim and the bot opens the plan checkout.
- `access_code` (string): Optional access-code UUID. When set, payload is the UUID verbatim for one-tap redemption.
- `custom` (string): Optional caller-supplied payload. Useful for campaign / referral tracking.
