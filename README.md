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

- **Sidebar** — Frame 1319 outline: each category (fish + name) lists its notes underneath. Click **add category** (or the +) to make a new one — leftover fish (pink, blue, green, purple, …) are assigned in order. Click a note to open it. Double-click a name to rename, click the fish to pick another colour. The chevron on the spine collapses the bar.
- **Search + chips** — `search the water...`, then ALL plus every category. Selected chip uses the vermilion accent. Chips stay in sync with the sidebar.
- **Catch of the day** — white card with the three most-neglected notes (≥ 7 days). Recast marks them acted (throws them back).
- **Pond** — water gradient, Figma fish, size = neglect (fresh 0.44× → 90 days 1.24×), three depth layers, rAF drift. Filtered-out fish stay dim. One 72px accent FAB in the pond.
- **Capture** — tap + and a white idea sheet opens over the dimmed pond (title, body, canvas-mode toolbar). The same tap focuses the title. **Save** throws the spark in the water. Cancel discards. ⌘/Ctrl+Enter also saves. Expand fills the screen.
- **Editor** — title, body, canvas-mode toolbar (mic / image / YouTube + expand), dotted board with floating cards. Pictures can be pasted, dropped, or uploaded from this device, or still given as a URL. A YouTube link on a video card plays in place. **Acted on it** resets neglect. **Release** deletes the note.

`pond-prototype.jsx` is animation reference only. Do not import it.

## Supabase

No login. This is a single personal pond. Notes, categories, and pins save to this browser and also to one shared Supabase row, so a phone and a laptop see the same water.

Anyone with the live URL can read and write that pond. That is the tradeoff for skipping accounts.

Schema: [`supabase/migrations/20260830185400_personal_pond_state.sql`](./supabase/migrations/20260830185400_personal_pond_state.sql). Run it once in the [SQL editor](https://supabase.com/dashboard/project/myvzlzdsktnudgxqdbxv/sql/new) if the pond does not yet sync across devices.

The publishable (anon) key is enough. Never put the service-role key in this app.

Local override (optional):

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Deploy (Vercel)

GitHub repo: [jieunchoi3/pond](https://github.com/jieunchoi3/pond). Pushes to `main` deploy on the JIEUN team.
