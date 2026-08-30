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
- **Pond** — water gradient, Figma PNG fish, size = neglect (cap 90 days / 1.2×), three depth layers, rAF drift. Filtered-out fish stay dim. One 72px accent FAB in the pond.
- **Capture** — tap + and a white idea sheet opens over the dimmed pond (title, body, canvas-mode toolbar). The same tap focuses the title. Expand fills the screen. Click the dim pond or press Escape to release the spark into the water.
- **Editor** — title, body, canvas-mode toolbar (mic / image / YouTube + expand), dotted board with floating cards. Pictures can be pasted, dropped, or uploaded from this device, or still given as a URL. A YouTube link on a video card plays in place. **Acted on it** resets neglect. **Release** deletes the note.

`pond-prototype.jsx` is animation reference only. Do not import it.

## Supabase

Pond stores notes on this device first. When Supabase keys are set, a signed-in user also syncs to Postgres (RLS: `auth.uid() = user_id`). Magic-link auth lives in the UI; captures never wait on the network.

Schema: [`supabase/migrations/20260830004342_ponds_and_notes.sql`](./supabase/migrations/20260830004342_ponds_and_notes.sql).

### 1. Create a project

In Cursor desktop, authenticate the **Supabase** MCP server (OAuth). Then ask the agent to create a project named `pond` and apply the migration.

Or in the [Supabase dashboard](https://supabase.com/dashboard): create a project, run the migration in the SQL editor, and enable Email / magic-link auth.

Copy the project URL and the **publishable** (or legacy anon) key. Never use the service-role key in this app.

### 2. Local keys

```bash
cp .env.example .env.local
```

Fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### 3. Vercel keys

On the Pond project in Vercel, set those two variables for Production, Preview, and Development. After a deploy, add the production URL to Supabase Auth:

- Site URL: `https://<your-app>.vercel.app`
- Redirect URLs: `https://<your-app>.vercel.app/auth/callback`

## Deploy (Vercel)

This app is meant to live on the **JIEUN** Vercel team as project `pond`.

Git deploys from Cursor Origin need Origin connected once:

1. Open [Vercel Git settings](https://vercel.com/jieun1108/~/settings/git)
2. Connect **Cursor Origin**
3. Re-link this repo (or ask the agent to run `create_git_project` again)

Until that link exists, production deploys are file uploads to the `pond` project. The app runs without Supabase (localStorage + seed notes). Magic-link sync turns on after the keys and schema above are in place.
