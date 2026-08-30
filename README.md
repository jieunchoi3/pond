# Pond

A koi pond for sparks — notes you throw in the water and fish out later.

Tokens are in [`DESIGN.md`](./DESIGN.md). Figma is for layout; colours, fonts, radii and shadows always come from that file.

## Run

```bash
npm install
cp .env.example .env.local   # optional: Supabase keys
npm run dev
```

Open [http://localhost:43217](http://localhost:43217).

## What’s on screen

- **PondScreen** — search, chips, catch of the day, swimming pond, capture FAB
- **Catch of the day** — three notes neglected ≥ 7 days, with recast
- **PondCanvas** — one `requestAnimationFrame` loop, size = days since `acted_at` (cap 90d / 1.2×), three depth layers, max 40 fish
- **NoteEditor** — title + body + board, draggable divider, Iconify toolbar
- **Capture sheet** — always mounted; tap + focuses the textarea on the same gesture

`pond-prototype.jsx` is animation reference only. Do not import it.

## Supabase

Magic-link auth. Schema: `supabase/migrations/20260830004342_ponds_and_notes.sql`. Captures write locally first, then upsert. The UI never waits on the network.
