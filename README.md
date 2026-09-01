# JobPrepOS

Continuous use of AI has made me rusty on the fundamentals, I built this to practice and get good at the specifics of my stack. I strive to be the Mike Ross of JavaScript ;)

This project is functional at a personal level, but still very early-stage. More polish and features incoming.

## What it does

Note that features are subject to change, pretty dramatically.

Guests start on Browse and can read the public question and exercise bank. Sign in to save items, practice, and run sessions.

Theory is the written kind. A question, a reference answer you keep hidden until you want it, then you mark yourself incorrect, partial, or correct. Exercises are multiple choice and the server grades those. You can write your own, or browse a shared bank and save the ones you want.

If you want a run instead of picking items by hand, you start a session. It shuffles from what you have saved, you can leave and come back, and finished runs stay in history.

English and French.

## Stack

Next.js 16.3 (App Router), React 19, TypeScript, Tailwind 4, pnpm 11.22. Next 16 wants Node 20.9 or newer. This repo does not pin `engines`.

Supabase is auth and local Postgres. Application tables live in an `app` schema that is not on the Data API. The Next server talks to that schema through Drizzle (`TRANSACTION_POOLER`). The browser does not call `supabase.from(...)` for app data.

Client data goes through TanStack Query, Zod contracts, and Route Handlers. TipTap stores rich text as JSON. next-intl owns copy.

## Run it locally

You need Docker, the [Supabase CLI](https://supabase.com/docs/guides/local-development), Node 20.9+, and pnpm 11.22.

```bash
pnpm install
supabase start
```

Copy `.env.example` to `.env.test.local`. `pnpm sandbox` sets `NODE_ENV=test`, so Next loads `.env.test.local` and ignores `.env.local`. Fill the variables the app actually reads:

| Variable                               | What `supabase start` prints                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | API URL, usually `http://127.0.0.1:54321`                                          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable / anon key                                                             |
| `TRANSACTION_POOLER`                   | Direct Postgres, usually `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| `NEXT_PUBLIC_APP_URL`                  | Public origin, no trailing slash. Local: `http://localhost:3000`                   |

`NEXT_PUBLIC_APP_URL` is `metadataBase`, the sitemap host, and Browse canonicals. Production must set the real origin. Local falls back to `http://localhost:3000` if it is unset.

`supabase/.env.example` is only for `supabase functions serve`. This repo has no Edge Functions. `pnpm sandbox` still starts that process (leftover). Copy the example to `supabase/.env` so the command has a file, or ignore it when it errors. The Next process is the one that matters.

Then:

```bash
pnpm sandbox
```

Open [http://localhost:3000](http://localhost:3000). Local email confirmation is off (`supabase/config.toml`). Seed (`supabase/seed.sql`, applied on `supabase start` / `supabase db reset`) creates an admin:

- email: `contact@jobprepos.com`
- password: `123123123`

You can also register a new account on `/auth`. The Google button is in the UI. Local Google OAuth is not set up.

`pnpm dev` uses `.env.local` and is for pointing the app at a hosted Supabase project. Do not do that unless those keys are yours.

## Schema

Migrations live in `supabase/migrations`. New file: `supabase migration new some_name`. Reset local with `supabase db reset`. That wipes local data and re-runs seed. Do not pass `--linked` or a production `--db-url`.

`pnpm gen_all` regenerates `src/types/schema.ts` and `src/lib/drizzle/schema.ts`. `gen_webapp` is hardcoded to a remote project id. `drizzle-kit pull` loads `TRANSACTION_POOLER` from `.env.local`, not `.env.test.local`. Skip both unless you know which database you are pointing at.

## Docs

These are the ones I keep current:

- [`docs/project/app-outline.md`](docs/project/app-outline.md): product, access rules, what is out of scope
- [`docs/standards/flow.md`](docs/standards/flow.md): request path, errors, feature layout
- [`docs/standards/schema-flow.md`](docs/standards/schema-flow.md): `app` schema, Drizzle, RLS with no policies

There are no tests and no CI. I am the only person on this. The ground moves. Issues are fine.

## License

[MIT](LICENSE.md). Copyright 2026 Dylan Latimer.
