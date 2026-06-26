# PostHog post-wizard report

The wizard has completed the PostHog analytics integration for Skarnik.app. Four client-side events are now tracked across three components. PostHog is initialized via `instrumentation-client.ts` (Next.js 15.3+ native instrumentation), with a reverse proxy configured in `next.config.ts` to route analytics traffic through `/ingest`. No `PostHogProvider` wrapper was added — the instrumentation file is the single source of initialization.

| Event | Description | File |
|---|---|---|
| `word_viewed` | Fires when a user views a shared word page; captures `dict` and `word_id` for funnel analysis | `app/r/[dict]/[id]/page.tsx` via `components/WordViewTracker.tsx` |
| `app_store_clicked` | Fires when a user clicks a store download button; captures `store` (`app_store`, `google_play`, `appgallery`) | `components/Footer.tsx` |
| `theme_changed` | Fires when a user cycles the theme toggle; captures new `theme` value (`auto`, `light`, `dark`) | `components/ThemeToggle.tsx` |
| `about_opened` | Fires when a user opens the About modal dialog | `components/Footer.tsx` |

## Next steps

Insights and a dashboard have been created to monitor the core conversion funnel and engagement signals:

- [Analytics basics (wizard) — Dashboard](https://eu.posthog.com/project/210258/dashboard/775800)
- [Word views over time](https://eu.posthog.com/project/210258/insights/d1TGgaAA)
- [App store clicks by store](https://eu.posthog.com/project/210258/insights/m7HGgARE)
- [Word to app store conversion funnel](https://eu.posthog.com/project/210258/insights/ZmhGdxsn)
- [Click-through rate to app store](https://eu.posthog.com/project/210258/insights/PGhYljrW)
- [Theme preferences](https://eu.posthog.com/project/210258/insights/jVo4WXOM)

## Verify before merging

- [ ] Run a full production build (`bun run build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite (`bun run test`) — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` (or your team's secrets doc) so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or equivalent) into CI so production stack traces de-minify in PostHog error tracking.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
