# Access

This document is a companion to `flow.md`. It is not yet folded into that file.

`flow.md` is the source of truth for how requests move through the client, TanStack Query, and the server. This document is the source of truth for how **authorization rules** are written once those requests reach a server operation.

It continues the theoretical posts application from `flow.md`. Posts here also have `is_public` and `user_id`.

This system will make mention of the following, in addition to the `flow.md` stack:

- Drizzle

`schema-flow.md` still holds: the server authorizes, then Drizzle runs on a trusted connection. RLS stays enabled with no policies. This document supplies the missing artifact — named server-side policies — so “apply the relevant rules” is not reinvented in every operation.

# General

Identity is already named (`getAuthenticatedUser`). Roles are already named (`assertAdmin`). Resource policy was not.

A policy fact that appears in more than one operation — public, owned, app-owned, membership — is an **artifact**. It lives in one file. Operations import it. They do not inline it.

Inlining a policy condition is the same class of mistake as raw `fetch` in a `queryFn`.

Access is not disclosure. Operations keep their own `SELECT` lists. Access is not validation. Zod and input validators stay where they are. Access never returns a response DTO.

# The access file

Policy lives at the feature root, next to `query-keys.ts`, because it cuts across sub-entities the same way cache keys do.

```
feature/
  api/
    query-keys.ts
  server/
    access.ts
    get-feature.ts
  sub-entity-a/
    server/
      get-sub-entity-a.ts
```

`import 'server-only'` at the top. Sub-entity operations import from `../../server/access` (or `../server/access` in a flat feature).

Single-entity features add `server/access.ts` when the first policy fact appears. Features that only need a signed-in user do not need this file.

Admin operations stay separate files and separate flows. They import the same predicates (`appOwned`, not `ownedBy`). They are not merged into the user operation.

# Predicates and asserts

The file exports two things, and they must sit next to each other:

1. **Predicates** — Drizzle conditions for `WHERE`. Used by lists, and as a second check on writes.
2. **Asserts** — throw `NotFoundError` or `ForbiddenError`. Used after a row is loaded by id.

```ts
// features/posts/server/access.ts
import 'server-only';

import { eq } from 'drizzle-orm';
import { posts } from '@/lib/drizzle/schema';
import { ForbiddenError, NotFoundError } from '@/lib/errors';

export const postAccess = {
  public: () => eq(posts.isPublic, true),
  ownedBy: (userId: string) => eq(posts.userId, userId),
};

export function assertPostOwnedBy(userId: string, post: { userId: string } | undefined): asserts post is { userId: string } {
  if (!post) {
    throw new NotFoundError('postNotFound');
  }

  if (post.userId !== userId) {
    throw new ForbiddenError('postForbidden');
  }
}
```

Do not put `ownedBy` in the load-by-id `WHERE`. That collapses “missing” and “not yours” into 404. Load by id, then assert. Missing → `NotFoundError`. Exists but not allowed → `ForbiddenError`.

The matching predicate still belongs on the `UPDATE` / `DELETE` `WHERE`. Same fact, one definition, two call sites.

An assert that needs its own lookup (membership, and similar) is still an assert. It lives in this file. It does not live beside one caller.

# Example: Update a post

The operation still owns the transaction, the `SELECT`, and the input. Policy is imported.

```ts
// features/posts/server/update-post.ts
import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { posts } from '@/lib/drizzle/schema';
import { DatabaseError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { assertPostOwnedBy, postAccess } from '@/features/posts/server/access';
import type { UpdatePostInput, UpdatePostResponse } from '@/features/posts/api/contracts';

export async function updatePost(id: string, input: UpdatePostInput): Promise<UpdatePostResponse> {
  const user = await getAuthenticatedUser();

  try {
    const [existing] = await db.select({ userId: posts.userId }).from(posts).where(eq(posts.id, id)).limit(1);

    assertPostOwnedBy(user.id, existing);

    const [updated] = await db
      .update(posts)
      .set({ title: input.title, description: input.description })
      .where(and(eq(posts.id, id), postAccess.ownedBy(user.id)))
      .returning({ id: posts.id, title: posts.title, createdAt: posts.createdAt });

    if (!updated) {
      throw new DatabaseError('DATABASE_ERROR');
    }

    return updated;
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
```

# Example: List public posts

```ts
// features/posts/server/list-public-posts.ts
import 'server-only';

import { desc } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { posts } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { postAccess } from '@/features/posts/server/access';
import type { GetPostsResponse } from '@/features/posts/api/contracts';

export async function listPublicPosts(): Promise<GetPostsResponse> {
  await getAuthenticatedUser();

  try {
    return await db
      .select({
        id: posts.id,
        title: posts.title,
        description: posts.description,
        createdAt: posts.createdAt,
        userId: posts.userId,
      })
      .from(posts)
      .where(postAccess.public())
      .orderBy(desc(posts.createdAt));
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
```

A create that only inserts as the current user has nothing to import from this file. Authenticated + write is not a policy fact.

`orderBy`, joins, id equality, and column lists are not policy. They stay inline.

# Adding a rule

When a new kind of access appears, add it to `access.ts` first, then use it. Same ritual as adding a query key or an `Errors` key.

When a rule changes, the file you open is `access.ts`. If a caller still inlines the old condition, that caller was already wrong.

# Illegal

```ts
if (post.userId !== user.id) {
  throw new ForbiddenError('postForbidden');
}

.where(eq(posts.isPublic, true))
.where(eq(posts.userId, user.id))
```

Those conditions have names. Writing them by hand in an operation is forbidden.

---

**Last modified:** 30/08/2026  
**Version:** v1.0.0:

- Companion to `flow.md`: resource policy is a named artifact (`server/access.ts`).
- Predicates for `WHERE`, asserts for load-by-id. Operations keep their own `SELECT` lists.
- Inlining policy conditions is forbidden, same class as raw `fetch`.

© 2026 Dylan Latimer. All rights reserved.

This document is a reusable development standard maintained by Dylan Latimer. It is not project-specific work product.
