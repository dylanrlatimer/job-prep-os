# List Pages — Analysis

## The hypothesis

> "Now that we've unified the builders, we can do a similar revamp of the list pages."

Half right. The *symptom* is the same (near-duplicate files). The *disease* is not.

The builder rewrite fixed two things at once:

1. Unreadable form-state machinery (`useSnapshotForm`, snapshot/scalar aliases, scattered `isAdmin`).
2. User vs admin of **the same entity** sharing **the same UI**, differing only in which API to call.

List pages have (1) almost not at all — they are verbose, not clever. They have (2) in the wrong axis. The real clone is **questions vs exercises at the same role**, not **user vs admin of the same entity**. Treating this as "builders, but for lists" and injecting an `apiLayer` into one mega-page would be the overcorrection we already walked back once.

---

## Inventory

Six list surfaces:

| Page | Role | Entity | Lines | Own hook? |
|---|---|---|---|---|
| `TheoryRepositoryPage` | user | questions | ~241 | no |
| `ExerciseRepositoryPage` | user | exercises | ~241 | no |
| `AdminQuestionsPage` | admin | questions | ~193 | no |
| `AdminExercisesPage` | admin | exercises | ~193 | no |
| `AdminTopicsPage` | admin | topics | ~170 | no |
| `BrowsePage` | user | questions + exercises | ~363 | no |

No `useSnapshotForm` equivalent. No custom list hook. Each page is: `useQuery` → local filter state → header / filters / count / empty|no-matches|rows. Readable. Copied.

---

## Axis 1: user vs admin of the same entity — do not unify

This is the axis the builders unified. It does not apply here.

User theory repo vs admin questions, same for exercises:

| | User repository | Admin list |
|---|---|---|
| Filters | search + topic | search + topic + **publication** |
| Row meta | **attempts** | **published / draft** |
| Primary action | **practice** | **edit** |
| Secondary action | **unsave** (conditional) | none |
| Header actions | browse + create | create only |
| Extra chrome | disabled export CSV | none |
| Gate | none | `AdminGate` |

The UIs are cousins, not the same page with a different endpoint. An `apiLayer` cannot absorb "show attempts vs show publication badge" without flags or render props, which is `isAdmin` with extra steps.

Leave user lists and admin lists as separate pages. That split is doing real work.

---

## Axis 2: questions vs exercises at the same role — this is the clone

`TheoryRepositoryPage` and `ExerciseRepositoryPage` are the same file with find-and-replace:

- `question.question` ↔ `exercise.title`
- `data.questions` ↔ `data.exercises`
- routes (`/theory/...` ↔ `/exercises/...`, `/browse` ↔ `/browse?kind=exercises`)
- query options, unsave mutation, cache invalidation
- i18n namespace
- skeleton import (the two skeleton files are **byte-identical**)

`AdminQuestionsPage` and `AdminExercisesPage` are the same story, plus a publication filter that both already share.

`AdminTopicsPage` uses the same *shell* (header, search, one select, count, empty/no-matches/list) but different filters (status, not topic/publication) and a different row (icon + usage counts, name is not a detail link). Related, not a twin.

`BrowsePage` already combined both entities. It is the one list that earned its complexity (kind + saved + topic, two queries, merged sort). Leave it alone except where it can consume shared primitives.

---

## What a "similar revamp" would overcorrect into

### Generic `ListPage<T>` / `FilteredListLayout`

A component that owns loading/error/empty/filters/count and takes a row renderer. That is `useSnapshotForm` for lists: two type parameters, a pile of slots, and every future divergence becomes a flag. The three builders taught us not to do this. Don't.

### `apiLayer` on a shared user-repository page

Tempting because the two user repo UIs really are identical. It would look like:

```ts
type RepositoryApiLayer<TData, TItem> = {
  queryOptions: UseQueryOptions<TData>;
  getItems: (data: TData) => TItem[];
  getTitle: (item: TItem) => string;
  detailHref: (id: string) => string;
  practiceHref: (id: string) => string;
  browseHref: string;
  createHref: string;
  unsave: (id: string) => Promise<unknown>;
  afterUnsave: ...;
};
```

That is a generic over two entities with different field names, different response envelopes (`questions` vs `exercises`), and different i18n namespaces. The builder `apiLayer` worked because **the form values type was the same**. Here it is not — you are inventing a `TItem` vocabulary (`getTitle`, `getItems`) to paper over `question` vs `title`. We already know that TypeScript unification of two `useQuery` shapes is painful; we kept `isAdmin` + two queries on purpose.

A config object that wide is not simpler than two 240-line pages. After the small extractions below, each page's unique part is query + row + hrefs + copy. That is the right size.

### Folding topics or browse into the same abstraction

Topics is a different domain object. Browse is already the combined view and has URL-synced kind state. Neither belongs in a Q/E list generic.

---

## What is actually worth doing

The list pages are not "smart code." They are copy-paste of **identical primitives** plus **two pairs of twin pages**. Fix those. Do not rewrite the pages' control flow.

### 1. Identical files / helpers (do these regardless)

**Skeletons.** `TheoryRepositorySkeleton` and `ExerciseRepositorySkeleton` are the same markup. Admin questions/topics reuse the theory one; admin exercises reuses the exercise one; browse reuses the theory one. One `common/components/ListPageSkeleton.tsx`. Delete both feature copies.

**`matchesTopic`.** Already exists as a generic in `browse-filters.ts`. Reimplemented in both repository pages and both admin Q/E pages. Import it. Move it out of `theory/browse/lib/` into something like `common/lib/list-filters.ts` so admin/exercises are not importing from browse.

**`matchesPublication`.** Identical in admin questions and admin exercises. Goes in the same filters file.

**`matchesSearch`.** Five one-liners on a single string field, plus topics which also matches `slug`. A `matchesText(haystack, search)` helper is enough. Do not invent `matchesSearch(item, search, keys)`.

**`hasAttempts`.** Copied in both repository pages *and* in practice/detail pages (6+ copies). One function next to `attemptCountClassName`. Out of scope for "list pages" strictly, but it is the same three-line predicate and the list rows are one of the callers.

**Shared `AttemptTotals`.** `common/components/AttemptTotals` already exists. Both repository pages ignore it and reimplement it locally so they can render a `noAttempts` span and call `t()` themselves. Extend the shared component with an optional empty slot (or just pass `emptyLabel`) and delete the two local copies.

**Page load error.** The `AppShell` + title + `loadError` + retry button block is copy-pasted across all six lists (and most other feature pages). A `PageLoadError` with `title`, `message`, `onRetry`, `isRetrying`, labels is a real extraction. Optional to do it for every feature page now; the six lists should at least share one.

None of these change page structure. They delete the lies that each page owns its own filter algebra.

### 2. Twin pages: keep two files, share the chrome they already agree on

After (1), the remaining duplication is the shell:

```
header (title, description, actions)
filter row (search + selects), hidden when empty
count strip
empty | no-matches | <ul> rows
```

A **dumb layout** is justified if it is slots only — no generics over item type, no fetching, no filter state:

```tsx
<ListPageLayout
  title={...}
  description={...}
  headerActions={...}
  filters={...}          // null when empty
  countLabel={...}
  countExtra={...}       // export button on user repos; omit elsewhere
  empty={...}
  noMatches={...}
>
  <ul>...</ul>
</ListPageLayout>
```

Loading and error stay outside (skeleton / `PageLoadError`), because those return a different tree (`AppShell` wrapping only the skeleton today).

This is not a `ListPage<T>`. It does not know what a question is. Admin topics and browse can use it too without being forced into the Q/E model.

The row components stay local to each page. `QuestionRow` vs `ExerciseRow` look alike because both are "title + topics + attempts + two actions," but the mutations and hrefs are the actual content. Extracting `ListRow` with eight render props is worse than 60 duplicated lines.

Same for admin: `AdminQuestionsPage` and `AdminExercisesPage` keep their own row (title, publication badge, topics, edit link). They compose the same layout.

### 3. Browse and topics

**Browse:** consume shared `matchesTopic` / `matchesText` / skeleton / error / layout. Do not split it back into two pages and do not genericize the two row components. The two rows differ by save mutation and href; that is fine.

**Topics:** consume layout + error + skeleton. Keep its own filters and row. No `apiLayer`. It is already the simple admin-only case, same as the topic builder.

---

## What this is not

- Not a hook rewrite. There is no list hook to inline.
- Not user/admin unification. Different screens.
- Not `RepositoryPage<T>` parameterized on query + row.
- Not moving filter state into a `useListFilters` hook. `useState` × 2 in the page is the correct shape.

The builder rewrite made form state *visible*. The list work should make shared *facts* live in one place (how topic matching works, what a skeleton looks like) without hiding the page's fetch-filter-render loop behind a framework.

---

## Order

1. **Primitives** — `ListPageSkeleton`, move `matchesTopic` (+ `matchesPublication`, `matchesText`) to `common/lib/list-filters.ts`, point all six pages at them. Lowest risk, immediately deletes the most dishonest duplication (identical skeletons, identical predicates).
2. **`AttemptTotals` empty state** — delete the two local repository copies. Fold `hasAttempts` into the attempts helper while touching that.
3. **`PageLoadError`** — at least for the six lists.
4. **`ListPageLayout`** — only after 1–3, when the remaining copy is visibly just chrome. Wire repository pair, then admin Q/E pair, then topics, then browse if it fits without new props.
5. **Stop.** Do not collapse the twin pages into one component. If after 4 the two repository files still bother you, re-evaluate then with the actual leftover diff, not with the current 241-line clones.

Each step is independently shippable. Step 4 is the only one that can slide into a generic; the test is: if `ListPageLayout` grows a prop that means "this is the exercises variant," delete the component and inline again.
