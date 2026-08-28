# The System

This document is the source of truth for how I like to handle my application flows. The grand majority of flows pass from the client, through TanStack Query, through the server, and back. This document will underline two flows as examples, following a theoretical application where a user can:

- Create a post
- Fetch a post

This system will make mention of the following stack:

- Next.js
- Supabase
- TanStack Query
- Zod
- next-intl

# General

The core philosophy of The System is the **"Error Tunnel."** We use a clean exterior for the client and a noisy, detailed interior for the server. Raw details tunnel through `cause`; the client never displays server English. User-facing copy is resolved on the client via **next-intl** under the `Errors` namespace.

### The Error System

`AppError.message` is an **i18n lookup key**, never user-facing English. `code` is the HTTP-level error category; `message` is the specific key the client resolves.

```ts
// lib/errors/errors.ts
/** `message` is an i18n lookup key under `Errors`, never user-facing English. */
export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, status: number = 500, code: string = 'INTERNAL_ERROR', options?: ErrorOptions) {
    super(message, options);
    this.status = status;
    this.code = code;
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = 'UNAUTHENTICATED', options?: ErrorOptions) {
    super(message, 401, 'UNAUTHENTICATED', options);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'NOT_FOUND', options?: ErrorOptions) {
    super(message, 404, 'NOT_FOUND', options);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'FORBIDDEN', options?: ErrorOptions) {
    super(message, 403, 'FORBIDDEN', options);
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'DATABASE_ERROR', options?: ErrorOptions) {
    super(message, 500, 'DATABASE_ERROR', options);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}
```

Zod schemas follow the same rule — validation messages are keys under `Errors.validation`:

```ts
z.string().min(3, 'titleTooShort');
```

### API Error Handling

Error handling is centralized via a helper. Routes remain native and are responsible for input parsing and validation.

```ts
// lib/api-errors.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AppError } from '@/lib/errors';

export function handleApiError(req: NextRequest, error: unknown) {
  const normalizedError = error instanceof Error ? error : new Error('Unknown error');

  console.error(`[SERVER ERROR] ${req.nextUrl.pathname}:`, error);

  if (normalizedError instanceof AppError) {
    return NextResponse.json({ message: normalizedError.message, code: normalizedError.code }, { status: normalizedError.status });
  }

  if (normalizedError instanceof z.ZodError) {
    return NextResponse.json({ message: normalizedError.issues[0].message, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  return NextResponse.json({ message: 'INTERNAL_SERVER_ERROR', code: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
}
```

The API always returns `{ message, code }` where `message` is a key. The client resolves it — never render `message` directly.

### Client Fetch Helpers

All client-side API calls go through a shared wrapper. Never use raw `fetch` directly in query or mutation functions.

```ts
// lib/api-client.ts
import { ApiClientError } from '@/lib/errors/api-client-error';

export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const payload = body as { message?: string; code?: string } | null;
    throw new ApiClientError(payload?.code ?? 'REQUEST_FAILED', payload?.message ?? 'REQUEST_FAILED');
  }
  return body as T;
}

export function apiPost<T>(url: string, payload: unknown): Promise<T> {
  return apiRequest<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
```

```ts
// lib/errors/api-client-error.ts
export class ApiClientError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
  }
}
```

### Localized error keys

Translations live in `messages/en.json` and `messages/fr.json` under `Errors`:

```json
{
  "Errors": {
    "fallback": "Something went wrong. Please try again.",
    "UNAUTHENTICATED": "You must be signed in to continue.",
    "postNotFound": "Post not found.",
    "validation": {
      "titleTooShort": "Title is too short.",
      "descriptionRequired": "Description is required."
    }
  }
}
```

`resolveApiErrorToastKey` maps `{ code, message }` from the API to the correct next-intl path:

```ts
// lib/resolve-api-error-message.ts
export function resolveApiErrorToastKey(error: ApiClientError): string {
  if (error.code === 'VALIDATION_ERROR') return `validation.${error.message}`;
  if (error.code === 'NOT_FOUND' && isCamelCase(error.message)) return error.message;
  if (error.code === 'FORBIDDEN' && isCamelCase(error.message)) return error.message;
  if (['FORBIDDEN', 'CONFLICT'].includes(error.code) && isScreamingSnake(error.message)) return error.message;
  return error.code; // e.g. UNAUTHENTICATED, DATABASE_ERROR, SIGN_IN_FAILED
}
```

**Key conventions:**

| Source                  | `message` format                | Resolves to                       |
| ----------------------- | ------------------------------- | --------------------------------- |
| Zod / `ValidationError` | camelCase key                   | `Errors.validation.{key}`         |
| `NotFoundError`         | camelCase key                   | `Errors.{key}`                    |
| `ForbiddenError`        | camelCase or `SCREAMING_SNAKE`  | `Errors.{key}`                    |
| Generic `AppError`      | same as `code` or dedicated key | `Errors.{code}` or `Errors.{key}` |

Add keys to **both** locale files when introducing new errors. Missing keys fall back to `Errors.fallback`.

# Example: Mutation flow

This flow handles the creation of a new post.

## Server

First, we define the contract:

```ts
// features/posts/api/contracts.ts
import { z } from 'zod';

export const CreatePostSchema = z.object({
  title: z.string().min(3, 'titleTooShort').max(100),
  description: z.string().min(1, 'descriptionRequired'),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;

export type CreatePostResponse = {
  id: string;
  title: string;
  created_at: string;
};
```

The route handles input directly and uses the shared error helper:

```ts
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { UnauthenticatedError, DatabaseError } from '@/lib/errors';
import { handleApiError } from '@/lib/api-errors';
import { CreatePostSchema, CreatePostResponse } from '@/features/posts/api/contracts';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const input = CreatePostSchema.parse(body);

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new UnauthenticatedError('UNAUTHENTICATED', { cause: authError });
    }

    const { data, error: dbError } = await supabase
      .from('posts')
      .insert({ ...input, user_id: user.id })
      .select('id, title, created_at')
      .single();

    if (dbError) throw new DatabaseError('DATABASE_ERROR', { cause: dbError });

    const response: CreatePostResponse = data;
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(req, error);
  }
}
```

## Client

We interact via a typed mutation function:

```ts
// features/posts/api/mutations.ts
import { apiPost } from '@/lib/api-client';
import type { CreatePostInput, CreatePostResponse } from './contracts';

export async function createPost(payload: CreatePostInput): Promise<CreatePostResponse> {
  return apiPost<CreatePostResponse>('/api/posts', payload);
}
```

# Example: Query flow

This flow handles fetching a post by ID.

## Server

First, we define the contract:

```ts
// features/posts/api/contracts.ts
import { z } from 'zod';

export const GetPostParamsSchema = z.object({
  id: z.string().uuid(),
});

export type GetPostParams = z.infer<typeof GetPostParamsSchema>;

export type GetPostResponse = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  user_id: string;
};
```

The route receives the ID through native route params and validates it through the shared contract.

```ts
// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NotFoundError } from '@/lib/errors';
import { handleApiError } from '@/lib/api-errors';
import { GetPostParamsSchema, GetPostResponse } from '@/features/posts/api/contracts';

export async function GET(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const { id } = GetPostParamsSchema.parse(params);

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from('posts').select('id, title, description, created_at, user_id').eq('id', id).single();

    if (error) throw new NotFoundError('postNotFound', { cause: error });

    const response: GetPostResponse = data;
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(req, error);
  }
}
```

## Client

Query keys and options ensure predictability. The fetch is inlined directly into `queryFn` — a separate named `fetchXxx` function is only warranted when the function has logic beyond the fetch itself, or is called from multiple sites.

```ts
// features/posts/api/query-keys.ts
export const postKeys = {
  all: () => ['posts'] as const,
  lists: () => [...postKeys.all(), 'list'] as const,
  details: () => [...postKeys.all(), 'detail'] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
};

// features/posts/api/queries.ts
import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { postKeys } from './query-keys';
import type { GetPostResponse } from './contracts';

export const postDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: postKeys.detail(id),
    queryFn: () => apiRequest<GetPostResponse>(`/api/posts/${id}`),
    enabled: !!id,
  });
```

### Addendum: General Fetching

## Server

First, define the shared contract:

```ts
// features/posts/api/contracts.ts
export type GetPostsResponse = Array<{
  id: string;
  title: string;
  description: string;
  created_at: string;
  user_id: string;
}>;
```

Then use that response shape consistently in the route:

```ts
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DatabaseError } from '@/lib/errors';
import { handleApiError } from '@/lib/api-errors';
import { GetPostsResponse } from '@/features/posts/api/contracts';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from('posts').select('id, title, description, created_at, user_id');

    if (error) throw new DatabaseError('DATABASE_ERROR', { cause: error });

    const response: GetPostsResponse = data;
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(req, error);
  }
}
```

## Client

The client uses `queryOptions` with the fetch inlined directly into `queryFn`:

```ts
// features/posts/api/queries.ts
import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { postKeys } from './query-keys';
import type { GetPostsResponse } from './contracts';

export const postsQueryOptions = queryOptions({
  queryKey: postKeys.lists(),
  queryFn: () => apiRequest<GetPostsResponse>('/api/posts'),
});
```

# Client-side error handling

Errors are handled inline (form fields), via a global toast, or both. In all cases, resolve keys through next-intl — never display raw API `message` strings.

### Mutation errors — global

Mutation errors are handled globally via TanStack Query's `MutationCache`. Zustand stores are accessible outside React via `.getState()`, which makes this work without hook coupling.

```ts
// lib/query-client.ts
import { MutationCache, QueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@/lib/errors/api-client-error';
import { resolveApiErrorToastKey } from '@/lib/resolve-api-error-message';
import { useToastStore } from '@/lib/store/use-toast-store';

export const makeQueryClient = () =>
  new QueryClient({
    mutationCache: new MutationCache({
      onError: (error) => {
        if (error instanceof ApiClientError) {
          useToastStore.getState().addToast({ errorCode: resolveApiErrorToastKey(error) }, 'error');
        } else {
          useToastStore.getState().addToast({ errorCode: 'fallback' }, 'error');
        }
      },
    }),
    defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
  });
```

`onError` is **not** defined in individual `useMutation` calls. Only `onSuccess` is defined where needed.

### Inline form errors

For field-level validation (client Zod or server-returned keys), resolve through `Errors.validation`:

```ts
// common/hooks/use-validation-message.ts
'use client';
import { useTranslations } from 'next-intl';

export function useValidationMessage(error?: string): string | undefined {
  const t = useTranslations('Errors.validation');
  if (!error) return undefined;
  return t.has(error) ? t(error) : error;
}
```

Pair with `parseZodErrors` to map Zod issues to field keys, then pass each value through the hook at render time.

### Toast Management (Zustand)

Toasts carry an `errorCode` (i18n key) or a raw `message` (success/info only):

```ts
// lib/store/use-toast-store.ts
export type Toast = {
  id: string;
  type: ToastType;
  message?: string;
  errorCode?: string;
};

export type ToastInput = string | { message?: string; errorCode?: string; type?: ToastType };

addToast: (input: ToastInput, type?: ToastType) => void;
```

### Toast UI & Integration

`ToastContainer` resolves `errorCode` via `useTranslations('Errors')`:

```tsx
// common/components/ToastContainer.tsx
'use client';
import { useTranslations } from 'next-intl';
import { useToastStore, type Toast } from '@/lib/store/use-toast-store';

function getToastMessage(toast: Toast, t: ReturnType<typeof useTranslations<'Errors'>>): string {
  if (toast.errorCode) {
    if (t.has(toast.errorCode)) return t(toast.errorCode);
    return t('fallback');
  }
  return toast.message ?? '';
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const tErrors = useTranslations('Errors');
  // ...
}
```

Injected at the root in `ClientLayout` alongside `QueryClientProvider`.

## Note for components

Client-side components are to use the `hardcoded()` util anywhere there is hardcoded, uninternationalized text that is **not** an error key:

```tsx
import { hardcoded } from '@/utils/hardcoded';

export default function ExampleComponent() {
  return <p>{hardcoded('This is a test component.')}</p>;
}
```

Errors and Zod messages are never wrapped in `hardcoded()` — they are always i18n keys.

# Multi-entity feature structure

When a feature area contains multiple sub-entities (e.g. a seller dashboard with profile, products, settings), the flat `feature/api/` model breaks — `contracts.ts`, `queries.ts`, and `mutations.ts` end up mixing unrelated concerns and require section comments to stay readable.

The fix: co-locate each sub-entity's API layer inside its own sub-feature folder.

```
feature/
  api/
    query-keys.ts   ← shared namespace for the whole feature (enables broad invalidation)
  server/
    get-feature.ts  ← server-only read/write operations shared by routes, RSC pages, metadata, hydration, etc.
  sub-entity-a/
    api/
      contracts.ts
      queries.ts
      mutations.ts
    server/
      get-sub-entity-a.ts
      create-sub-entity-a.ts
      update-sub-entity-a.ts
    components/
    hooks/
  sub-entity-b/
    api/
      contracts.ts
      queries.ts
      mutations.ts
    server/
      get-sub-entity-b.ts
      create-sub-entity-b.ts
      update-sub-entity-b.ts
    components/
    hooks/
```

`query-keys.ts` stays at the feature level because query keys share a namespace — keeping them together enables `queryClient.invalidateQueries({ queryKey: featureKeys.all() })` to flush all sub-entities at once. Sub-entity `queries.ts` files import from `../../api/query-keys`.

Server-only operations live in `server/`, not `api/`. These functions are not "prefetch" functions. They are server-side read/write operations. Whether their result is used for prefetching, API JSON, metadata, or direct rendering is determined by the caller.

Use `import 'server-only';` at the top of server-only operation files.

Recommended naming:

- `getX()` for single-resource reads
- `listX()` for collection reads
- `createX()` for creates
- `updateX()` for updates
- `deleteX()` for deletes

Avoid naming these files `prefetch.ts`, because prefetching is a caller behavior, not the responsibility of the data function.

Single-entity features (e.g. `auth`, `categories`) keep the original flat `api/` structure — no change needed until there is mixing or reusable server-only logic.

# Acknowledgments

This document is likely to evolve over time. These are just some notes, in no particular order:

1.  We are not yet doing runtime validation on server responses by default.
2.  We are not using server actions as a primary tool. API routes are preferred for consistency and explicit client-server boundaries.
3.  Route handlers are doing direct business logic. Not theoretically clean, but until it becomes an issue we will continue this way to preserve simplicity.

---

**Last modified:** 27/08/2026  
**Version:** v2.6.0:

- Errors are i18n keys end-to-end: server emits keys, client resolves via `Errors` namespace.
- Documented `ApiClientError`, `resolveApiErrorToastKey`, toast `errorCode` flow, and `useValidationMessage`.
- Examples updated: Zod messages, `AppError` defaults, and `NotFoundError` with camelCase keys.

© 2026 Dylan Latimer. All rights reserved.

This document is a reusable development standard maintained by Dylan Latimer. It is not project-specific work product.
