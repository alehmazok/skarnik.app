# skarnik.app

Web surface for the [Skarnik](https://skarnik.by) Belarusian dictionary mobile app. When users share a word from the app, they get a link like `https://skarnik.app/r/belrus/27890` — this site renders that word for the web.

## Stack

- **Framework:** Next.js 15 (App Router), TypeScript strict
- **Runtime:** Bun (dev/CI) · Node.js (Vercel production)
- **Data:** Supabase — server-side only (316k words, RLS enabled)
- **Styling:** CSS custom properties + CSS Modules
- **Analytics:** PostHog (client-side, browser only)
- **Deploy:** Vercel

## Routes

| Route | Rendering | Description |
|---|---|---|
| `/` | Static | Landing page |
| `/r/[dict]/[id]` | ISR (24h) | Shared word page |

### Dictionary directions

| Value | Direction |
|---|---|
| `belrus` | Belarusian → Russian |
| `rusbel` | Russian → Belarusian |
| `tsbm` | Тлумачальны слоўнік беларускай мовы (explanatory) |

Unknown `dict` values return 404 immediately.

## Getting started

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
bun run dev         # local dev server
bun run build       # production build
bun run lint        # eslint
bun run typecheck   # tsc --noEmit
bun run test        # vitest (single pass)
bun run test:watch  # vitest watch
```

## Environment variables

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

Supabase dictionary data is public read — anon key is sufficient. Never expose keys client-side.

## Project structure

```
app/
  globals.css             # CSS vars, reset, theme rules
  layout.tsx              # fonts, FOUC fix
  page.tsx                # landing page
  r/[dict]/[id]/
    page.tsx              # word page (ISR, Supabase, DOMPurify)
components/
  Header.tsx
  Footer.tsx              # App Store / Google Play / AppGallery buttons
  ThemeToggle.tsx         # cycles auto / light / dark
lib/
  supabase.ts             # createServerClient() + WordRecord type
  words.ts                # getWord(dict, externalId)
  dict.ts                 # DictDirection type + isValidDict()
  stress.ts               # splitAtStress() — stressed letter highlighting
  __tests__/
```

## Design system

Three theming axes, all stored in `localStorage` and applied as `[data-theme]` on `<html>`:

- **Theme:** `auto` (OS) / `light` / `dark`
- **Accent:** Crimson · Cobalt · Forest · Amber
- **Paper tone:** Cream · Cool · Mono

Core tokens: `--bg`, `--panel`, `--ink`, `--soft`, `--faint`, `--line`, `--accent`. Never hardcode colors — use CSS vars.

Fonts: `Schibsted Grotesk` (UI), `Spline Sans Mono` (labels/meta).

## Data notes

- `external_id` is **not unique** — always filter by both `external_id` and `direction`
- `translation` contains legacy `<font color="...">` HTML — sanitize with `isomorphic-dompurify` before rendering
- `stress` column contains the word with an embedded Unicode accent mark (e.g. `заўсё́дны`)

## Testing

Every feature/fix needs tests. Unit tests cover `lib/` utilities; component tests use React Testing Library.

```bash
bun run test
```

New Supabase query shapes must be verified against the live DB via MCP before writing tests — don't rely solely on mocks for data shape validation.
