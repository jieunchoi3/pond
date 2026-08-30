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

- **Search + chips** — `search the water...`, then ALL / ai art / vibe coding / music. Selected chip uses the vermilion accent.
- **Catch of the day** — white card with the three most-neglected notes (≥ 7 days). Recast marks them acted (throws them back). The left lily tab hides the panel so the pond fills the rest of the screen.
- **Pond** — water gradient, Figma PNG fish, size = neglect (cap 90 days / 1.2×), three depth layers, rAF drift. Filtered-out fish stay dim. One 72px accent FAB in the pond.
- **Capture** — always-mounted full-screen sheet. Tap + focuses the textarea on the same gesture (target: under 400ms). **Open it** saves and opens the editor; **Release** saves only.
- **Editor** — title, body, canvas-mode toolbar (mic / image / YouTube + expand), dotted board with floating cards. **Acted on it** resets neglect. **Release** deletes the note.

`pond-prototype.jsx` is animation reference only. Do not import it.

## Supabase

Magic-link auth when keys are in `.env.local`. Schema: `supabase/migrations/20260830004342_ponds_and_notes.sql`. Captures write locally first, then upsert. The UI never waits on the network.
