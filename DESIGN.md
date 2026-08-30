# Pond — design system

Audit of `filmmee` Figma (nodes 847:1086, 850:1522) and the corrected token set.

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

**Indie Flower has no Korean glyphs.** You'll write notes in Korean, and every Korean note will silently fall back to a system font — so half your notes look like a different app. Inter and Inria Serif have the same gap.

---

## Part 2 — Corrected tokens

### Type — two families

```css
--font-display: 'Inria Serif', Georgia, serif;   /* headings only */
--font-body: 'Pretendard', system-ui, sans-serif; /* everything else, Korean-safe */
--font-mono: 'JetBrains Mono', monospace;         /* day counts only */
```

Keep Inria Serif — the serif suits the koi concept. Replace Inter, 42dot Sans and Indie Flower with Pretendard (free, best Korean/Latin pairing available). Drop Impact.

| Token | Size / weight | Used for |
|---|---|---|
| `display` | 28px / 300 / serif | "Catch of the day" |
| `title` | 20px / 400 / serif | Note title, card titles |
| `body` | 16px / 400 | Note body, card body |
| `label` | 14px / 400 | Chips, buttons, search |
| `caption` | 12px / 400 / mono | "43d untouched", metadata |

Card title at `title`, card body at `body` in `--ink-soft`. That one change fixes the flat cards.

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

/* species — fills/marks for the four fish, not extra accents */
--species-koi-fill:      #F2F0EA;
--species-koi-mark:      #E4652F;
--species-tang-fill:     #4E86B8;
--species-tang-mark:     #F2C14E;
--species-betta-fill:    #CFC6EC;
--species-betta-mark:    #9C8FD4;
--species-goldfish-fill: #F0913C;
--species-goldfish-mark: #D9631E;
--lily-a: #6E9E74;
--lily-b: #8FB98A;
--scrim: rgba(25, 45, 45, 0.32);
```

Retire `#f0f4ff` and `#e8e2d5`. Card backgrounds → `--surface-2`. Icon buttons → `--accent-soft`. The + button → `--accent`, so it's the one loud thing on the screen. Species fills are for the fish SVGs only.

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

Four SVG species (not PNG cut-outs), coloured with the species tokens above:

| Cat | Chip label | Species |
|---|---|---|
| `ai` | ai art | koi |
| `code` | vibe coding | tang |
| `music` | music | betta |
| `idea` | ideas | goldfish |

Size = neglect: `0.44 + min(daysIdle, 90) / 90 * 0.8`. Three depth layers `{k, o, blur, speed}`: `1 / 1 / 0 / 1`, `0.74 / 0.68 / 1.4 / 0.66`, `0.50 / 0.40 / 3 / 0.42`.

---

## Product rules

These override any older spec:

- Fish **size = neglect** (days since `acted_at`), not age. Cap at 90 days / 1.2×.
- A note is **title + body + board** (`blocks` jsonb). One note type.
- Figma is for layout, spacing, hierarchy and assets. Colours, fonts, sizes, radii and shadows come from this file. If they disagree, this file wins.

---

## Part 3 — Naming for the build

| Figma name | Component |
|---|---|
| Frame 1367 / 1368 | `PondScreen` |
| Frame 1377 | `SearchAndFilters` |
| Frame 1384 / 1400 | `CatchOfTheDay` |
| Frame 1388–1393 | `CatchCard` |
| Frame 1378 | `PondCanvas` |
| Frame 1386 | `CaptureButton` |
| Frame 1403 / 1406 | `NoteEditor` |
| Frame 1406 (inner) | `EditorToolbar` |
