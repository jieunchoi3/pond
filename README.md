# Pond

A koi pond for sparks — notes you throw in the water and fish out later.

Figma is for **layout, spacing, hierarchy, and assets**. Colours, fonts, sizes, radii, and shadows always come from [`DESIGN.md`](./DESIGN.md). If they disagree, DESIGN.md wins.

Type uses the four Figma families: **Inria Serif** (headings, catch cards), **Indie Flower** (note title + body), **Inter** (chips, buttons), **42dot Sans** (search, and the Korean fallback in every stack). Impact and Plus Jakarta Sans are unused and dropped.

Layout source: filmmee file `fXEzUMLn0cfW83m2YUoOoZ`

| Screen | Node |
|---|---|
| Pond + catch of the day | `847:1086` |
| Pond, no catch panel | `850:1147` |
| Note editor, filled | `850:1522` |
| Note editor, empty | `850:1439` |

## Run

```bash
npm install
cp .env.example .env.local   # optional: Supabase keys
npm run dev
```

Open [http://localhost:43217](http://localhost:43217).

## What’s on screen

- **Sidebar** — Frame 1319 outline: each category (fish + name) lists its notes underneath. Click a note to open it. Click a category (or a chip) to filter the pond. Double-click a name to rename, click the fish to pick another colour, click the empty slot at the bottom to add a category. The chevron on the spine collapses the bar.
- **Search + chips** — `search the water...`, then ALL plus every category. Selected chip uses the vermilion accent. Chips stay in sync with the sidebar.
- **Catch of the day** — white card with the three most-neglected notes (≥ 7 days). Recast marks them acted (throws them back).
- **Pond** — water gradient, Figma PNG fish, size = neglect (cap 90 days / 1.2×), three depth layers, rAF drift. Filtered-out fish stay dim. One 72px accent FAB in the pond.
- **Capture** — tap + and a white idea sheet opens over the dimmed pond (title, body, canvas-mode toolbar). The same tap focuses the title. Expand fills the screen. Click the dim pond or press Escape to release the spark into the water.
- **Editor** — title, body, canvas-mode toolbar (mic / image / YouTube + expand), dotted board with floating cards. **Acted on it** resets neglect. **Release** deletes the note.

`pond-prototype.jsx` is animation reference only. Do not import it.

## Supabase

Magic-link auth when keys are in `.env.local`. Schema: `supabase/migrations/20260830004342_ponds_and_notes.sql`. Captures write locally first, then upsert. The UI never waits on the network.
