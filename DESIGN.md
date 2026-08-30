# Pond — design system

Audit of `filmmee` Figma (nodes 847:1086, 850:1522) and the corrected token set.

**Figma = layout, spacing, hierarchy, assets. This file = colour, type, radius, shadow. If they disagree, this file wins.**

---

## Part 1 — What's inconsistent in the Figma

### Typography: 4 font families, none of them your defined styles

| Where | Font in the file | Size |
|---|---|---|
| Search placeholder | 42dot Sans | 20px |
| Filter chips (ALL / ai art / vibe coding / music) | Inter | 18px |
| "Catch of the day", recast, card titles, card body | Inria Serif | 18px |
| Note title | Indie Flower | 24px |
| Note body | Indie Flower | 18px |
| "canvas mode" button | 42dot Sans | 18px |

Your Styles panel defines Plus Jakarta Sans (45/32/20/16/13.6), JetBrains Mono (32/16) and Impact (52). **None of those appear on these screens.** The styles exist but aren't applied.

### There is no type hierarchy

Almost everything is 18px. A catch card's **title** and its **body text** are the same size, same weight, and the same black. That's the main reason the cards read as a grey block instead of "headline + description."

### Colour: three unrelated accent families

- `#f3f3f3` — search bar, filter chips, **and the + button**
- `#f0f4ff` — catch card background (cool blue)
- `#ffd1a8` — recast pill (peach)
- `#e8e2d5` — mic / image / YouTube buttons (warm beige)
- `#000000` — every single piece of text

Blue-white, peach and beige don't belong to one palette. And the + button being the same grey as the search bar means your **primary action has no visual weight at all.**

One chip ("ai art") is `#444` while the others are pure black. That reads as an accident, not a selected state.

### Radii: six values doing three jobs

`12px`, `16px`, `20px`, `100px`, `113px`, `200px` — the last three are all just "pill."

### Shadows are too heavy for the concept

`0 4px 4px rgba(0,0,0,0.25)`, `0 4px 2px`, and `0 4px 10px rgba(0,0,0,0.25)` on the fish. Pure black at 25% is what makes the fish look like stickers pasted on the water rather than swimming in it.

### Layout errors

- Container is **1393px inside a 1440px frame** → 25px left gutter, 22px right. Asymmetric.
- Catch panel is **1381px** but the search bar above it is **1393px** → the two don't line up.
- Inside the panel, content is **1388px starting at x:1** within a 1381px parent → overflows by 8px.
- Card widths are **273.6000061035156px**. Decimals from a divide, not a decision.
- Note editor: title row is **1203px**, body row is **1558px**, toolbar is **1190px**. Three different widths, so the divider rules under them are three different lengths.
- Several frames sit at negative x (`-1`, `-2`, `-4`, `-6`).
- Borders are `0.1px`. Sub-pixel borders render unpredictably — some will vanish.
- **Two plus icons stacked on the FAB**: `Frame 1386` (97px circle + 40px ant-design:plus) and `akar-icons:circle-plus` (68px) at overlapping positions. One is a leftover.
- Expand button in the editor sits at x:1331 y:807 inside a 1030px-tall frame, detached from the toolbar it belongs to.

### Content problems

- Placeholder reads `Title : Add your original spark` — the literal word "Title :" will confuse. Just the prompt.
- Card body truncates mid-word: "…wearing a bright white shirt with a do".
- All five catch cards show the same "bubble dream" content.

### The Korean problem

**Indie Flower, Inter and Inria Serif have no Korean glyphs.** You're keeping all four Figma fonts, which is fine — but Korean text in them falls back to whatever the browser picks, and right now that's Roboto. Fix it by making 42dot Sans (which does have Korean, and is already in your file) the explicit fallback in every stack. Korean then renders in a font you chose, not a random system one.

---

## Part 2 — Corrected tokens

### Type — the four Figma fonts, kept

All four are on Google Fonts. 42dot Sans is the Korean fallback in every stack, so Korean never lands on a browser default.

```css
--font-display: 'Inria Serif', '42dot Sans', Georgia, serif;  /* headings, card text */
--font-hand:    'Indie Flower', '42dot Sans', cursive;        /* note title + body */
--font-ui:      'Inter', '42dot Sans', system-ui, sans-serif; /* chips, buttons */
--font-input:   '42dot Sans', system-ui, sans-serif;          /* search, inputs */
```

Drop Impact and Plus Jakarta Sans — they're defined in the Styles panel but used nowhere.

| Token | Size / weight | Family | Used for |
|---|---|---|---|
| `display` | 28px / 300 | `--font-display` | "Catch of the day" |
| `card-title` | 20px / 400 | `--font-display` | Catch card titles |
| `note-title` | 24px / 400 | `--font-hand` | Note title |
| `body` | 16px / 400 | `--font-hand` | Note body |
| `card-body` | 14px / 400 | `--font-display` | Catch card body |
| `label` | 14px / 400 | `--font-ui` | Chips, buttons |
| `input` | 16px / 400 | `--font-input` | Search field |

The families are exactly yours. The **sizes** are the fix — in the Figma nearly everything is 18px, so a card title and its body look identical. Card title at 20px and card body at 14px in `--ink-soft` is what separates them.

Metadata such as “43d untouched” uses `label` at `--ink-soft`. There is no caption / mono token.

### Colour

```css
--ink:        #1F2A28;  /* primary text — not pure black */
--ink-soft:   #667874;  /* secondary text, metadata */
--surface:    #FFFFFF;
--surface-2:  #F4F7F6;  /* cards, chips, inputs */
--line:       rgba(31,42,40,0.10);
--accent:     #E4652F;  /* koi vermilion — the ONLY accent */
--accent-soft:#FFD1A8;  /* your peach, now a tint of the accent */
--water-1:    #EAF4F0;
--water-2:    #C8E1DE;
--water-3:    #9BC7CC;
```

Retire `#f0f4ff` and `#e8e2d5`. Card backgrounds → `--surface-2`. Icon buttons → `--accent-soft`. The + button → `--accent`, so it's the one loud thing on the screen.

### Radius — three values

```css
--r-card: 12px;   /* cards, panels */
--r-input: 20px;  /* search bar, large surfaces */
--r-pill: 999px;  /* chips, buttons, FAB */
```

### Shadow — two values, tinted not black

```css
--shadow-sm: 0 2px 8px rgba(20,50,55,0.08);
--shadow-lg: 0 8px 24px rgba(20,50,55,0.12);
```

Fish get `--shadow-sm` only, and it should read as a shadow *on the water*, not a card lift.

### Spacing

`4 / 8 / 12 / 16 / 24 / 32`. No decimals, ever.

### Layout

- Page container: `max-width: 1392px`, `padding: 0 24px`, centred. Symmetric.
- Search bar, catch panel and pond all take the **same** container width.
- Catch cards: CSS grid, `gap: 16px`, `grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))`. Widths come out even, no magic numbers.
- Borders: `1px solid var(--line)`, never `0.1px`.
- FAB: one element, 72px, `--accent`, `--shadow-lg`. Delete the duplicate icon layer.

### Icons

Your icons are all Iconify sets — `fluent:mic-20-regular`, `clarity:image-gallery-line`, `ant-design:youtube-outlined`, `bi:search`, `ant-design:expand-alt-outlined`. Don't export them as SVGs. Install `@iconify/react` and reference the same names, so the code matches the design exactly and stays editable:

```jsx
import { Icon } from '@iconify/react';
<Icon icon="fluent:mic-20-regular" width={20} />
```

### Fish assets

The fish are real image fills in the file (`image 365`, `366`, `370`, `373`, `375`, `376`, `378`, `379`). Export them from Figma at 2x PNG with transparency, then convert to WebP in `/public/fish/`. Two things to fix on export:

1. **Remove the white fringing** on the cut-outs — visible on the red and pink fish. Re-mask, or the halo will show against the water on every screen.
2. Name them by species, not `image 373`: `koi-white.webp`, `goldfish-orange.webp`, `tang-blue.webp`, `betta-lilac.webp`.

The build uses directional pairs: `{species}-left.webp` / `{species}-right.webp`.

---

## Part 3 — Naming for the build

| Figma name | Component |
|---|---|
| Frame 1367 / 1368 | `PondScreen` |
| Frame 1319 | `CategorySidebar` |
| Frame 1377 | `SearchAndFilters` |
| Frame 1384 / 1400 | `CatchOfTheDay` |
| Frame 1388–1393 | `CatchCard` |
| Frame 1378 | `PondCanvas` |
| Frame 1386 | `CaptureButton` |
| Frame 1403 / 1406 | `NoteEditor` |
| Frame 1406 (inner) | `EditorToolbar` |

---

## Product rules (not in the Figma)

- One note type: title + body + board.
- Size = neglect (days since `acted_at`). Fresh notes sit at **0.44×**; at 90 days they reach **1.24×** (about 2.8× a new fish). Cap 90 days. Depth layers still recede, but a 90-day fish stays larger than a new one.
- Catch of the day: 3 most-neglected notes, 7+ days.
- Figma file: `https://www.figma.com/design/fXEzUMLn0cfW83m2YUoOoZ/filmmee`
  - Pond + catch: `847:1086`
  - Pond only: `850:1147`
  - Editor filled: `850:1522`
  - Editor empty: `850:1439`
