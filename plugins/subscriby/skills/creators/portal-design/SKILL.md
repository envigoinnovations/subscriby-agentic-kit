---
name: portal-design
description: This skill should be used when the user asks to change how a project's portal page looks or reads, its colours, fonts, layout, wording, blocks, announcement, gallery, footer, pixels, CSS or languages, to publish or discard a portal draft, or for the portal address or a bot deep link.
license: MIT
metadata:
  category: creators
  catalogue: 2026-05-01
---

# The portal page and its design

The portal page is the hosted storefront every project gets at `my.subscriby.net/<handle>`. Its design is a document with a published copy and a draft: every change lands in the draft, visitors keep seeing the published design, and publishing makes the draft live in one step. The same rules hold on the dashboard, in the bot, over the API and from here. The reference carries every key with what it accepts; this skill is the map.

## Draft, publish, discard

- `get_portal_design` reads the published document and the draft, when each last moved, and a signed address that previews the draft for ten minutes.
- `update_portal_design` changes some keys in the draft and never what members see; send only the keys that change. A preset recolours the six colours unless a colour is sent beside it.
- `publish_portal_design` makes the draft live and raises `project.design_published` with the sections that changed; `discard_portal_design_draft` throws the draft away. Both destructive: confirm, and say what changes for visitors.
- Pictures (the banner, the project photo, the gallery, the quotes' photos, a social card) are uploaded on the dashboard; the banner and the project photo publish at once, the rest on publish.

## The sections

| Section | Keys | Rules worth stating |
| --- | --- | --- |
| Brand | `tagline` (80 characters, one line), `social_links` (up to 12; a network from the list and a full `https://` address; a custom link needs a name) | The project's own bot is not a social link. |
| Colours | `preset` (`classic`, `dark`, `midnight`, `paper`, `pastel`, `bold`), `color_mode` (`light`, `dark`, `system`), `accent`, `accent_secondary`, `background`, `grid`, `surface`, `text`, `heading`, `muted` | Hex colours; a text colour must stand at least 3:1 from the surface and the background, measured on brightness, or it is refused naming the pair. |
| Typography | `font_display`, `font_body` (twelve faces, served from the portal), `heading_case`, `type_scale` | |
| Shape | `radius`, `button_style`, `button_fill`, `button_case`, `shadow`, `card_border` | |
| Layout | `arrangement` (`sidebar_left`, `sidebar_right`, `stacked`, `hero`), `content_width`, `sticky_sidebar`, `plan_grid`, `plan_density`, `plans_heading`, `metrics_subscribers`, `metrics_followers`, `metrics_threshold` (0 to 1,000,000) | A figure below the threshold stays hidden. |
| Wording | `plans_title` (60), `plans_subtitle` (120), `label_login`, `label_share`, `label_subscribe` (24), `checkout_title` (60), `checkout_subtitle` (120), `checkout_note` (240), `success_title` (60), `success_message` (400) | A text shows in every language as written; an empty field keeps the built-in text in all ten. |
| Blocks | `perks_title`, `perks` (12 lines of 120), `faq_title`, `faq` (12 of 160 and 800), `about_name` (60), `about_bio` (600) | A block shows only once it has something in it. |
| Button and footer | `custom_button_label` (24), `custom_button_url`, `footer_refund_url`, `footer_contact_url`, `footer_imprint_url`, `footer_line` (120), `footer_help` | |
| Announcement and media | `announcement_text` (160), `announcement_url`, `announcement_starts_at`, `announcement_ends_at`, `video_url`, `gallery_title`, `gallery` (8), `testimonials_title`, `testimonials` (12 of 300) | |
| Sections and behaviour | `sidebar_items`, `content_blocks`, `locale_switcher`, `featured_plan_id`, `coupon_box` (`always`, `link`), `share_button`, `share_networks`, `login_button`, `social_proof`, `seats_badges` | |
| Visibility and code | `seo_indexable`, `seo_social_card`, `seo_title_suffix` (60), `seo_description` (160), `social_card_url`, `pixel_meta`, `pixel_ga4`, `pixel_tiktok`, `pixel_google_ads`, `custom_css` (16 KB) | A portal whose payment methods are all test is kept out of search whatever `seo_indexable` says. |
| Language | `default_locale` (`en`, `fr`, `es`, `it`, `hi`, `bn`, `de`, `pt`, `tr`, `si`), `locales` | |

A refused value answers with the key and the reason; read it back to the user rather than retrying with a guess.

## The addresses

- `get_portal_url` answers the portal address. The handle is set on the project (`update_project`; every plan, and a changed handle keeps every former address redirecting); a custom domain is a Growth Plan feature connected on the dashboard.
- `get_deep_link` answers a start link into the project's bot on its connector, optionally for one `plan_id`, an `access_code` or a `custom` payload: what the creator posts where members are.

## Do not

- Do not publish a design the user has not seen; offer the preview address first.
- Do not send a whole document back to `update_portal_design`; send the keys that change.
- Do not invent a font, a preset or a layout value; they are enumerated in the reference.

## References

- [references/tools.md](references/tools.md): the six tools with every key of `update_portal_design` and what it accepts.
- [references/endpoints.md](references/endpoints.md): the REST twins under `/v1/projects/{project}/portal-design` and the distribution endpoints.
- [references/abilities.md](references/abilities.md): `distribution:read`.
- Documentation: [Portal Designer](https://docs.subscriby.net/creators/portal-design), [portal CSS](https://docs.subscriby.net/creators/portal-css), [sharing your project](https://docs.subscriby.net/creators/share), [the portal, the member's side](https://docs.subscriby.net/subscribers/portal).
