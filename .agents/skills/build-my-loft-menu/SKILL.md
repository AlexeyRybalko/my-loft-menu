---
name: build-my-loft-menu
description: Build, review, or update the MY Loft mobile QR-menu landing page from its Figma design and project rules. Use for implementation, content architecture, interaction behavior, responsive mobile layout, menu accordions, sticky category navigation, promotional and decorative carousels, Google Sheets content sync, testing, or deployment work related to the MY Loft menu.
---

# Build MY Loft Menu

## Work from the source of truth

1. Read [references/product-spec.md](references/product-spec.md) before changing UI or behavior.
2. Read [references/content-model.md](references/content-model.md) before changing menu data, Google Sheets integration, or fallback content.
3. Inspect the current repository and preserve its framework, conventions, and user changes.
4. Use the linked Figma node as the visual source of truth when Figma access is available:
   `https://www.figma.com/design/iD19A1R6Jztg9r1Oht0nEu/MYLOFT-landing?node-id=678-4144`
5. If Figma cannot be read, do not invent exact dimensions, typography, assets, or spacing. Use existing code/assets when available; otherwise ask for an export or defer pixel-level decisions.

## Choose the implementation

- Preserve an existing stack when one exists.
- For a greenfield build, prefer Vite, React, and TypeScript. Keep the app client-only and componentize navigation, promo carousel, category accordion, decorative carousel, menu rows, and footer actions.
- Build for mobile viewport widths. Do not create a separate desktop layout. Keep the mobile canvas usable across common phone widths and center or constrain it on wider screens.
- Use semantic HTML, keyboard-operable controls, visible focus states, and reduced-motion handling.

## Work locally

- Use the repository at `https://github.com/AlexeyRybalko/my-loft-menu` as the shared source once it has been synchronized.
- For a fresh local checkout, install dependencies with `npm install`.
- Start the local preview with `npm run dev` and use the URL printed by Vite.
- Run `npm run lint`, `npm test`, and `npm run build` before publishing.
- Do not publish or change hosting/access settings unless the user explicitly asks.

## Implement content editing

- Prefer Google Sheets plus a small Google Apps Script JSON endpoint so ordinary menu edits do not require a rebuild or deployment.
- Keep `content/fallback.json` in the project with the last known-good menu. Validate remote data before rendering and fall back atomically when it is missing, malformed, or unavailable.
- Treat the public menu feed as public information. Never place credentials, private notes, or secrets in the sheet or client code.
- Keep image assets in the deployed project by default; store their stable paths in the sheet. Accept hosted image URLs only when the project explicitly supports them.
- Allow hiding rows with an `enabled` boolean and sorting with an integer `order` field. Never use physical row order as the only ordering rule.

## Implement interactions deterministically

- Model manual accordion toggles separately from category-navigation selection, but expose only one active navigation item at a time.
- On a navigation click: open the target if it is closed, preserve every other category's expanded state, wait for layout to settle, then scroll to the target with the sticky navigation offset applied.
- On a category-header click: toggle only that category and preserve the state of all other categories.
- On manual opening, make that category the active navigation item. While scrolling, update the single active item to the category crossing the observation line directly below the sticky navigation. Never highlight every open category.
- Keep the global header in normal document flow. Make only category navigation sticky, respecting `env(safe-area-inset-top)`.
- Implement promotion slides as an autoplaying, swipeable carousel with active dots.
- Implement category banners as autoplaying, non-interactive decorative slides without dots.
- Avoid layout jumps when slides change. Reserve each carousel's aspect ratio from the Figma design.

## Verify before handoff

- Test at 320, 360, 390, and 430 CSS-pixel viewport widths.
- Verify safe-area behavior, sticky navigation, offset scrolling, rapid repeated taps, multiple manually opened categories, and navigation-driven collapse.
- Verify one-slide and multiple-slide carousel cases, autoplay cleanup, swipe thresholds, reduced motion, and image loading failures.
- Verify remote content success, disabled rows, ordering, malformed remote data, empty categories, missing links, and fallback behavior.
- Run the repository's formatting, linting, type-checking, tests, and production build commands when available.
- Compare the final render with Figma at the target mobile width when Figma access is available.

## Ask only consequential questions

Ask before implementation when the answer changes architecture or observable behavior, especially:

- whether Google Sheets editing is wanted now or only prepared for later;
- which deployment target and existing framework must be used;
- how visually active footer actions should respond before their URLs are supplied.
