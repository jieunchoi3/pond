# Pond

A koi pond for sparks — notes you throw in the water and fish out later.

Built from the corrected `filmmee` token set in [`DESIGN.md`](./DESIGN.md): Inria Serif for headings, Pretendard for Korean-safe body copy, a single vermilion accent, and one 72px capture button.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:43217](http://localhost:43217).

## What’s here

- **Pond screen** — search, filter chips, catch of the day, swimming pond, capture FAB
- **Note editor** — title, Korean-safe body, mic / image / YouTube / expand toolbar
- Notes persist in `localStorage` (`pond.notes.v1`)

Figma MCP could not authenticate in the cloud session, so fish are named SVG-quality PNG cut-outs at `/public/fish/` (`koi-white`, `goldfish-orange`, `tang-blue`, `betta-lilac`, plus four more species). Swap in 2× exports from nodes `847:1086` / `850:1522` when the file is connected.
