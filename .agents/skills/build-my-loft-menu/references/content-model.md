# Editable content model

## Recommended approach

Use a Google Sheet as the editor and a deployed Google Apps Script web app as a read-only JSON adapter. The browser fetches one normalized document at startup. Keep a checked-in fallback JSON document with the same schema.

This gives the owner simple row-based editing without rebuilding the site:

- uncheck `enabled` to remove an item;
- add a row with a unique id to add an item;
- change `order` to reorder content;
- edit text or price cells to update content.

The feed is public. Do not store confidential data in it.

## Workbook tabs

### `settings`

| key | value |
| --- | --- |
| tips_url | Empty until supplied |
| review_url | Empty until supplied |
| promo_interval_ms | 5000 |
| banner_interval_ms | 4500 |

### `promotions`

| id | order | enabled | image | alt | href |
| --- | ---: | --- | --- | --- | --- |
| promo-summer | 10 | TRUE | /images/promos/summer.webp | Летняя акция MY Loft | |

`href` is optional. Do not make a promotion clickable when it is empty.

### `categories`

| id | order | enabled | title | nav_label | icon | initially_open |
| --- | ---: | --- | --- | --- | --- | --- |
| hookah | 10 | TRUE | Кальяны | Кальяны | /icons/hookah.svg | FALSE |

Use stable ASCII ids. Changing a category id requires updating related rows.

### `banners`

| id | category_id | order | enabled | image | alt |
| --- | --- | ---: | --- | --- | --- |
| hookah-main | hookah | 10 | TRUE | /images/banners/hookah.webp | |

Use empty `alt` for decoration.

### `items`

| id | category_id | order | enabled | name | description | price | price_prefix | unit |
| --- | --- | ---: | --- | --- | --- | ---: | --- | --- |
| classic-hookah | hookah | 10 | TRUE | Классический | | 1000 | | ₽ |

- Keep `price` numeric when there is one base price.
- Use `price_prefix`, for example `от`, separately from the number.
- Do not type the currency into `price`.

### `variants`

Use this only for items with multiple sizes or options.

| id | item_id | order | enabled | label | amount | price | unit |
| --- | --- | ---: | --- | --- | --- | ---: | --- |
| cola-330 | cola | 10 | TRUE | Coca-Cola | 330 мл | 150 | ₽ |

## Normalized JSON shape

```json
{
  "version": 1,
  "updatedAt": "2026-07-11T12:00:00.000Z",
  "settings": {
    "tipsUrl": "",
    "reviewUrl": "",
    "promoIntervalMs": 5000,
    "bannerIntervalMs": 4500
  },
  "promotions": [],
  "categories": [
    {
      "id": "hookah",
      "order": 10,
      "title": "Кальяны",
      "navLabel": "Кальяны",
      "icon": "/icons/hookah.svg",
      "initiallyOpen": false,
      "banners": [],
      "items": []
    }
  ]
}
```

## Adapter and validation rules

- Trim strings and normalize booleans case-insensitively.
- Reject duplicate ids and orphaned `category_id` or `item_id` references.
- Filter disabled records before nesting them.
- Sort every collection numerically by `order`, then stably by id.
- Convert blank optional cells to `null` or the schema's empty default consistently.
- Return JSON with UTF-8 content and an explicit schema `version`.
- Validate fetched JSON in the client before committing it to UI state. Prefer a schema validator already present in the project; otherwise add a small explicit parser.
- If any required top-level structure is invalid, render the complete fallback document rather than mixing partial remote and fallback data.
- Show the last known-good content during network errors. Do not expose technical fetch errors to visitors.

## Images

Keep design images in the site's public assets by default and put paths in the sheet. This makes text and pricing easy to edit while keeping image delivery fast and predictable. If nontechnical image upload becomes a requirement, add a dedicated media service later instead of exposing editable cloud-drive share links directly.

## Update timing

Fetch fresh content when the page opens. Avoid a long service-worker or CDN cache for the JSON endpoint. A few minutes of upstream caching is acceptable, but provide an optional cache-busting query during administrative verification when immediate confirmation is needed.
