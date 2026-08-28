# The Database

This document is the source of truth for how I like to structure and access application data when using Supabase and Drizzle.

It is a companion to `flow.md`. That document explains how requests move through the application. This document explains the database boundary underneath those requests.

# General

Supabase handles authentication, but normal application data does not use the Supabase Data API.

Application tables live in a custom PostgreSQL `app` schema. That schema is not exposed through the Data API. The browser therefore cannot query application tables directly through `supabase.from(...)`.

Instead, application data is accessed through Drizzle using a server-only PostgreSQL connection:

```text
Client
  -> server
  -> Supabase Auth
  -> authorization
  -> Drizzle
  -> app schema
```

The Supabase client identifies the authenticated user. Drizzle reads and writes the application data. These are separate responsibilities.

# The `app` schema

Normal application tables and enums live in the `app` schema rather than `public`.

```ts
// db/schema.ts
import { pgSchema } from 'drizzle-orm/pg-core';

export const app = pgSchema('app');

export const posts = app.table('posts', {
  // ...
});
```

Tables and enums declared through it belong to the custom schema, and Drizzle generates schema-qualified queries such as `app.posts`.

The `app` schema must remain absent from Supabase's exposed schemas. Its tables are not meant to be accessed from the browser, whether the user is authenticated or not.

# Database access

Drizzle connects to Postgres using a server-only database URL.

The database client and anything that depends on it must remain server-only. Database credentials must never enter the client bundle.

Routes, server components, and server-only operations may use the same Drizzle functions. The caller determines how the result is used; the database function simply performs the authorized read or write.

The Supabase Data API is not used for normal application CRUD.

# Authorization

Authorization is handled explicitly on the server, not through RLS policies.

For an authenticated operation, the server:

1. Gets the current user through Supabase Auth.
2. Applies the relevant ownership, role, or visibility rules.
3. Performs the query through Drizzle.

The database connection does not inherit the user's Supabase session. It is a trusted server connection, so the server must never trust a user ID, owner ID, role, or authorization decision supplied by the client.

Public reads still pass through the server. The query itself should include whatever conditions make the data public.

# Row-level security

Every `app` table has RLS enabled. There are no policies.

This is a default-deny safety net, not the primary authorization layer. If `app` were ever exposed through the Data API and `anon` or `authenticated` somehow gained grants, they would still see nothing — zero permissive policies means zero access.

Do not use `FORCE ROW LEVEL SECURITY`. The trusted server connection and `SECURITY DEFINER` functions must continue to bypass RLS without policies.

When adding a new `app` table, enable RLS in the same migration:

```sql
alter table app.example enable row level security;
```

No policy should be added unless the architecture changes.

# Application profiles

When a project has application profiles, `auth.users` remains the authentication identity and `app.profiles` becomes the application identity.

```ts
app.profiles {
  id: uuid primary key references auth.users(id) on delete cascade

  display_name: text | null

  created_at: timestamptz not null default now()
  updated_at: timestamptz not null default now()
}
```

The profile ID matches the Auth user ID. A profile row is created automatically when an Auth user is created.

Auth-owned fields, such as the authenticated email, remain in `auth.users`. Application-owned fields belong in `app.profiles` or other application tables.

Application tables should reference `app.profiles` when they need to reference a user:

```ts
app.posts {
  id: uuid primary key
  author_profile_id: uuid not null references app.profiles(id)
  // ...
}
```

This keeps Supabase Auth isolated to authentication while the application owns its user relationships normally.

# Acknowledgments

This document is likely to evolve over time. These are just some notes, in no particular order:

1.  This structure is fine for a solo developer, but if ever we become multiple people working on this structure it might become problematic, as you really need to be sure the validation you do in your server code is correct, there's no guaranteed database fallback, which is something I think RLS was good for. I think there's ways to upgrade our structure, likely with some testing stuff, to mitigate and improve this flow. But as it stands, there's intrinsic danger here.
2.  RLS with no policies limits damage from accidental API exposure or grants, but it is not a substitute for correct server authorization and keeping `app` out of the Data API.

---

**Last modified:** 28/08/2026  
**Version:** v1.0.1

© 2026 Dylan Latimer. All rights reserved.

This document is a reusable development standard maintained by Dylan Latimer. It is not project-specific work product.
