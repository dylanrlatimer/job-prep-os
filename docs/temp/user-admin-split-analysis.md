# User / Admin Question Split — Analysis

## Your hypothesis

> "A question is a question. The only difference is `ownerProfileId`: user's is their ID, admin's is null."

Mostly correct. Here is what is actually different per operation, traced all the way down:

| | User | Admin |
|---|---|---|
| Auth | `getAuthenticatedUser()` | `assertAdmin()` |
| Access predicate | `ownerProfileId = userId` | `ownerProfileId IS NULL` |
| **Create** — ownership value | `user.id` | `null` |
| **Create** — side effect | inserts `theoryLibraryItemsInApp` | no library insert |
| **Get** — query | no JOIN on topics | extra JOIN on topics |
| **Get** — response shape | `QuestionResponse` | `SystemQuestionResponse` (adds `topics: RepositoryTopic[]`) |
| **Update** — SQL body | identical | identical |
| **Delete** — SQL body | identical | identical |

---

## What is genuinely different and justified

**Auth gate and access predicate** — These should stay separate. The user endpoint verifies the caller authenticated AND owns the resource. The admin endpoint verifies the caller is an admin AND the resource is system-owned. Merging them into one endpoint with "user owns it OR admin + system-owned" would create a more complex access control surface, harder to audit, easier to get wrong. The current separation is correct security practice: each endpoint is focused and fail-closed.

**Library insertion on create** — When a user creates a question it automatically enters their library (`theoryLibraryItemsInApp`). System questions don't belong to anyone's library. This is a real behavioral difference that belongs in a separate code path.

These two things justify having separate API routes and server functions for create. For update and delete, the functions are near-identical (same SQL body, different WHERE clause) — you could DRY them if you wanted to, but it's a minor duplication and the current code is not the problem.

---

## What is NOT justified, and IS the root of the two-query smell

**`getSystemQuestion` returns `topics` (full objects). The builder doesn't use them.**

```ts
// getSystemQuestion returns:
type SystemQuestionResponse = {
  id, question, answer, topicIds, sourceName, sourceUrl, isPublic,
  topics: RepositoryTopic[];  // ← this
};

// getQuestion (user) returns:
type QuestionResponse = {
  id, question, answer, topicIds, sourceName, sourceUrl, isPublic,
  // no topics
};
```

These two types are not the same, which means TypeScript can't unify them into a single `useQuery` call — hence the two-query workaround in the hook.

Why does `getSystemQuestion` return `topics`? Because the admin question DETAIL/VIEW page presumably needs them for display, and it hits the same `/api/admin/questions/[id]` endpoint that the builder uses. So `getSystemQuestion` was written to serve both consumers, and the builder inherits the extra field it doesn't need.

The builder's `loadedFields` computation:
```ts
return {
  question: data.question,
  topicIds: data.topicIds,  // only topicIds, never touches topics
  ...
};
```

`topics` is fetched, paid for (extra JOIN), typed around, and silently ignored by the builder.

---

## The fix

There is no need to change the server functions or the API routes. The fix is entirely on the frontend api layer, using TanStack Query's `select` option to normalize the admin response to `QuestionResponse` shape before it reaches the hook.

**Add `questionQueryOptions` to `QuestionApiLayer`:**

```ts
export type QuestionApiLayer = {
  questionQueryOptions: (id: string) => UseQueryOptions<QuestionResponse>;
  create: ...
  update: ...
  delete: ...
  afterSave: ...
  afterDelete: ...
};
```

**User layer** — no change needed, already returns `QuestionResponse`:
```ts
export const userQuestionApiLayer: QuestionApiLayer = {
  questionQueryOptions: questionDetailQueryOptions,
  ...
};
```

**Admin layer** — add `select` to strip the `topics` field:
```ts
export const adminQuestionApiLayer: QuestionApiLayer = {
  questionQueryOptions: (id) => ({
    ...systemQuestionQueryOptions(id),
    select: ({ id, question, answer, topicIds, sourceName, sourceUrl, isPublic }): QuestionResponse => ({
      id, question, answer, topicIds, sourceName, sourceUrl, isPublic,
    }),
  }),
  ...
};
```

**Hook becomes one query, zero `isAdmin`:**
```ts
// Remove these:
const isAdmin = apiLayer.variant === 'admin';
const userQuestionQuery = useQuery({ ...questionDetailQueryOptions(...), enabled: isEdit && !isAdmin });
const adminQuestionQuery = useQuery({ ...systemQuestionQueryOptions(...), enabled: isEdit && isAdmin });
const questionQuery = isAdmin ? adminQuestionQuery : userQuestionQuery;

// Replace with this:
const questionQuery = useQuery({
  ...apiLayer.questionQueryOptions(questionId ?? ''),
  enabled: isEdit,
});
```

The `variant` field can be removed from `QuestionApiLayer` entirely. `isAdmin` disappears from the hook body completely. The hook has no knowledge of user vs admin — it just calls what the api layer provides.

---

## Does this break the admin question detail view?

No. The `systemQuestionQueryOptions` query key (`adminKeys.systemQuestion(id)`) is still used by the admin layer. The `select` transform only affects what the BUILDER receives from the cache. TanStack Query caches the raw server response; `select` is applied on read, not on store. So other pages that use `systemQuestionQueryOptions` without `select` still see the full `SystemQuestionResponse` including `topics`.

---

## What about the exercise builder?

Same pattern almost certainly exists. Haven't read the exercise server functions but given the structure is the same, the admin exercise GET likely also returns a richer type for the admin detail view. Same fix applies.

---

## Summary

- The server-side split is correct and should stay (auth, access, library insertion).
- The two-query frontend workaround is an artifact of `getSystemQuestion` returning a richer type than the builder needs.
- The fix is small: add `questionQueryOptions` to the api layer with a `select` transform in the admin variant.
- After that, `isAdmin` disappears from the hook entirely, `variant` disappears from `QuestionApiLayer`, and the hook has one query.
- This is the last piece of the question builder refactor.
