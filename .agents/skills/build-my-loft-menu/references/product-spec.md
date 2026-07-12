# MY Loft mobile QR-menu specification

## Purpose and scope

- Build a simple one-page menu for venue visitors arriving by QR code.
- Support mobile only; no separate desktop adaptation is required.
- Treat the latest approved Figma node `678:4144` in file `iD19A1R6Jztg9r1Oht0nEu` as the visual source of truth.
- Keep category and item quantities data-driven rather than hardcoded into component markup.

## Verified design source

- The exported master SVG and PDF use a 390 x 4107 canvas for node `678:4144`.
- Use the SVG as the exact geometry and style source. Use the PDF and PNG only for visual comparison.
- The verified font families are `Manrope` and `Montserrat Alternates`, with weights 200, 300, and 500 present in the SVG.
- Verified recurring colors include accent `#FFDF75`, panel `#131617`, muted `#6A6861`, border `#424142`, and page base `#0F0F0F`.
- Use the updated carousel archive as the source of truth. Most banners are 2139 x 735 pixels; tea banners are 2172 x 724 pixels. These sources are sufficient for 3x Retina delivery. Generate optimized responsive WebP or AVIF derivatives rather than shipping the multi-megabyte PNG originals directly.
- Use the updated high-resolution category PNG icons and generate optimized 2x or 3x display derivatives. Use the supplied 19 x 19 `Vector.svg` for the review star. Retain the MY Loft logo assets from the original icon archive because the updated icon archive contains category/action icons but not the logo files.
- Use the supplied `bg 1.png` stone texture as the page background source; its verified dimensions are 1443 x 2048 pixels.
- Do not stretch the texture to the full document height. Render it on a fixed full-viewport pseudo-element with preserved proportions (`background-size: cover; background-position: center`) so the content scrolls above a stable texture. Avoid `background-attachment: fixed` because of mobile Safari behavior.
- Darken the background non-destructively with a separate `#0F0F0F` overlay or an equivalent layered CSS gradient. Tune overlay opacity against the reference render rather than permanently editing the source image.
- Deliver an optimized WebP or AVIF derivative with PNG fallback when supported by the project; keep the original source unchanged.

## Page behavior

### Header and category navigation

- Let the header scroll out of view normally.
- Keep category navigation stuck to the top edge after it reaches it.
- Respect iPhone safe areas with `env(safe-area-inset-top)` plus the design's visual spacing.
- Mark the category chosen from navigation with a `#FFDF75` border.
- Keep exactly one navigation item active. Expanded state and active navigation state are different concepts; never highlight all expanded categories.
- When a category is opened manually, make its navigation item active. During ordinary scrolling, use scrollspy behavior to activate the category intersecting an observation line directly below the sticky navigation.
- If the active item is outside the horizontally scrollable navigation viewport, bring its button into view without moving the page vertically.
- On category-navigation activation:
  1. preserve every category's current expanded state;
  2. open the selected category if it is closed;
  3. scroll it into view beneath the sticky navigation;
  4. let scrollspy update the active navigation state from its position.
- Calculate the scroll target after accordion state has rendered. Prefer `scroll-margin-top` driven by a shared sticky-offset CSS variable; use measured scrolling only if necessary.

### Promotions

- Initially support one promotion but render from an array to support several.
- Autoplay when there is more than one promotion.
- Allow horizontal touch swiping.
- Show pagination dots and mark the active slide.
- Hide or reduce redundant controls when only one slide exists.
- Pause or simplify animation for `prefers-reduced-motion`.

### Category accordions

- Start categories collapsed unless the content configuration explicitly requests another initial state.
- Make the whole category header a real button with `aria-expanded` and `aria-controls`.
- Change the arrow indicator with expanded state.
- A direct category-header tap toggles only that category. Several categories may therefore remain open.
- A category-navigation click opens the chosen category without closing any other category.
- When multiple categories are open, show the thin `#FFDF75` divider prescribed by the design. Implement it without double-thick adjacent borders.
- Keep collapsed category headers reachable and avoid hiding them beneath the sticky navigation.

### Decorative category banners

- Each expanded category may have zero, one, or several banners.
- Autoplay and transition smoothly when several banners exist.
- Do not show dots, arrows, swipe behavior, pointer actions, or other interactive controls.
- Use `pointer-events: none` for purely decorative layers where appropriate.
- Preserve a stable aspect ratio and crop with `object-fit: cover` according to Figma.

### Menu items

- Render item names, descriptions, variants, volumes, and prices from structured data.
- Support a single price, a starting price such as `от 150 ₽`, and multiple named variants without encoding layout logic in the item title.
- Keep long names and prices legible on narrow phones. Do not let price columns force destructive wrapping of the item name.

### Footer actions

- Provide two actions: `Оставить чаевые` and `Написать отзыв`.
- Read their destinations from configuration because URLs are not yet available.
- Keep both controls visually active before URLs are supplied. Render them as buttons with no navigation rather than anchors with fake `#` destinations. Replace them with real external links when URLs are configured.

## State model

Keep these concerns distinct:

- `activeNavId`: the single category selected, manually opened, or currently detected by scrollspy;
- `openCategoryIds`: set of currently expanded categories;
- `promoIndex`: current interactive promotion;
- per-category decorative slide index, isolated by category id.

Manual category toggling must not implicitly close other categories. Navigation selection must add the target id to `openCategoryIds` when needed and preserve every other id.

When scrollspy observes more than one candidate, prefer the last category whose heading has crossed the observation line. Do not derive active state from membership in `openCategoryIds`.

## Accessibility and motion

- Use native buttons and anchors rather than clickable generic containers.
- Provide meaningful alternative text for informative promotions. Use empty alt text for purely decorative category banners.
- Ensure `#FFDF75` focus and active treatments have sufficient contrast on their background.
- Stop timers on unmount and avoid multiple timers after rerenders.
- Under reduced motion, disable autoplay or use immediate changes without sliding animation.

## Acceptance checklist

- Header leaves the viewport while category navigation remains sticky.
- Navigation click opens the target category, preserves other expanded categories, and scrolls to it at the correct offset.
- Manual category taps allow multiple open categories.
- Arrows and `aria-expanded` always match visual state.
- Promotions autoplay, swipe, and display correct dots.
- Decorative banners autoplay but ignore user input and show no dots.
- One-slide carousels do not run unnecessary timers.
- Footer links are configuration-driven.
- Exactly one navigation item is active even when several categories are expanded.
- Data edits do not require JSX/HTML edits.
