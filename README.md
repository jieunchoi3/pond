# Pond

A koi pond for sparks — notes you throw in the water and fish out later.

Tokens live in [`DESIGN.md`](./DESIGN.md). Figma is for layout, spacing, hierarchy and assets. Colours, fonts, sizes, radii and shadows always come from that file.

The filmmee file (`fXEzUMLn0cfW83m2YUoOoZ`) is the layout source: pond + catch (`847:1086`), capture (`845:1232`), editor empty (`850:1494`), editor filled (`850:1522`). Figma MCP cannot authenticate in this cloud session; the screens are implemented from that file’s structure plus `pond-prototype.jsx`.

## Run

```bash
npm install
cp .env.example .env.local   # optional: Supabase keys
npm run dev
```

Open [http://localhost:43217](http://localhost:43217).

## What’s on screen

- **Search + chips** — `search the water…`, ALL plus four species chips (selected = vermilion)
- **Catch of the day** — notes idle ≥ 7 days; recast reshuffles, it does not mark them acted
- **Pond** — SVG fish, size = neglect (cap 90 days), three depth layers, wraparound swim, lily pads. Filtered fish stay dim. Tap the water to recast. FAB lives in the pond.
- **Capture** — always-mounted bottom sheet. Tap + focuses the textarea on the same gesture. **Open it** saves and opens the editor; **Release** saves only.
- **Editor** — title, body, dotted board with floating cards. **Acted on it** resets neglect. **Release** deletes the note.

`pond-prototype.jsx` is product/animation reference only. Do not import it.

## Supabase

Magic-link auth when keys are in `.env.local`. Schema: `supabase/migrations/20260830004342_ponds_and_notes.sql`. Captures write locally first, then upsert. The UI never waits on the network.
