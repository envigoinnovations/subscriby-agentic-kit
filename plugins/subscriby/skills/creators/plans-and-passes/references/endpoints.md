# REST endpoints: Plans and Passes

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `plans`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/plans` | `project-subscription-plan:view-any` | List a project's plans | `list_plans` |
| POST | `/v1/projects/{project}/plans` | `project-subscription-plan:create` | Create a plan | `create_plan` |
| POST | `/v1/projects/{project}/plans/order` | `project-subscription-plan:update` | Arrange the storefront order | `reorder_plans` |
| DELETE | `/v1/projects/{project}/plans/{plan}` | `project-subscription-plan:delete` | Delete a plan | `delete_plan` |
| GET | `/v1/projects/{project}/plans/{plan}` | `project-subscription-plan:view` | Get a plan | `get_plan` |
| PATCH | `/v1/projects/{project}/plans/{plan}` | `project-subscription-plan:update` | Update a plan | `update_plan` |
| POST | `/v1/projects/{project}/plans/{plan}/publish` | `project-subscription-plan:update` | Publish a plan | `publish_plan` |
| POST | `/v1/projects/{project}/plans/{plan}/successor` | `project-subscription-plan:create` | Start the next season | `start_next_season` |
| POST | `/v1/projects/{project}/plans/{plan}/unpublish` | `project-subscription-plan:update` | Unpublish a plan | `publish_plan` |

### GET `/v1/projects/{project}/plans`

Pages the project's plans, every kind together, newest first. Read `kind` on each row to know which of `billing`, `pass` or `pass_series` it carries; `resources` is loaded on every row. `pass.upcoming_windows` is not served here: the pass windows endpoints list a plan's dates.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### POST `/v1/projects/{project}/plans`

`POST` takes the **same shape it returns**: `kind` plus the one matching block. Sending a block that does not match the kind is refused with `VALIDATION_FAILED` naming the offending key; silently ignoring it would let a caller believe they had set a billing cycle on a pass. Answers `201` with the plan in the same discriminated shape the read endpoint shows for each kind. A plan created on sale (`active: true`, the default) is queued for the push to the payment methods that keep a product catalogue (Stripe, PayPal, CoinPayments, Razorpay), so it is sellable through them within a minute; a draft is pushed when it is published.

### Create a subscription

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/plans \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "subscription",
    "name": "Premium Monthly",
    "currency_id": "8f27a0d4-63be-4915-8c07-1a5d9e34b628",
    "price": 29.00,
    "resources": ["b73c5f21-9d80-4a6e-8215-4f70ce13a9d6"],
    "billing": { "billing_cycle": "month", "billing_cycle_count": 1, "trial_days": 7 }
  }'
```

### Create a pass

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/plans \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "pass",
    "name": "Sunday Slate Pass",
    "currency_id": "8f27a0d4-63be-4915-8c07-1a5d9e34b628",
    "price": 15.00,
    "resources": ["b73c5f21-9d80-4a6e-8215-4f70ce13a9d6"],
    "pass": {
      "timezone": "America/New_York",
      "schedule_mode": "repeating",
      "recurrence": "weekly",
      "sales_cutoff_minutes": 60,
      "sales_cutoff_anchor": "before_start",
      "slots": [
        { "weekday": 4, "start_time": "19:00", "duration_minutes": 180 },
        { "weekday": 0, "start_time": "09:00", "duration_minutes": 840 }
      ]
    }
  }'
```

Sending `pass.slots` **replaces the whole schedule** and rebuilds future windows. Windows a customer has already bought keep their original times and are never moved or deleted; only unsold future windows are regenerated. `pass.windows` is different: it *adds* explicitly dated windows for `schedule_mode: fixed` and never replaces anything.

### Create a pass series

A series needs window ids, and those come from windows that already exist. Read them from `pass.upcoming_windows` on the source plan, from the pass windows endpoints, or from the [`list_pass_windows`](https://docs.subscriby.net/mcp/v1/tools/plan/list-pass-windows) MCP tool.

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/plans \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "pass_series",
    "name": "Autumn Season Ticket",
    "currency_id": "8f27a0d4-63be-4915-8c07-1a5d9e34b628",
    "price": 99.00,
    "pass_series": {
      "prevent_overlaps": true,
      "seat_cap": 50,
      "presale_hours": 48,
      "window_ids": ["3d5a8c72-b016-4e94-8fa7-61c209d4e738", "9c1f4e27-5a8b-4d63-b2e0-8f7a6c5d4e31"],
      "rules": [
        { "source_plan_id": "0b8e6a2f-4c1d-4e3a-9f52-7d6c1b2a3e45", "kind": "date_range", "from_at": "2026-09-01T00:00:00Z", "to_at": "2026-12-01T00:00:00Z" }
      ]
    }
  }'
```

> **`resources` is optional on a series only.** Every other kind must link at least one resource, or a purchase buys nothing. A series is the exception: each of its windows grants **that window's own plan's** resources, so a series with none still delivers exactly what was sold. Anything you do link here is a **lounge**, open for the whole span.

> **Never put a slate window's resource in a series `resources`.** A lounge is granted **at purchase with no window** and kept until the season ends. Send a resource that one of your slate windows already opens and every holder is handed it permanently the moment they pay: the dates it was scheduled for stop gating anything, and a season ticket becomes a permanent key to that channel. The API accepts it, because a genuinely permanent room is a legitimate thing to sell. It is simply almost never what was meant. Keep `resources` for a holders-only room nothing on the slate opens; the slate's own channels are already granted by their own pass plans on their own dates. The dashboard warns when the two overlap. Over the API, checking is yours to do.

Rules keep working after the save: a matching window scheduled later is absorbed into the slate **and granted to everyone already holding the series**, at no charge. That emits [`pass_series.leg_added`](https://docs.subscriby.net/webhooks/v1/events/pass-series/pass-series-leg-added). Handpicked `window_ids` never grow on their own. The two compose; most real seasons use both.

### Validation

The field-by-field rules are on each request field below. The rules that cross fields:

- `name` must be unique within the project, compared without regard to case or surrounding spaces; a duplicate is refused on `name`.
- `price` must be at least the **$1.00 USD equivalent** in `currency_id`, converted at the current rate. Payment providers reject dust amounts, so anything below that is unbuyable and is refused; the error names the minimum in both the plan's currency and USD.
- `price` of exactly `0` publishes a **free plan**. Plans priced at zero can only be sold by a **Starter** or **Growth** account, never on Free: the platform fee is a share of what you charge, so a zero-priced plan earns nothing to share. On Free the call is refused on `price`. The rule enforced is that a plan may not be **simultaneously active and priced at `0`** on a creator whose plan cannot sell one, so an update that leaves a zero-priced plan off sale is allowed.
- `currency_id` must be supported by at least one active payment method on the project.
- At most one of `eligibility.newcomers_only`, `eligibility.customers_only` and `eligibility.churned_only` may be `true`.
- `resources` is required with at least one id, **except on `kind: pass_series`**, where it is optional and means a lounge.
- `billing.billing_cycle_count` must be `1` when `billing.billing_cycle` is `lifetime`; `billing.recurring` is refused as `true` when the currency is a crypto or platform currency.
- `pass.sales_cutoff_anchor: before_end` requires `pass.sales_cutoff_minutes` of at least `5` and under the shortest slot's `duration_minutes`, and is refused outright when that shortest slot is `5` minutes or less. `before_first_end` and `before_last_start` are **series-only** anchors and are rejected on a pass plan, where a lone window is both the first and the last.
- `pass_series.window_ids` needs **at least two** windows unless a rule will supply them; every id must belong to a pass plan on this project; with `prevent_overlaps` on, two windows that run at the same time are refused. `pass_series.rules[].take` is **required when `kind` is `next_n`**, because a count rule with no count is incomplete rather than "all of them". `pass_series.successor_plan_id` must be **another** `kind: pass_series` plan on the same project.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `kind` (one of `subscription`, `pass`, `pass_series`, required): What a purchase of a creator's plan actually buys. Plan shape had no discriminator before this. It was inferred from `pass_enabled` plus `recurring` plus `billing_cycle`, which is why a third shape kept falling through filters written as `where('pass_enabled', false)`: a boolean cannot express three things, so every query site had to remember which combination it meant and one of them always forgot. A `match` over this enum with no `default` is exhaustive, so a fourth shape later fails loudly at every site that has to care rather than silently taking whichever branch happened to be last. | | |---| | `subscription` <br/> Access starts at payment and runs on a billing cycle. | | `pass` <br/> One purchase buys one of the plan's own scheduled access windows. | | `pass_series` <br/> One purchase buys a curated slate of *other* plans' access windows. |
- `name` (string, required): The name buyers see, 5 to 255 characters, unique within the project without regard to case or surrounding spaces. Required on create.
- `description` (string): The pitch under the name, up to 1,000 characters. HTML is filtered to a safe subset before it is stored.
- `currency_id` (string, required): The id of a currency that at least one of the project's active payment methods can charge. Required on create.
- `price` (number, required): What one purchase costs: at least the $1.00 USD equivalent in `currency_id` at the current rate, or exactly `0` for a free plan, which only a Starter or Growth account may put on sale. Required on create.
- `active` (boolean): Whether the plan is on sale. Defaults to true on create; prefer the publish and unpublish endpoints to change it later.
- `sales_cap` (integer): Pause the plan after this many purchases, 1 to 100,000; null for no limit. Changing it restarts `sales_cap_sold` at 0.
- `eligibility` (object): Who may buy. At most one of the first three may be true, counting what the plan already holds on an update.
  - `newcomers_only` (boolean): Only members who never held a subscription on the project.
  - `customers_only` (boolean): Only members who currently hold one.
  - `churned_only` (boolean): Only members who held one and let it lapse.
  - `single_use` (boolean): Each member may buy the plan once.
  - `access_codes_only` (boolean): The plan cannot be bought, only granted by redeeming an access code.
- `resources` (array of string, required): Ids of the project's resources the plan grants: at least one, required on create, except on `kind: pass_series`, where it is optional and names a lounge open for the whole span. Omit on an update to keep the existing links.
- `billing` (object, required): Cycle, trial and renewal. Send it on `kind: subscription` only; on any other kind it is refused.
  - `billing_cycle` (one of `day`, `week`, `month`, `year`, `lifetime`, required): The unit a creator's own subscription plan renews in. Not the platform cycle: this is what a creator sells to their members, and it pairs with a count (`billing_cycle_count`) so "3 months" and "2 weeks" are both expressible. `Lifetime` is a one-time purchase that never renews.
  - `billing_cycle_count` (integer, required): How many cycles one period spans, 1 to 99; must be 1 when the cycle is `lifetime`. Required on create.
  - `recurring` (boolean): Whether the subscription renews itself. Refused as true when the currency is a crypto or platform currency.
  - `disabled_renewal` (boolean): Charge once, then lapse at the end of the period instead of renewing.
  - `trial_days` (integer): Free days before the first charge, 0 to 365.
  - `trial_cardless` (boolean): Whether the trial starts without a payment method on file.
  - `trial_type` (one of `project`, `plan`)
- `pass` (object): The plan's own dated schedule. Send it on `kind: pass` only; on any other kind it is refused.
  - `timezone` (one of `GMT`, `UTC`, `Africa/Abidjan`, `Africa/Accra`, `Africa/Bamako`, `Africa/Banjul`, `Africa/Bissau`, `Africa/Casablanca`, `Africa/Conakry`, `Africa/Dakar`, `Africa/El_Aaiun`, `Africa/Freetown`, `Africa/Lome`, `Africa/Monrovia`, `Africa/Nouakchott`, `Africa/Ouagadougou`, `Africa/Sao_Tome`, `Africa/Algiers`, `Africa/Bangui`, `Africa/Brazzaville`, `Africa/Ceuta`, `Africa/Douala`, `Africa/Kinshasa`, `Africa/Lagos`, `Africa/Libreville`, `Africa/Luanda`, `Africa/Malabo`, `Africa/Ndjamena`, `Africa/Niamey`, `Africa/Porto-Novo`, `Africa/Tunis`, `Africa/Blantyre`, `Africa/Bujumbura`, `Africa/Cairo`, `Africa/Gaborone`, `Africa/Harare`, `Africa/Johannesburg`, `Africa/Juba`, `Africa/Khartoum`, `Africa/Kigali`, `Africa/Lubumbashi`, `Africa/Lusaka`, `Africa/Maputo`, `Africa/Maseru`, `Africa/Mbabane`, `Africa/Tripoli`, `Africa/Windhoek`, `Africa/Addis_Ababa`, `Africa/Asmara`, `Africa/Dar_es_Salaam`, `Africa/Djibouti`, `Africa/Kampala`, `Africa/Mogadishu`, `Africa/Nairobi`, `America/Adak`, `America/Anchorage`, `America/Juneau`, `America/Metlakatla`, `America/Nome`, `America/Sitka`, `America/Yakutat`, `America/Los_Angeles`, `America/Tijuana`, `America/Boise`, `America/Cambridge_Bay`, `America/Ciudad_Juarez`, `America/Creston`, `America/Dawson`, `America/Dawson_Creek`, `America/Denver`, `America/Fort_Nelson`, `America/Hermosillo`, `America/Mazatlan`, `America/Phoenix`, `America/Vancouver`, `America/Whitehorse`, `America/Bahia_Banderas`, `America/Belize`, `America/Chicago`, `America/Chihuahua`, `America/Costa_Rica`, `America/Edmonton`, `America/El_Salvador`, `America/Guatemala`, `America/Indiana/Knox`, `America/Indiana/Tell_City`, `America/Inuvik`, `America/Managua`, `America/Matamoros`, `America/Menominee`, `America/Merida`, `America/Mexico_City`, `America/Monterrey`, `America/North_Dakota/Beulah`, `America/North_Dakota/Center`, `America/North_Dakota/New_Salem`, `America/Ojinaga`, `America/Rankin_Inlet`, `America/Regina`, `America/Resolute`, `America/Swift_Current`, `America/Tegucigalpa`, `America/Atikokan`, `America/Bogota`, `America/Cancun`, `America/Cayman`, `America/Detroit`, `America/Eirunepe`, `America/Grand_Turk`, `America/Guayaquil`, `America/Havana`, `America/Indiana/Indianapolis`, `America/Indiana/Marengo`, `America/Indiana/Petersburg`, `America/Indiana/Vevay`, `America/Indiana/Vincennes`, `America/Indiana/Winamac`, `America/Iqaluit`, `America/Jamaica`, `America/Kentucky/Louisville`, `America/Kentucky/Monticello`, `America/Lima`, `America/Nassau`, `America/New_York`, `America/Panama`, `America/Port-au-Prince`, `America/Rio_Branco`, `America/Toronto`, `America/Winnipeg`, `America/Anguilla`, `America/Antigua`, `America/Aruba`, `America/Barbados`, `America/Blanc-Sablon`, `America/Boa_Vista`, `America/Campo_Grande`, `America/Caracas`, `America/Cuiaba`, `America/Curacao`, `America/Dominica`, `America/Glace_Bay`, `America/Goose_Bay`, `America/Grenada`, `America/Guadeloupe`, `America/Guyana`, `America/Halifax`, `America/Kralendijk`, `America/La_Paz`, `America/Lower_Princes`, `America/Manaus`, `America/Marigot`, `America/Martinique`, `America/Moncton`, `America/Montserrat`, `America/Port_of_Spain`, `America/Porto_Velho`, `America/Puerto_Rico`, `America/Santo_Domingo`, `America/St_Barthelemy`, `America/St_Kitts`, `America/St_Lucia`, `America/St_Thomas`, `America/St_Vincent`, `America/Thule`, `America/Tortola`, `America/St_Johns`, `America/Araguaina`, `America/Argentina/Buenos_Aires`, `America/Argentina/Catamarca`, `America/Argentina/Cordoba`, `America/Argentina/Jujuy`, `America/Argentina/La_Rioja`, `America/Argentina/Mendoza`, `America/Argentina/Rio_Gallegos`, `America/Argentina/Salta`, `America/Argentina/San_Juan`, `America/Argentina/San_Luis`, `America/Argentina/Tucuman`, `America/Argentina/Ushuaia`, `America/Asuncion`, `America/Bahia`, `America/Belem`, `America/Cayenne`, `America/Coyhaique`, `America/Fortaleza`, `America/Maceio`, `America/Miquelon`, `America/Montevideo`, `America/Paramaribo`, `America/Punta_Arenas`, `America/Recife`, `America/Santarem`, `America/Santiago`, `America/Sao_Paulo`, `America/Noronha`, `America/Nuuk`, `America/Scoresbysund`, `America/Danmarkshavn`, `Antarctica/Palmer`, `Antarctica/Rothera`, `Antarctica/Troll`, `Antarctica/Syowa`, `Antarctica/Mawson`, `Antarctica/Vostok`, `Antarctica/Davis`, `Antarctica/Casey`, `Antarctica/DumontDUrville`, `Antarctica/Macquarie`, `Antarctica/McMurdo`, `Arctic/Longyearbyen`, `Asia/Beirut`, `Asia/Famagusta`, `Asia/Gaza`, `Asia/Hebron`, `Asia/Jerusalem`, `Asia/Nicosia`, `Asia/Aden`, `Asia/Amman`, `Asia/Baghdad`, `Asia/Bahrain`, `Asia/Damascus`, `Asia/Kuwait`, `Asia/Qatar`, `Asia/Riyadh`, `Asia/Tehran`, `Asia/Baku`, `Asia/Dubai`, `Asia/Muscat`, `Asia/Tbilisi`, `Asia/Yerevan`, `Asia/Kabul`, `Asia/Almaty`, `Asia/Aqtau`, `Asia/Aqtobe`, `Asia/Ashgabat`, `Asia/Atyrau`, `Asia/Dushanbe`, `Asia/Karachi`, `Asia/Oral`, `Asia/Qostanay`, `Asia/Qyzylorda`, `Asia/Samarkand`, `Asia/Tashkent`, `Asia/Yekaterinburg`, `Asia/Colombo`, `Asia/Kolkata`, `Asia/Kathmandu`, `Asia/Bishkek`, `Asia/Dhaka`, `Asia/Omsk`, `Asia/Thimphu`, `Asia/Urumqi`, `Asia/Yangon`, `Asia/Bangkok`, `Asia/Barnaul`, `Asia/Ho_Chi_Minh`, `Asia/Hovd`, `Asia/Jakarta`, `Asia/Krasnoyarsk`, `Asia/Novokuznetsk`, `Asia/Novosibirsk`, `Asia/Phnom_Penh`, `Asia/Pontianak`, `Asia/Tomsk`, `Asia/Vientiane`, `Asia/Brunei`, `Asia/Hong_Kong`, `Asia/Irkutsk`, `Asia/Kuala_Lumpur`, `Asia/Kuching`, `Asia/Macau`, `Asia/Makassar`, `Asia/Manila`, `Asia/Shanghai`, `Asia/Singapore`, `Asia/Taipei`, `Asia/Ulaanbaatar`, `Asia/Chita`, `Asia/Dili`, `Asia/Jayapura`, `Asia/Khandyga`, `Asia/Pyongyang`, `Asia/Seoul`, `Asia/Tokyo`, `Asia/Yakutsk`, `Asia/Ust-Nera`, `Asia/Vladivostok`, `Asia/Magadan`, `Asia/Sakhalin`, `Asia/Srednekolymsk`, `Asia/Anadyr`, `Asia/Kamchatka`, `Atlantic/Bermuda`, `Atlantic/Stanley`, `Atlantic/South_Georgia`, `Atlantic/Azores`, `Atlantic/Cape_Verde`, `Atlantic/Canary`, `Atlantic/Faroe`, `Atlantic/Madeira`, `Atlantic/Reykjavik`, `Atlantic/St_Helena`, `Australia/Perth`, `Australia/Eucla`, `Australia/Darwin`, `Australia/Brisbane`, `Australia/Lindeman`, `Australia/Adelaide`, `Australia/Broken_Hill`, `Australia/Hobart`, `Australia/Lord_Howe`, `Australia/Melbourne`, `Australia/Sydney`, `Europe/Dublin`, `Europe/Guernsey`, `Europe/Isle_of_Man`, `Europe/Jersey`, `Europe/Lisbon`, `Europe/London`, `Europe/Amsterdam`, `Europe/Andorra`, `Europe/Belgrade`, `Europe/Berlin`, `Europe/Bratislava`, `Europe/Brussels`, `Europe/Budapest`, `Europe/Busingen`, `Europe/Copenhagen`, `Europe/Gibraltar`, `Europe/Ljubljana`, `Europe/Luxembourg`, `Europe/Madrid`, `Europe/Malta`, `Europe/Monaco`, `Europe/Oslo`, `Europe/Paris`, `Europe/Podgorica`, `Europe/Prague`, `Europe/Rome`, `Europe/San_Marino`, `Europe/Sarajevo`, `Europe/Skopje`, `Europe/Stockholm`, `Europe/Tirane`, `Europe/Vaduz`, `Europe/Vatican`, `Europe/Vienna`, `Europe/Warsaw`, `Europe/Zagreb`, `Europe/Zurich`, `Europe/Athens`, `Europe/Bucharest`, `Europe/Chisinau`, `Europe/Helsinki`, `Europe/Kaliningrad`, `Europe/Kyiv`, `Europe/Mariehamn`, `Europe/Riga`, `Europe/Sofia`, `Europe/Tallinn`, `Europe/Vilnius`, `Europe/Istanbul`, `Europe/Kirov`, `Europe/Minsk`, `Europe/Moscow`, `Europe/Simferopol`, `Europe/Volgograd`, `Europe/Astrakhan`, `Europe/Samara`, `Europe/Saratov`, `Europe/Ulyanovsk`, `Indian/Antananarivo`, `Indian/Comoro`, `Indian/Mayotte`, `Indian/Mahe`, `Indian/Mauritius`, `Indian/Reunion`, `Indian/Kerguelen`, `Indian/Maldives`, `Indian/Chagos`, `Indian/Cocos`, `Indian/Christmas`, `Pacific/Midway`, `Pacific/Niue`, `Pacific/Pago_Pago`, `Pacific/Honolulu`, `Pacific/Rarotonga`, `Pacific/Tahiti`, `Pacific/Marquesas`, `Pacific/Gambier`, `Pacific/Pitcairn`, `Pacific/Galapagos`, `Pacific/Easter`, `Pacific/Palau`, `Pacific/Chuuk`, `Pacific/Guam`, `Pacific/Port_Moresby`, `Pacific/Saipan`, `Pacific/Bougainville`, `Pacific/Efate`, `Pacific/Guadalcanal`, `Pacific/Kosrae`, `Pacific/Noumea`, `Pacific/Pohnpei`, `Pacific/Fiji`, `Pacific/Funafuti`, `Pacific/Kwajalein`, `Pacific/Majuro`, `Pacific/Nauru`, `Pacific/Norfolk`, `Pacific/Tarawa`, `Pacific/Wake`, `Pacific/Wallis`, `Pacific/Apia`, `Pacific/Auckland`, `Pacific/Fakaofo`, `Pacific/Kanton`, `Pacific/Tongatapu`, `Pacific/Chatham`, `Pacific/Kiritimati`, `null`): The IANA zone the schedule is authored in. Legacy names are resolved, so `Asia/Calcutta` is stored as `Asia/Kolkata`. Required on create.
  - `schedule_mode` (any or null): `repeating` (the default) generates windows from `slots`; `fixed` takes explicitly dated `windows`.
  - `recurrence` (any or null): `daily`, `weekly` or `monthly`. Decides which slot fields apply.
  - `recurrence_ends_at` (string): When window generation stops; omit to keep generating.
  - `sales_cutoff_minutes` (integer): Stop sales this many minutes before the moment `sales_cutoff_anchor` names; omit to sell until the window begins. With `before_end` it must be at least 5 and under the shortest slot's `duration_minutes`.
  - `sales_cutoff_anchor` (one of `before_start`, `before_end`, `null`): `before_start` (the default) or `before_end`. `before_end` is refused when the shortest slot lasts 5 minutes or less. The series anchors `before_first_end` and `before_last_start` are refused on a pass.
  - `slots` (array of object): The repeating schedule, at most 60 slots. Sending it replaces the whole schedule and rebuilds unsold future windows; windows a customer has bought keep their times.
  - `windows` (array of object): Explicitly dated windows for `schedule_mode: fixed`, at most 200 per call. Added to the schedule, never replacing it.
- `pass_series` (object): The season ticket's slate, rules and seats. Send it on `kind: pass_series` only; on any other kind it is refused.
  - `prevent_overlaps` (boolean): Refuse a window that clashes with one already on the slate. Defaults to true.
  - `sales_cutoff_minutes` (integer): Stop sales this many minutes before the moment `sales_cutoff_anchor` names, measured against the whole season.
  - `sales_cutoff_anchor` (any or null): `before_start` (the default), `before_first_end`, `before_last_start` or `before_end`. `before_first_end` needs `sales_cutoff_minutes` of at least 5, so a buyer arriving late in the opening window is still admitted to it.
  - `seat_cap` (integer): How many holders may hold the season at once, at least 1; null for unlimited. Zero is refused: take the plan off sale with unpublish instead.
  - `presale_hours` (integer): How long the next season is offered to current holders only, 1 to 8760.
  - `successor_plan_id` (string): Another `kind: pass_series` plan on the same project to offer holders when this one finishes. A series cannot lead to itself.
  - `window_ids` (array of string): Ids of pass windows on this project to put on the slate, at most 120. A slate needs at least two unless a rule will supply them; with `prevent_overlaps` on, two that run at the same time are refused.
  - `blackout_window_ids` (array of string): Windows a rule matches but you want permanently excluded.
  - `rules` (array of object): Rules that keep absorbing matching windows into the slate, at most 20. A matching window scheduled later is added and granted to every current holder at no charge.


### POST `/v1/projects/{project}/plans/order`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/plans/order \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"plan_ids": ["c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b", "b1a7c3d5-2e48-4f60-9a1b-7c5d3e820f94"]}'
```

Pins the order plans appear in on the public portal and in the bot; `plan_ids` is every plan you want pinned, first to last. Plans left out keep the built-in order (passes, then seasons, then subscriptions, cheapest first) after the pinned ones. Send an empty `plan_ids` to clear every pin. Answers `200` with the project's active plans in their new order, each in the same shape as a read, with `position` set on the pinned ones. The same list produces the same order and one `plan.order_changed` event per call.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `plan_ids` (array of string, required): Plan ids in storefront order, at most 200, each a plan of this project and none repeated. An empty list clears every pin.


### DELETE `/v1/projects/{project}/plans/{plan}`

Removes the plan and emits `plan.deleted` with a snapshot taken before the row disappears. Members who already hold it keep their access until it runs out; to stop selling while keeping the plan on the books, unpublish it instead. A pass or series plan is refused while a customer still holds an unfinished window on it, because deleting it would cascade away access that was paid for.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan` (path, string, required): The plan, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/plans/{plan}`

One plan in the same discriminated shape as the list. `kind` names the one block the plan carries, `billing`, `pass` or `pass_series`; the other two are absent. A plan of another project is `404 RESOURCE_NOT_FOUND`, because `{plan}` is resolved within `{project}`.

### Common fields

Present on every kind.

| Field         | Type   | Notes                                                                                                                                                                       |
| ------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`        | string | `subscription`, `pass` or `pass_series`. Names the one block below it.                                                                                                      |
| `price`       | string | What **one purchase** costs. On a pass that buys one window; on a series it buys the whole slate, once.                                                                    |
| `currency`    | object | `{ id, iso, symbol }`.                                                                                                                                                      |
| `cadence`     | string | The human-readable duration string: `"Per Month"`, `"Per 3 Hours"`, `"For all 10 passes"`.                                                                                |
| `eligibility` | object | Audience restrictions. The first three are mutually exclusive.                                                                                                              |
| `resources`   | array  | Present when the relation is loaded: each resource's `id`, `name`, `kind` (`manual` or `connector:kind`) and `connector`. On a series these are the **lounge**, not the thing being sold. |

> **Why `cadence` exists.** Both the portal and the bot already compute exactly this string, and every integrator without it reinvents it, wrongly for a dated plan, printing "1 Month" beside a three-hour window. Use it rather than deriving a duration from the cycle fields.

### kind: subscription

| Field                         | Type    | Notes                                                 |
| ----------------------------- | ------- | ----------------------------------------------------- |
| `billing.billing_cycle`       | string  | `day`, `week`, `month`, `year`, `lifetime`.           |
| `billing.billing_cycle_count` | integer | 1–99. Must be `1` when `billing_cycle` is `lifetime`. |
| `billing.recurring`           | boolean | Rejected as `true` for crypto or platform currencies. |
| `billing.disabled_renewal`    | boolean | Charges once, then lapses rather than renewing.       |
| `billing.trial_days`          | integer | 0–365.                                                |
| `billing.trial_cardless`      | boolean | Whether the trial starts without a payment method.    |
| `billing.trial_type`          | string  | `project` or `plan`: whose trial rule applies.        |

### kind: pass

A plan that owns its own dated windows and sells one per purchase.

| Field                           | Type              | Notes                                                                                                                                                                       |
| ------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pass.timezone`                 | string            | IANA zone the schedule was authored in. Render window times in this, never UTC.                                                                                             |
| `pass.schedule_mode`            | string            | `repeating` or `fixed`.                                                                                                                                                     |
| `pass.recurrence`               | string \| null    | `daily`, `weekly` or `monthly`. Null in `fixed` mode.                                                                                                                       |
| `pass.recurrence_ends_at`       | timestamp \| null | When window generation stops. **Renamed**, see the note below.                                                                                                              |
| `pass.sales_cutoff_minutes`     | integer \| null   | Stops sales this many minutes before the moment `sales_cutoff_anchor` names.                                                                                                |
| `pass.sales_cutoff_anchor`      | string            | `before_start` or `before_end`. Never null: a plan that never set it reads as `before_start`. `before_first_end` and `before_last_start` are series-only and refused here. |
| `pass.slots[].start_time`       | string `HH:MM`    | Local wall-clock time in `timezone`.                                                                                                                                        |
| `pass.slots[].duration_minutes` | integer           | Each slot carries its own length, so one plan can mix a 3-hour and a 14-hour window.                                                                                        |
| `pass.upcoming_windows[]`       | array             | Present only when the relation is loaded. Timestamps are **UTC**. The pass windows endpoints list and manage a plan's dates.                                              |

> **`series_ends_at` was renamed to `recurrence_ends_at`.** Same field, same meaning: how long this plan keeps generating windows from its recurrence. It never had anything to do with a Pass Series, but now that a series is a real plan kind, a field called `series_ends_at` sitting on a pass read as "when this plan's series ends", which is a different thing and one that does not exist here. Update any reader to the new key; there is no alias.

### kind: pass_series

A season ticket. It **owns no windows**: it points at windows that already exist on your pass plans, which is the whole distinction from `kind: pass`.

| Field                                 | Type              | Notes                                                                                                                                                                                                                                                                                                |
| ------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pass_series.timezone`                | string            | Borrowed from the source plans; a series has no zone of its own. A series whose sources disagree is refused at authoring time.                                                                                                                                                                      |
| `pass_series.prevent_overlaps`        | boolean           | Refuses to absorb a window clashing with one already on the slate.                                                                                                                                                                                                                                   |
| `pass_series.sales_cutoff_minutes`    | integer           | Measured against the **whole season**, not one window.                                                                                                                                                                                                                                               |
| `pass_series.sales_cutoff_anchor`     | string            | Four anchors, earliest deadline first. `before_start` closes before the **first** window opens. `before_first_end` closes during that opening window. `before_last_start` closes as the **last** window opens, so a buyer always gets one whole window. `before_end` closes as the last window ends. |
| `pass_series.seat_cap`                | integer \| null   | Concurrent holder limit. `null` is unlimited.                                                                                                                                                                                                                                                        |
| `pass_series.seats_taken`             | integer           | Holders currently counted against the cap.                                                                                                                                                                                                                                                           |
| `pass_series.seats_remaining`         | integer \| null   | `null` when uncapped.                                                                                                                                                                                                                                                                                |
| `pass_series.starts_at`               | timestamp \| null | First window's start, **UTC**.                                                                                                                                                                                                                                                                       |
| `pass_series.ends_at`                 | timestamp \| null | Last window's end, UTC.                                                                                                                                                                                                                                                                              |
| `pass_series.window_count`            | integer           | Slate length. Capped at **120**.                                                                                                                                                                                                                                                                     |
| `pass_series.successor_plan_id`       | string \| null    | The next season, offered to holders first when this one finishes.                                                                                                                                                                                                                                    |
| `pass_series.presale_hours`           | integer \| null   | How long that offer is held for holders only. 1–8760.                                                                                                                                                                                                                                                |
| `pass_series.windows[]`               | array             | The slate. Each entry names the **plan the window belongs to**; a series can mix several.                                                                                                                                                                                                            |
| `pass_series.windows[].added_by_rule` | boolean           | `true` when a rule absorbed it rather than the creator picking it by hand.                                                                                                                                                                                                                           |
| `pass_series.rules[]`                 | array             | Automatic inclusion rules. `kind` is `date_range` or `next_n`; `take` is required on `next_n`.                                                                                                                                                                                                       |
| `pass_series.blackout_window_ids`     | array             | Windows a rule matches but the creator has permanently excluded.                                                                                                                                                                                                                                     |

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan` (path, string, required): The plan, resolved within the project by the route binder.


### PATCH `/v1/projects/{project}/plans/{plan}`

The same discriminated shape as create, with every field optional. Omit `kind` to keep the plan's current kind; a block you send must match it. Where a cross-field rule needs a value you did not send, the billing cycle behind a lifetime count check, the currency behind the price floor, the eligibility flags behind the exclusivity check, the plan's stored value stands in, so a partial update is validated against the plan it will actually produce.

- `resources` is optional; omitting it preserves the existing links, sending it replaces them.
- Every update of a plan on sale queues its push to the payment methods that keep a product catalogue, so a changed price or name reaches Stripe, PayPal, CoinPayments and Razorpay within a minute.
- `sales_cap` may be set, raised, lowered or cleared with `null`; any change restarts `sales_cap_sold` at `0`.
- `pass.slots` **replaces** the whole schedule and rebuilds unsold future windows; `pass.windows` **adds** dated windows and never replaces.
- Setting an active plan's `price` to `0` on a Free account is refused; editing a zero-priced plan that is **off sale** is allowed on any account.
- `sales_cap_sold`, `position` and `paused` are read-only.

Answers `200` with the whole plan after the change.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan` (path, string, required): The plan, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `kind` (one of `subscription`, `pass`, `pass_series`): What a purchase of a creator's plan actually buys. Plan shape had no discriminator before this. It was inferred from `pass_enabled` plus `recurring` plus `billing_cycle`, which is why a third shape kept falling through filters written as `where('pass_enabled', false)`: a boolean cannot express three things, so every query site had to remember which combination it meant and one of them always forgot. A `match` over this enum with no `default` is exhaustive, so a fourth shape later fails loudly at every site that has to care rather than silently taking whichever branch happened to be last. | | |---| | `subscription` <br/> Access starts at payment and runs on a billing cycle. | | `pass` <br/> One purchase buys one of the plan's own scheduled access windows. | | `pass_series` <br/> One purchase buys a curated slate of *other* plans' access windows. |
- `name` (string): The name buyers see, 5 to 255 characters, unique within the project without regard to case or surrounding spaces. Required on create.
- `description` (string): The pitch under the name, up to 1,000 characters. HTML is filtered to a safe subset before it is stored.
- `currency_id` (string): The id of a currency that at least one of the project's active payment methods can charge. Required on create.
- `price` (number): What one purchase costs: at least the $1.00 USD equivalent in `currency_id` at the current rate, or exactly `0` for a free plan, which only a Starter or Growth account may put on sale. Required on create.
- `active` (boolean): Whether the plan is on sale. Defaults to true on create; prefer the publish and unpublish endpoints to change it later.
- `sales_cap` (integer): Pause the plan after this many purchases, 1 to 100,000; null for no limit. Changing it restarts `sales_cap_sold` at 0.
- `eligibility` (object): Who may buy. At most one of the first three may be true, counting what the plan already holds on an update.
  - `newcomers_only` (boolean): Only members who never held a subscription on the project.
  - `customers_only` (boolean): Only members who currently hold one.
  - `churned_only` (boolean): Only members who held one and let it lapse.
  - `single_use` (boolean): Each member may buy the plan once.
  - `access_codes_only` (boolean): The plan cannot be bought, only granted by redeeming an access code.
- `resources` (array of string): Ids of the project's resources the plan grants: at least one, required on create, except on `kind: pass_series`, where it is optional and names a lounge open for the whole span. Omit on an update to keep the existing links.
- `billing` (object): Cycle, trial and renewal. Send it on `kind: subscription` only; on any other kind it is refused.
  - `billing_cycle` (one of `day`, `week`, `month`, `year`, `lifetime`): The unit a creator's own subscription plan renews in. Not the platform cycle: this is what a creator sells to their members, and it pairs with a count (`billing_cycle_count`) so "3 months" and "2 weeks" are both expressible. `Lifetime` is a one-time purchase that never renews.
  - `billing_cycle_count` (integer): How many cycles one period spans, 1 to 99; must be 1 when the cycle is `lifetime`. Required on create.
  - `recurring` (boolean): Whether the subscription renews itself. Refused as true when the currency is a crypto or platform currency.
  - `disabled_renewal` (boolean): Charge once, then lapse at the end of the period instead of renewing.
  - `trial_days` (integer): Free days before the first charge, 0 to 365.
  - `trial_cardless` (boolean): Whether the trial starts without a payment method on file.
  - `trial_type` (one of `project`, `plan`)
- `pass` (object): The plan's own dated schedule. Send it on `kind: pass` only; on any other kind it is refused.
  - `timezone` (one of `GMT`, `UTC`, `Africa/Abidjan`, `Africa/Accra`, `Africa/Bamako`, `Africa/Banjul`, `Africa/Bissau`, `Africa/Casablanca`, `Africa/Conakry`, `Africa/Dakar`, `Africa/El_Aaiun`, `Africa/Freetown`, `Africa/Lome`, `Africa/Monrovia`, `Africa/Nouakchott`, `Africa/Ouagadougou`, `Africa/Sao_Tome`, `Africa/Algiers`, `Africa/Bangui`, `Africa/Brazzaville`, `Africa/Ceuta`, `Africa/Douala`, `Africa/Kinshasa`, `Africa/Lagos`, `Africa/Libreville`, `Africa/Luanda`, `Africa/Malabo`, `Africa/Ndjamena`, `Africa/Niamey`, `Africa/Porto-Novo`, `Africa/Tunis`, `Africa/Blantyre`, `Africa/Bujumbura`, `Africa/Cairo`, `Africa/Gaborone`, `Africa/Harare`, `Africa/Johannesburg`, `Africa/Juba`, `Africa/Khartoum`, `Africa/Kigali`, `Africa/Lubumbashi`, `Africa/Lusaka`, `Africa/Maputo`, `Africa/Maseru`, `Africa/Mbabane`, `Africa/Tripoli`, `Africa/Windhoek`, `Africa/Addis_Ababa`, `Africa/Asmara`, `Africa/Dar_es_Salaam`, `Africa/Djibouti`, `Africa/Kampala`, `Africa/Mogadishu`, `Africa/Nairobi`, `America/Adak`, `America/Anchorage`, `America/Juneau`, `America/Metlakatla`, `America/Nome`, `America/Sitka`, `America/Yakutat`, `America/Los_Angeles`, `America/Tijuana`, `America/Boise`, `America/Cambridge_Bay`, `America/Ciudad_Juarez`, `America/Creston`, `America/Dawson`, `America/Dawson_Creek`, `America/Denver`, `America/Fort_Nelson`, `America/Hermosillo`, `America/Mazatlan`, `America/Phoenix`, `America/Vancouver`, `America/Whitehorse`, `America/Bahia_Banderas`, `America/Belize`, `America/Chicago`, `America/Chihuahua`, `America/Costa_Rica`, `America/Edmonton`, `America/El_Salvador`, `America/Guatemala`, `America/Indiana/Knox`, `America/Indiana/Tell_City`, `America/Inuvik`, `America/Managua`, `America/Matamoros`, `America/Menominee`, `America/Merida`, `America/Mexico_City`, `America/Monterrey`, `America/North_Dakota/Beulah`, `America/North_Dakota/Center`, `America/North_Dakota/New_Salem`, `America/Ojinaga`, `America/Rankin_Inlet`, `America/Regina`, `America/Resolute`, `America/Swift_Current`, `America/Tegucigalpa`, `America/Atikokan`, `America/Bogota`, `America/Cancun`, `America/Cayman`, `America/Detroit`, `America/Eirunepe`, `America/Grand_Turk`, `America/Guayaquil`, `America/Havana`, `America/Indiana/Indianapolis`, `America/Indiana/Marengo`, `America/Indiana/Petersburg`, `America/Indiana/Vevay`, `America/Indiana/Vincennes`, `America/Indiana/Winamac`, `America/Iqaluit`, `America/Jamaica`, `America/Kentucky/Louisville`, `America/Kentucky/Monticello`, `America/Lima`, `America/Nassau`, `America/New_York`, `America/Panama`, `America/Port-au-Prince`, `America/Rio_Branco`, `America/Toronto`, `America/Winnipeg`, `America/Anguilla`, `America/Antigua`, `America/Aruba`, `America/Barbados`, `America/Blanc-Sablon`, `America/Boa_Vista`, `America/Campo_Grande`, `America/Caracas`, `America/Cuiaba`, `America/Curacao`, `America/Dominica`, `America/Glace_Bay`, `America/Goose_Bay`, `America/Grenada`, `America/Guadeloupe`, `America/Guyana`, `America/Halifax`, `America/Kralendijk`, `America/La_Paz`, `America/Lower_Princes`, `America/Manaus`, `America/Marigot`, `America/Martinique`, `America/Moncton`, `America/Montserrat`, `America/Port_of_Spain`, `America/Porto_Velho`, `America/Puerto_Rico`, `America/Santo_Domingo`, `America/St_Barthelemy`, `America/St_Kitts`, `America/St_Lucia`, `America/St_Thomas`, `America/St_Vincent`, `America/Thule`, `America/Tortola`, `America/St_Johns`, `America/Araguaina`, `America/Argentina/Buenos_Aires`, `America/Argentina/Catamarca`, `America/Argentina/Cordoba`, `America/Argentina/Jujuy`, `America/Argentina/La_Rioja`, `America/Argentina/Mendoza`, `America/Argentina/Rio_Gallegos`, `America/Argentina/Salta`, `America/Argentina/San_Juan`, `America/Argentina/San_Luis`, `America/Argentina/Tucuman`, `America/Argentina/Ushuaia`, `America/Asuncion`, `America/Bahia`, `America/Belem`, `America/Cayenne`, `America/Coyhaique`, `America/Fortaleza`, `America/Maceio`, `America/Miquelon`, `America/Montevideo`, `America/Paramaribo`, `America/Punta_Arenas`, `America/Recife`, `America/Santarem`, `America/Santiago`, `America/Sao_Paulo`, `America/Noronha`, `America/Nuuk`, `America/Scoresbysund`, `America/Danmarkshavn`, `Antarctica/Palmer`, `Antarctica/Rothera`, `Antarctica/Troll`, `Antarctica/Syowa`, `Antarctica/Mawson`, `Antarctica/Vostok`, `Antarctica/Davis`, `Antarctica/Casey`, `Antarctica/DumontDUrville`, `Antarctica/Macquarie`, `Antarctica/McMurdo`, `Arctic/Longyearbyen`, `Asia/Beirut`, `Asia/Famagusta`, `Asia/Gaza`, `Asia/Hebron`, `Asia/Jerusalem`, `Asia/Nicosia`, `Asia/Aden`, `Asia/Amman`, `Asia/Baghdad`, `Asia/Bahrain`, `Asia/Damascus`, `Asia/Kuwait`, `Asia/Qatar`, `Asia/Riyadh`, `Asia/Tehran`, `Asia/Baku`, `Asia/Dubai`, `Asia/Muscat`, `Asia/Tbilisi`, `Asia/Yerevan`, `Asia/Kabul`, `Asia/Almaty`, `Asia/Aqtau`, `Asia/Aqtobe`, `Asia/Ashgabat`, `Asia/Atyrau`, `Asia/Dushanbe`, `Asia/Karachi`, `Asia/Oral`, `Asia/Qostanay`, `Asia/Qyzylorda`, `Asia/Samarkand`, `Asia/Tashkent`, `Asia/Yekaterinburg`, `Asia/Colombo`, `Asia/Kolkata`, `Asia/Kathmandu`, `Asia/Bishkek`, `Asia/Dhaka`, `Asia/Omsk`, `Asia/Thimphu`, `Asia/Urumqi`, `Asia/Yangon`, `Asia/Bangkok`, `Asia/Barnaul`, `Asia/Ho_Chi_Minh`, `Asia/Hovd`, `Asia/Jakarta`, `Asia/Krasnoyarsk`, `Asia/Novokuznetsk`, `Asia/Novosibirsk`, `Asia/Phnom_Penh`, `Asia/Pontianak`, `Asia/Tomsk`, `Asia/Vientiane`, `Asia/Brunei`, `Asia/Hong_Kong`, `Asia/Irkutsk`, `Asia/Kuala_Lumpur`, `Asia/Kuching`, `Asia/Macau`, `Asia/Makassar`, `Asia/Manila`, `Asia/Shanghai`, `Asia/Singapore`, `Asia/Taipei`, `Asia/Ulaanbaatar`, `Asia/Chita`, `Asia/Dili`, `Asia/Jayapura`, `Asia/Khandyga`, `Asia/Pyongyang`, `Asia/Seoul`, `Asia/Tokyo`, `Asia/Yakutsk`, `Asia/Ust-Nera`, `Asia/Vladivostok`, `Asia/Magadan`, `Asia/Sakhalin`, `Asia/Srednekolymsk`, `Asia/Anadyr`, `Asia/Kamchatka`, `Atlantic/Bermuda`, `Atlantic/Stanley`, `Atlantic/South_Georgia`, `Atlantic/Azores`, `Atlantic/Cape_Verde`, `Atlantic/Canary`, `Atlantic/Faroe`, `Atlantic/Madeira`, `Atlantic/Reykjavik`, `Atlantic/St_Helena`, `Australia/Perth`, `Australia/Eucla`, `Australia/Darwin`, `Australia/Brisbane`, `Australia/Lindeman`, `Australia/Adelaide`, `Australia/Broken_Hill`, `Australia/Hobart`, `Australia/Lord_Howe`, `Australia/Melbourne`, `Australia/Sydney`, `Europe/Dublin`, `Europe/Guernsey`, `Europe/Isle_of_Man`, `Europe/Jersey`, `Europe/Lisbon`, `Europe/London`, `Europe/Amsterdam`, `Europe/Andorra`, `Europe/Belgrade`, `Europe/Berlin`, `Europe/Bratislava`, `Europe/Brussels`, `Europe/Budapest`, `Europe/Busingen`, `Europe/Copenhagen`, `Europe/Gibraltar`, `Europe/Ljubljana`, `Europe/Luxembourg`, `Europe/Madrid`, `Europe/Malta`, `Europe/Monaco`, `Europe/Oslo`, `Europe/Paris`, `Europe/Podgorica`, `Europe/Prague`, `Europe/Rome`, `Europe/San_Marino`, `Europe/Sarajevo`, `Europe/Skopje`, `Europe/Stockholm`, `Europe/Tirane`, `Europe/Vaduz`, `Europe/Vatican`, `Europe/Vienna`, `Europe/Warsaw`, `Europe/Zagreb`, `Europe/Zurich`, `Europe/Athens`, `Europe/Bucharest`, `Europe/Chisinau`, `Europe/Helsinki`, `Europe/Kaliningrad`, `Europe/Kyiv`, `Europe/Mariehamn`, `Europe/Riga`, `Europe/Sofia`, `Europe/Tallinn`, `Europe/Vilnius`, `Europe/Istanbul`, `Europe/Kirov`, `Europe/Minsk`, `Europe/Moscow`, `Europe/Simferopol`, `Europe/Volgograd`, `Europe/Astrakhan`, `Europe/Samara`, `Europe/Saratov`, `Europe/Ulyanovsk`, `Indian/Antananarivo`, `Indian/Comoro`, `Indian/Mayotte`, `Indian/Mahe`, `Indian/Mauritius`, `Indian/Reunion`, `Indian/Kerguelen`, `Indian/Maldives`, `Indian/Chagos`, `Indian/Cocos`, `Indian/Christmas`, `Pacific/Midway`, `Pacific/Niue`, `Pacific/Pago_Pago`, `Pacific/Honolulu`, `Pacific/Rarotonga`, `Pacific/Tahiti`, `Pacific/Marquesas`, `Pacific/Gambier`, `Pacific/Pitcairn`, `Pacific/Galapagos`, `Pacific/Easter`, `Pacific/Palau`, `Pacific/Chuuk`, `Pacific/Guam`, `Pacific/Port_Moresby`, `Pacific/Saipan`, `Pacific/Bougainville`, `Pacific/Efate`, `Pacific/Guadalcanal`, `Pacific/Kosrae`, `Pacific/Noumea`, `Pacific/Pohnpei`, `Pacific/Fiji`, `Pacific/Funafuti`, `Pacific/Kwajalein`, `Pacific/Majuro`, `Pacific/Nauru`, `Pacific/Norfolk`, `Pacific/Tarawa`, `Pacific/Wake`, `Pacific/Wallis`, `Pacific/Apia`, `Pacific/Auckland`, `Pacific/Fakaofo`, `Pacific/Kanton`, `Pacific/Tongatapu`, `Pacific/Chatham`, `Pacific/Kiritimati`, `null`): The IANA zone the schedule is authored in. Legacy names are resolved, so `Asia/Calcutta` is stored as `Asia/Kolkata`. Required on create.
  - `schedule_mode` (any or null): `repeating` (the default) generates windows from `slots`; `fixed` takes explicitly dated `windows`.
  - `recurrence` (any or null): `daily`, `weekly` or `monthly`. Decides which slot fields apply.
  - `recurrence_ends_at` (string): When window generation stops; omit to keep generating.
  - `sales_cutoff_minutes` (integer): Stop sales this many minutes before the moment `sales_cutoff_anchor` names; omit to sell until the window begins. With `before_end` it must be at least 5 and under the shortest slot's `duration_minutes`.
  - `sales_cutoff_anchor` (one of `before_start`, `before_end`, `null`): `before_start` (the default) or `before_end`. `before_end` is refused when the shortest slot lasts 5 minutes or less. The series anchors `before_first_end` and `before_last_start` are refused on a pass.
  - `slots` (array of object): The repeating schedule, at most 60 slots. Sending it replaces the whole schedule and rebuilds unsold future windows; windows a customer has bought keep their times.
  - `windows` (array of object): Explicitly dated windows for `schedule_mode: fixed`, at most 200 per call. Added to the schedule, never replacing it.
- `pass_series` (object): The season ticket's slate, rules and seats. Send it on `kind: pass_series` only; on any other kind it is refused.
  - `prevent_overlaps` (boolean): Refuse a window that clashes with one already on the slate. Defaults to true.
  - `sales_cutoff_minutes` (integer): Stop sales this many minutes before the moment `sales_cutoff_anchor` names, measured against the whole season.
  - `sales_cutoff_anchor` (any or null): `before_start` (the default), `before_first_end`, `before_last_start` or `before_end`. `before_first_end` needs `sales_cutoff_minutes` of at least 5, so a buyer arriving late in the opening window is still admitted to it.
  - `seat_cap` (integer): How many holders may hold the season at once, at least 1; null for unlimited. Zero is refused: take the plan off sale with unpublish instead.
  - `presale_hours` (integer): How long the next season is offered to current holders only, 1 to 8760.
  - `successor_plan_id` (string): Another `kind: pass_series` plan on the same project to offer holders when this one finishes. A series cannot lead to itself.
  - `window_ids` (array of string): Ids of pass windows on this project to put on the slate, at most 120. A slate needs at least two unless a rule will supply them; with `prevent_overlaps` on, two that run at the same time are refused.
  - `blackout_window_ids` (array of string): Windows a rule matches but you want permanently excluded.
  - `rules` (array of object): Rules that keep absorbing matching windows into the slate, at most 20. A matching window scheduled later is added and granted to every current holder at no charge.


### POST `/v1/projects/{project}/plans/{plan}/publish`

Puts the plan on sale: `active` becomes `true`, `sales_cap_sold` restarts at `0`, and `plan.activated` fires. Publishing also queues the push of the plan to the payment methods that keep a product catalogue (Stripe, PayPal, CoinPayments, Razorpay), the same push a create or update of a plan on sale queues, so a plan created as a draft is sellable through them within a minute of going on sale. A plan that is already on sale is answered as it is and emits nothing. Answers `200` with the plan.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan` (path, string, required): The plan, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/plans/{plan}/successor`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/plans/$SERIES_PLAN/successor \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: $(uuidgen)"
```

The plan list's "start next season" button. For a `kind: pass_series` plan only: creates a **new** `pass_series` plan copied from the one named, its price, currency, description, eligibility, linked resources, overlap rule, sales cutoff and seat cap, with two deliberate differences: it is created **inactive**, and its slate is **empty**, because a season that went straight on sale with last year's dates would be selling something that has already happened. Rules are carried forward with their date bounds shifted by the length of the finished season; the slate itself and any blackouts are not, since both name windows that have run.

The old season's `successor_plan_id` is pointed at the new plan (and a presale window is set if the old season had none), which is what lets current holders be offered the next season first. Answers `201` with the new plan in the same discriminated shape as any other read and emits `plan.created` for it. Compose it with a `PATCH` (`pass_series.window_ids` or `pass_series.rules`) and put it on sale with publish.

> **Not idempotent across calls. Call it once per season.** Every call creates another plan, named after the source with a season number appended, and re-points the old season's successor at the newest one. Read the source plan first: if `pass_series.successor_plan_id` is already set, the next season exists. The `Idempotency-Key` protects a retry of the same call, not a second call with a new key.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan` (path, string, required): The finished season, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/plans/{plan}/unpublish`

Takes the plan off sale: `active` becomes `false` and `plan.deactivated` fires. Members who already joined keep their access; the plan stays fully editable and can be published again. A plan that is already off sale is answered as it is and emits nothing. Answers `200` with the plan.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan` (path, string, required): The plan, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


## `pass-windows`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/pass-windows` | `pass-window:view-any` | List a project's pass windows | `list_pass_windows` |
| GET | `/v1/projects/{project}/pass-windows/{window}` | `pass-window:view` | Get a pass window | `get_pass_window` |
| POST | `/v1/projects/{project}/pass-windows/{window}/cancel` | `pass-window:delete` | Cancel a pass window | `cancel_pass_window` |
| POST | `/v1/projects/{project}/pass-windows/{window}/remind` | `pass-window:update` | Remind a window's holders | `remind_pass_window_queue` |
| POST | `/v1/projects/{project}/plans/{plan}/pass-windows` | `pass-window:create` | Place a pass window by hand | `create_pass_window` |

### GET `/v1/projects/{project}/pass-windows`

```bash
curl "https://api.subscriby.net/v1/projects/$PROJECT_ID/pass-windows?status=scheduled&sellable_only=true" \
  -H "Authorization: Bearer <token>"
```

The project's windows across every pass plan, **soonest first**, 50 per page (`per_page` 1 to 100; `limit` is accepted as an alias). Filters are validated before they reach the query: an unknown status or a malformed date is a `422 VALIDATION_FAILED` naming the field, not an empty page.

> **The list also opens to `project-subscription-plan:view-any`.** The list shipped under the plan ability before the `pass-window:*` family had any surface, and it is what the n8n node and the MCP tool docs named. A token holding only `project-subscription-plan:view-any` therefore still satisfies the `pass-window:view-any` gate. Mint new tokens with the precise ability; the alias exists so old ones keep working.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan_id` (query, string or null): One pass plan of the project only.
- `status` (query, string): One state only: `scheduled`, `open`, `closed` or `canceled`. Anything else is refused.
- `from` (query, string or null): Only windows starting at or after this moment, ISO 8601.
- `to` (query, string or null): Only windows starting at or before this moment, ISO 8601.
- `sellable_only` (query, boolean): Keep only windows a buyer could still purchase.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 50.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### GET `/v1/projects/{project}/pass-windows/{window}`

One window, with `sellable` and `holders` resolved for it. A window is resolved **within the project**: a window id that belongs to another project, another team, or to nothing at all is a `404 RESOURCE_NOT_FOUND`, so an id's existence never leaks.

| Field              | Type    | Notes                                                                                                                                          |
| ------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `starts_at`        | string  | ISO 8601, **UTC**. Store this.                                                                                                                 |
| `ends_at`          | string  | ISO 8601, UTC.                                                                                                                                 |
| `timezone`         | string  | The IANA zone the plan's schedule was authored in. Render window times in this, never in UTC.                                                  |
| `local_range`      | string  | The same window as a person reads it, already in `timezone`: what the dashboard, the portal and the bot all print.                             |
| `duration_minutes` | integer | Derived from the two instants.                                                                                                                 |
| `status`           | string  | `scheduled`, `open`, `closed` or `canceled`. Set by the scheduler as the window's start and end pass; `canceled` only by an explicit cancel.   |
| `source`           | string  | `generated` from the plan's slots, or `manual` when placed by hand. Manual windows survive a schedule rebuild; generated ones are regenerated. |
| `sellable`         | boolean | Whether a buyer could purchase this window right now: the plan's sales cutoff, resolved for the whole page in one query rather than per row.   |
| `holders`          | integer | How many purchases currently hold the window.                                                                                                  |

> **Why both UTC and a local range.** A pass schedule is authored in the creator's zone and rendered in it everywhere else in the product. Returning only UTC would leave every consumer converting, and getting it wrong across a daylight-saving boundary. `starts_at` is for storing and comparing; `local_range` is for showing.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `window` (path, string, required): The window, resolved within the project with its holder count and sale flag.


### POST `/v1/projects/{project}/pass-windows/{window}/cancel`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/pass-windows/$WINDOW_ID/cancel \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

The body is optional. `series_holders` is the choice the dashboard's cancellation dialog asks for season-ticket holders: `substitute` (the default) moves them to the plan's next window on sale, keeping their season at the same length; `drop` removes the cancelled date from their season, leaves the rest standing and reports what the date was worth per holder. A weekly season always has a next date on sale, so without `drop` a day with no event hands its season-ticket holders a free date the following week while the single-date holders rightly roll forward. Single-date holders are always moved where a window is on sale.

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/pass-windows/$WINDOW_ID/cancel \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"series_holders": "drop"}'
```

By the time the response arrives every holder has been resettled, and `meta` says how:

| Tally          | What happened to those holders                                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rebound`      | Moved to the plan's next window on sale, and told so. Their invite links are re-issued ahead of the new window.                                                   |
| `refund_due`   | The schedule had nothing left to offer, so their pass was ended. Their message states what they paid and that the refund is the creator's decision.               |
| `legs_dropped` | Season-ticket holders who lost this one date and keep the rest of their series. Their message states what they paid, what the date was worth, and the same.        |

`meta.refunds` lists every holder the cancellation left owed a decision, one row each (a holder who paid nothing is settled and counted in the tallies but listed nowhere, since there is nothing to decide): the member's name, the `reason` (`stranded` or `leg_dropped`), `amount_paid` and `amount` (what the cancelled date was worth) with their `_formatted` twins in the holder's own currency, the `currency`, and `passes_remaining`. `meta.refund_totals` adds the rows up per currency. These are the figures the holders were told, so the creator reads the same number the member will ask about.

> **Subscriby never moves the refunds.** `refund_due`, `legs_dropped` and `refunds` are statements, not actions. The money stays where it is until the creator refunds it at the gateway. An integration that wants to act on them can read `meta.refunds` here, or subscribe to `pass.holder_stranded` and `pass_series.leg_dropped`, which carry the amount per holder.

Cancelling is a `POST` verb and not a `DELETE` on purpose: it resettles every holder, moving them on or ending their pass, which is far too consequential to read as removing a row. It also cannot be undone: the window keeps its start permanently, so the same instant can never be re-created on that plan.

Raises `pass.window_cancelled` carrying the tallies, plus one event per holder: `pass.holder_moved` or `pass.holder_stranded` for ordinary passes, `pass_series.leg_substituted` or `pass_series.leg_dropped` for season-ticket holders. A window that is already cancelled is answered `200` with every tally at zero, so a retry after a lost response changes nothing.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `window` (path, string, required): The window, resolved within the project.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `series_holders` (one of `substitute`, `drop`): What cancelling a date does to the season-ticket holders who hold it. A single-date holder is always moved to the plan's next date on sale, because their purchase was that one date. A season-ticket holder bought a slate, so the creator decides per cancellation whether the date is replaced, which keeps their season at the same length, or dropped, which leaves the rest of the season standing and states what the date was worth. A weekly season always has a next date on sale, so without the choice its holders could never be dropped: a day with no event handed them a free date the following week while the single-date holders rightly rolled forward.


### POST `/v1/projects/{project}/pass-windows/{window}/remind`

Nudges everyone who bought the window but has not yet joined, re-attaching their invite links. It is the panel's **Send Reminder** button; the automatic reminders a day and an hour before a window opens still run regardless.

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/pass-windows/$WINDOW_ID/remind \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

`reminded` is how many holders the **connector accepted** a message for, not how many were attempted: a holder who has blocked the bot is skipped without costing the rest their nudge. A window that has ended or been cancelled reminds nobody and answers `0` rather than refusing. No event fires: the reminder is a message on the connector, not a state change.

This messages real people. Do not repeat it within the same window, and to nudge one holder rather than a whole window use the [subscription remind endpoint](https://docs.subscriby.net/api/v1/reference/subscriptions/remind-a-pass-holder).

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `window` (path, string, required): The window, resolved within the project.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/plans/{plan}/pass-windows`

Places a window by hand on a `kind: pass` plan. This is how `schedule_mode: fixed` gets its dates, and how a repeating plan gets the one-off that does not fit its pattern.

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/plans/$PLAN_ID/pass-windows \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "starts_at": "2026-09-20 09:00",
    "duration_minutes": 180
  }'
```

Answers `201` with the new window: `status: scheduled`, `source: manual`, `holders: 0`. The request above and `"starts_at": "2026-09-20T09:00:00-04:00"` describe the same instant for a plan in `America/New_York`, and both come back as `"2026-09-20T13:00:00+00:00"`. Raises `pass.window_scheduled` with `source: manual`.

A manual window is never touched by regeneration: editing `pass.slots` on the plan rebuilds the generated windows and leaves this one where you put it. Every pass series with a rule is asked to look at the new date afterwards, so a matching series absorbs it as described on the [Plans](https://docs.subscriby.net/api/v1/reference/plans) page.

Each refusal below is a `422 VALIDATION_FAILED` naming the field, the same wording the dashboard's panel shows.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan` (path, string, required): The plan, resolved within the project.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `starts_at` (string, required): When access opens, ISO 8601. **A value with no offset is read as wall-clock time in the plan's `timezone`**, exactly as the dashboard authors it; a value with an offset or `Z` is the instant it names. Must be in the future, judged in the plan's own zone.
- `duration_minutes` (integer, required): How long the window lasts, a whole number of minutes, at least 1. The plan's configured floor and ceiling apply: 5 minutes and 30 days by default.

