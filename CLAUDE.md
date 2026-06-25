# Skarnik.app

Landing page and word-sharing surface for the Skarnik mobile app — a Belarusian dictionary. When users share a word from the mobile app, they get a link like `https://skarnik.app/r/belrus/27890`. This site renders that word for the web.

## Stack

- **Runtime:** Bun (dev + CI), Node.js (Vercel production)
- **Framework:** Next.js 15, App Router, TypeScript (strict)
- **Styling:** CSS custom properties + CSS Modules. No Tailwind.
- **Data:** Supabase (server-side only, never expose service key to client)
- **Analytics:** PostHog (client-side, browser only)
- **Deploy:** Vercel (auto-detects Bun via `bun.lockb`)

## Dev commands

```bash
bun install          # install deps
bun run dev          # local dev server
bun run build        # production build
bun run lint         # eslint
bun run typecheck    # tsc --noEmit
bun run test         # vitest run (single pass)
bun run test:watch   # vitest watch
```

## Routes

| Route | Rendering | Purpose |
|---|---|---|
| `/` | Static | Landing page |
| `/r/[dict]/[id]` | ISR `revalidate: 86400` | Shared word page |

Unknown `dict` values → 404 immediately (validated against enum).

## Dictionary directions

```typescript
export type DictDirection = 'belrus' | 'rusbel' | 'tsbm'
// belrus = Belarusian → Russian
// rusbel = Russian → Belarusian
// tsbm   = Тлумачальны слоўнік беларускай мовы (explanatory)
```

## Design system

Theme engine uses CSS custom properties. Three axes:

- **Theme:** `auto` (OS) / `light` / `dark` — stored in `localStorage` key `skarnik-theme`, applied as `[data-theme]` on `<html>`
- **Accent:** `Crimson` | `Cobalt` | `Forest` | `Amber`
- **Paper tone:** `Cream` | `Cool` | `Mono`
- **Hero presence:** `Restrained` | `Bold` | `Monumental`

Core tokens: `--bg`, `--panel`, `--ink`, `--soft`, `--faint`, `--line`, `--accent`

Fonts: `Schibsted Grotesk` (UI), `Spline Sans Mono` (labels, meta) — loaded from Google Fonts.

Never hardcode colors. Always use CSS vars.

## Data layer (Supabase)

- All Supabase calls are **server-side** (Server Components or Route Handlers)
- Anon/publishable key (`SUPABASE_ANON_KEY`) is sufficient — dictionary data is public read
- Never expose any key client-side
- Schema is introspected via Supabase MCP — check current schema before writing queries

### Table: `main_word` (316k rows, RLS enabled)

| Column | Type | Notes |
|---|---|---|
| `id` | bigint PK | internal auto-increment |
| `external_id` | bigint | **URL ID** — used in sharing links |
| `direction` | varchar | `belrus` / `rusbel` / `tsbm` |
| `text` | varchar | the word |
| `translation` | text | **legacy HTML** — `<font>` tags, inline styles, `&nbsp;` — render with sanitization |
| `stress` | varchar nullable | word with embedded accent mark e.g. `заўсё́дны` |
| `letter` | varchar | first letter, for alphabetical grouping |
| `redirect_to` | varchar nullable | alias redirect to another word |

### Key query

```typescript
// external_id is NOT unique — must filter by both external_id AND direction
const { data } = await supabase
  .from('main_word')
  .select('*')
  .eq('external_id', id)
  .eq('direction', dict)
  .single()
```

### Translation HTML

`translation` contains legacy `<font color="...">` tags and inline styles. Must sanitize before rendering — use `isomorphic-dompurify` or strip on server before sending to client.

## Analytics (PostHog)

- Initialize in a client-side Provider wrapping the layout
- Track page views automatically
- Custom events use snake_case: `word_viewed`, `app_store_clicked`, `theme_changed`
- Include `dict` and `word_id` properties on `word_viewed`
- Never send PII

## File structure

```
app/
  globals.css         # CSS vars, reset, theme rules
  layout.tsx          # fonts, theme FOUC fix
  page.tsx            # landing page (hardcoded sample word)
  r/[dict]/[id]/
    page.tsx          # word page (ISR, Supabase fetch, DOMPurify sanitize)
components/
  Header.tsx
  Footer.tsx          # store buttons (App Store, Google Play, AppGallery)
  ThemeToggle.tsx     # client component, cycles auto/light/dark
lib/
  supabase.ts         # createServerClient() + WordRecord type
  words.ts            # getWord(dict, externalId) → WordRecord | null
  dict.ts             # DictDirection type + isValidDict()
  stress.ts           # splitAtStress() → StressParts | null — stressed letter highlighting
  __tests__/
    dict.test.ts
    words.test.ts
    stress.test.ts
```

## Conventions

- TypeScript strict mode, no `any`
- Server Components by default; add `'use client'` only when needed (event handlers, PostHog, theme toggle)
- No auth, no user sessions
- `notFound()` for unknown dict directions or missing word IDs
- ISR — do not use `export const dynamic = 'force-dynamic'` on word pages
- Keep Supabase query logic in `lib/`, not in page files
- CSS Modules for component styles, globals.css for tokens only

## Testing

- Every new feature or bug fix must include tests
- Unit tests for `lib/` utilities (dict validation, Supabase query helpers)
- Component tests with React Testing Library for UI components
- Test runner: Vitest (`bun run test`)
- Shallow mocks are acceptable for unit tests that validate query construction (see `words.test.ts`)
- Do not use mocks as a substitute for real data shape validation — any new Supabase query shape must be manually verified against the live DB via MCP before writing tests

## Context not in code

- The `.dc.html` prototype in this repo is the original Claude Design export — reference for visual design only, not used in production
- `support.js` is the dc-runtime — ignore in production work
- Mobile app is separate codebase, not in this repo
- Word IDs are numeric, assigned by the mobile app's backend (Supabase)
