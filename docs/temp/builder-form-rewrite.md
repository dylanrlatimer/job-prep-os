# Builder Form Rewrite — Design Doc

## What this covers

The three builder hooks and their supporting files:
- `useQuestionBuilderForm` + `question-form-values.ts`
- `useExerciseBuilderForm` + `exercise-form-values.ts`
- `useTopicBuilderForm` (admin-only)

And one shared file to delete: `use-snapshot-form.ts`.

---

## Concrete problems

### 1. `useSnapshotForm` is a generic that earned zero generic users

The generic has two type parameters, two code paths (`hasDocumentField`), and its own vocabulary. Its actual users:

| Consumer | `hasDocumentField` | `TSnapshot` vs `TScalars` |
|---|---|---|
| `useQuestionBuilderForm` | `true` | Different types |
| `useTopicBuilderForm` | `false` | Same type (`TopicFormValues`) |
| `useExerciseBuilderForm` | never used — reinvented inline | — |

The exercise builder, which has *the most complex document situation* (multiple editors, dynamic list), already does not use `useSnapshotForm`. It has its own inline version. So the generic exists to serve one document-form consumer and one scalar consumer, and the scalar consumer could just use `useState`.

What the generic buys: nothing an inline implementation wouldn't. What it costs: you can't understand `useQuestionBuilderForm` without mapping the generic's behavior, its two code paths, its `hasDocumentField` flag, and its ref-sync pattern. It's a layer of indirection that has no downstream value.

### 2. The type aliases create a phantom vocabulary

`question-form-values.ts` exports three names for what is essentially one shape:

```ts
type QuestionFormValues = { question, answer, topicIds, sourceName, sourceUrl, isPublic }
type QuestionScalars   = Omit<QuestionFormValues, 'answer'>   // same minus one field
type QuestionFormSnapshot = QuestionFormValues                 // literal alias
```

Plus `toQuestionSnapshot(scalars, document) => { ...scalars, answer: document }` which is just spread.

These were created to satisfy `useSnapshotForm`'s generics (`TSnapshot` / `TScalars`). They're not domain concepts. A reader sees `QuestionScalars`, looks for what makes it different from `QuestionFormValues`, and has to discover that the only difference is the absence of `answer` — which is because the editor owns `answer`, not React state. That's an implementation detail being expressed as a public type.

There's also a deprecated `areQuestionFormValuesEqual` (renamed to `areQuestionSnapshotsEqual`) still sitting in the file. Dead code from a previous name migration.

### 3. The hook has too many jobs with no names for the seams

`useQuestionBuilderForm` currently does all of this, in no particular labeled order:

- Fetch metadata
- Fetch the question (two queries: one user, one admin)
- Map query response to "scalars" shape
- Seed form state via `useSnapshotForm` effects
- Track TipTap readiness (deferred via `onEditorReady`)
- Compute `isDirty` reactively via a snapshot comparison
- Manage field errors
- Create/update/delete mutations
- Handle success (commit snapshot, toast, navigate, invalidate cache)
- Handle delete success (same but different nav + cache)
- Expose 20 fields as a memoized object

None of these phases are labeled or separated. Everything is interleaved. The mental model a reader needs is: "what state am I in, and what caused me to be there?" But the code doesn't map to that model — it's organized by hook/API call, not by lifecycle phase.

### 4. `variant` ternaries are scattered throughout

The admin vs user split shows up in:
- Which query to enable (`isAdmin ? adminQuestionQuery : userQuestionQuery`)
- Each mutation's `mutationFn` (`isAdmin ? createSystemQuestion : createQuestion`)
- `onSaveSuccess` routing (`isAdmin ? router.push(adminUrl) : router.replace(userUrl)`)
- `onSaveSuccess` cache invalidation (`isAdmin ? invalidateAdminQuestionCaches : invalidateQuestionCaches`)
- `onDeleteSuccess` routing (same)
- `onDeleteSuccess` cache invalidation (same)

That's 6+ places where `isAdmin` branches. If admin behavior changes, you're hunting across the hook. If a new variant is added, you're touching everything.

### 5. The memoized return object is theater

```ts
return useMemo(() => ({ ... }), [20 deps]);
```

The sole consumer is a page component that re-renders on every keystroke because `scalars` (React state) changes. The memo invalidates on `scalars` changes, meaning it's effectively re-created on every render anyway. It adds 10 lines of deps array maintenance and zero real stability.

---

## What the code actually needs to do

Stripped of implementation:

1. **Load**: fetch metadata + (if edit) the existing question
2. **Initialize form**: seed field values from loaded data; seed dirty-tracking anchor from editor + field values once editor mounts
3. **Let user edit**: field changes go into state; editor changes happen in TipTap (not in state)
4. **Dirty detection**: compare current values + editor content against anchor; drive the nav guard
5. **Submit**: read current values + editor content → validate with Zod → call API
6. **After save**: update dirty anchor, toast, navigate, invalidate cache
7. **After delete**: clean up, toast, navigate, invalidate cache

This is straightforward. The complexity comes almost entirely from step 3+4: TipTap content isn't React state, so you can't just compare old/new state. Everything else is ordinary.

---

## First-principles model

### TipTap and dirty detection

The root issue: TipTap document lives in the editor instance (a DOM ref), not in React state. Keeping a full copy in state on every keystroke would be expensive and creates a sync hazard.

The right model: **don't put the document in state at all**. Hold the non-document fields in `useState` normally. When you need the document (on submit, on dirty-check), read it from `editorRef.current.getJSON()`.

For dirty detection, you need a reactive value (because `useUnsavedChangesGuard` takes a `boolean`, not a function). The document isn't reactive, so force a re-render when it changes using a counter:

```ts
const [docRevision, setDocRevision] = useState(0);
const onDocumentUpdate = () => setDocRevision(n => n + 1);
```

Then:

```ts
const isDirty = useMemo(() => {
  if (status !== 'ready' || savedFields === null) return false;
  return (
    !fieldsEqual(fields, savedFields) ||
    !documentsEqual(editorRef.current?.getJSON() ?? null, savedDocument.current)
  );
}, [fields, savedFields, status, docRevision]);
```

`docRevision` in the deps array is the trick. It forces memo re-evaluation when TipTap fires `onUpdate`. This is the current approach — it's correct. The only thing wrong now is that it's hidden inside `useSnapshotForm` and expressed through generics. Inline it.

`savedDocument` is a ref because you never need it to cause renders — you only compare against it, and the comparison is triggered by `docRevision` or a `fields` change.

### Field state model

Remove "scalars" as a concept. Call form values what they are: `fields`. The TipTap document is separate.

```ts
type QuestionFields = {
  question: string;
  topicIds: string[];
  sourceName: string;
  sourceUrl: string;
  isPublic: boolean;
};
// answer lives in editorRef — not here
```

On submit, assemble the full payload:

```ts
const payload = {
  ...fields,
  answer: editorRef.current?.getJSON() ?? null,
};
```

No `toQuestionSnapshot`, no `QuestionScalars`. You just read from two places when you need the full picture.

### Admin/user injection

Instead of `variant: 'user' | 'admin'` causing ternaries throughout the hook, inject the behavior that differs:

```ts
type QuestionApiLayer = {
  questionQueryOptions: (id: string) => UseQueryOptions<QuestionResponse>;
  createQuestion: (payload: QuestionInput) => Promise<{ id: string }>;
  updateQuestion: (id: string, payload: QuestionInput) => Promise<{ id: string }>;
  deleteQuestion: (id: string) => Promise<void>;
  afterSave: (opts: { queryClient, router, id, isEdit }) => void;
  afterDelete: (opts: { queryClient, router, id }) => void;
};
```

Defined once, outside the hook:

```ts
export const userQuestionApiLayer: QuestionApiLayer = {
  questionQueryOptions: questionDetailQueryOptions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  afterSave: ({ queryClient, router, id, isEdit }) => {
    void invalidateQuestionCaches(queryClient, id);
    router.replace(`/theory/${id}`);
  },
  afterDelete: ({ queryClient, router, id }) => {
    removeQuestionCaches(queryClient, id);
    void invalidateRepositoryCache(queryClient);
    router.replace('/');
  },
};

export const adminQuestionApiLayer: QuestionApiLayer = {
  questionQueryOptions: systemQuestionQueryOptions,
  createQuestion: createSystemQuestion,
  updateQuestion: updateSystemQuestion,
  deleteQuestion: deleteSystemQuestion,
  afterSave: ({ queryClient, router, id }) => {
    void invalidateAdminQuestionCaches(queryClient, id);
    router.push(`/admin/questions/${id}`);
  },
  afterDelete: ({ queryClient, router, id }) => {
    void invalidateAdminQuestionCaches(queryClient, id);
    router.push('/admin/questions');
  },
};
```

The hook signature becomes:

```ts
function useQuestionBuilderForm({
  questionId,
  apiLayer,
  toastMessages,
}: {
  questionId?: string;
  apiLayer: QuestionApiLayer;
  toastMessages: BuilderToastMessages;
})
```

The hook body has zero `isAdmin` branches. `QuestionBuilderPage` passes `userQuestionApiLayer`; `SystemQuestionBuilderPage` passes `adminQuestionApiLayer`. Each wrapper only knows one thing: which API layer to use.

### Form initialization

Two cases:

**New question** (`!isEdit`):
- Set `fields` to empty defaults
- On `onEditorReady`, record `savedDocument.current = document`, then `setSavedFields(emptyFields)` and `setStatus('ready')`

**Editing** (`isEdit`):
- Start with `fields` as empty defaults
- When `questionQuery.data` arrives, `setFields(mapToFields(data))`
- On `onEditorReady`, record `savedDocument.current = document` (editor was mounted with `initialContent = questionQuery.data.answer`)
  - If `fields` are already seeded (data arrived before editor), also `setSavedFields(currentFields)` and `setStatus('ready')`
  - If data hasn't arrived yet (edge case: editor mounted before fetch completes), just record the editor ready; the data effect handles readiness

This is simpler than the current `loadedScalarsRef` pattern because there's no "sync scalars to ref so the callback closure can read them fresh" problem — the editor `onEditorReady` just sets `savedDocument` and we use the current React state for `savedFields`.

Wait: there IS a closure freshness issue if data arrives after the editor mounts. The `onEditorReady` callback captures `fields` at the time of creation. Use a ref for it:

```ts
const fieldsRef = useRef(fields);
fieldsRef.current = fields;
// ... in onEditorReady:
setSavedFields(fieldsRef.current);
```

This is the same ref-to-latest-state pattern currently in `useSnapshotForm`. The difference: it's three lines in the builder hook, not wrapped in a generic. You see it, you know what it does.

### Status machine

```
loading → ready (editor mounts + data loaded, or new question editor mounts)
ready → submitting (submit() called, validation passed)
submitting → ready (mutation success, snapshot committed)
```

Three states, two transitions. Currently this lives across `useSnapshotForm` and the builder hook, expressed partially through `form.status` and `form.markSubmitting()` and `form.commitSnapshot()`. Inline it: `const [status, setStatus] = useState<'loading' | 'ready' | 'submitting'>('loading')`.

---

## What the rewritten question builder hook looks like

(Prose sketch — full code comes later.)

```
useQuestionBuilderForm({ questionId, apiLayer, toastMessages })
│
├── isEdit = !!questionId
│
├── QUERIES
│   ├── metadataQuery
│   └── questionQuery  ← apiLayer.questionQueryOptions(questionId), enabled: isEdit
│
├── FORM STATE
│   ├── fields: QuestionFields  (useState, emptyFields default)
│   ├── fieldErrors: Record     (useState, {})
│   ├── status: 'loading'|'ready'|'submitting'  (useState)
│   ├── savedFields: QuestionFields | null  (useState, null until ready)
│   ├── savedDocument: ref<JSONContent | null>  (useRef)
│   ├── editorRef: ref<TiptapEditorRef>  (useRef)
│   └── docRevision: number  (useState — dirty trigger)
│
├── EFFECTS
│   ├── [questionQuery.data] → setFields(mapToFields(data))
│   │   and if editor is already ready: setSavedFields, setStatus('ready')
│   └── [isEdit=false] → setStatus('ready') handled in onEditorReady
│
├── isDirty = useMemo(
│       !fieldsEqual(fields, savedFields) ||
│       !documentsEqual(editorRef.current?.getJSON(), savedDocument.current),
│       deps: [fields, savedFields, status, docRevision]
│   )
│
├── CALLBACKS
│   ├── onEditorReady(doc) → savedDocument.current = doc; set savedFields; setStatus('ready')
│   ├── onDocumentUpdate() → setDocRevision(n+1)
│   ├── setField(k, v) → setFields; clear field error for k
│   ├── toggleTopic(id) → setFields; clear topicIds error
│   └── submit()
│       → assemble { ...fields, answer: editorRef.getJSON() }
│       → ZodParse
│       → on fail: setFieldErrors, return { ok: false }
│       → on pass: setStatus('submitting'), mutate
│
├── MUTATIONS (using apiLayer.createQuestion / updateQuestion / deleteQuestion)
│   ├── afterSave(id) → setSavedFields(fields), savedDocument.current = editorRef.getJSON(),
│   │                   setStatus('ready'), releaseGuard(), toast, apiLayer.afterSave(...)
│   └── afterDelete() → releaseGuard(), toast, apiLayer.afterDelete(...)
│
└── RETURN (plain object, no useMemo)
    fields, fieldErrors, isDirty, status, editorRef, onEditorReady, onDocumentUpdate,
    setField, toggleTopic, submit, remove, metadata, isLoading, isError, isSubmitting,
    isDeleting, isEdit, refetch
```

This is ~180 lines total (less than the current 260). Every line serves an identifiable purpose. No generic abstraction. No vocabulary that doesn't map to what it is.

---

## Exercise builder

The exercise builder is harder because it has multiple editors (prompt, explanation, N choice editors). It already inlines its own snapshot logic, which is correct in principle — it just needs the same cleanup as above.

Key differences:
- `readyEditorIds: Set<string>` to track which editors have mounted
- `expectedEditorIds` derived from the choice list (changes when choices are added/removed)
- `choiceEditorRefs: Map<string, TiptapEditorRef>` for the dynamic list
- Status becomes `'ready'` when ALL expected editors are ready AND loaded data is present (or it's a new exercise)

The `readyEditorIds` + `expectedEditorIds` approach is correct. It's just buried under the same `useMemo` / `useCallback` overcoating.

Apply the same treatments:
- `ExerciseScalars` → just `ExerciseFields` (internal concept only, no exported type)
- `ExerciseFormSnapshot` → assemble on demand at submit/dirty-check time
- `variant` → `apiLayer` injection (same pattern as above)
- Return plain object

`exercise-form-values.ts` can keep `areExerciseSnapshotsEqual` (the deep comparison logic is genuinely useful) but the types exported from it should flatten.

---

## Topic builder

Topic builder is the simplest. It uses `useSnapshotForm` with `hasDocumentField: false` and `TSnapshot = TScalars = TopicFormValues`. There's no TipTap. It's scalar-only.

After `useSnapshotForm` is removed, this hook needs:
- `const [fields, setFields] = useState<TopicFormValues>(emptyValues);`
- `const [savedFields, setSavedFields] = useState<TopicFormValues | null>(null);`
- `useEffect` to seed from loaded data
- `const isDirty = !areTopicFormValuesEqual(fields, savedFields ?? emptyValues);`

No TipTap mechanics at all. Five lines replaces the `useSnapshotForm` integration. Topic builder also has its own inline `mapZodFieldErrors` — it can just use the shared `mapZodFieldErrorsFlat` now that it exists.

---

## What to delete

- `src/common/form/use-snapshot-form.ts` — after all three builders are updated
- `src/common/form/use-form-guard.ts` — trivial re-export; callers can just use `useUnsavedChangesGuard` directly (one less indirection layer)
- `QuestionScalars` and `QuestionFormSnapshot` type exports from `question-form-values.ts`
- `toQuestionSnapshot` from `question-form-values.ts`
- `areQuestionFormValuesEqual` (deprecated, unused)
- Same corresponding types from `exercise-form-values.ts`

---

## What NOT to do

- Don't create a new generic hook (e.g. `useBuilderForm<T>`). The three builders have different enough mechanics that the generic will immediately need escape hatches.
- Don't create a factory for `apiLayer` objects. They're just typed object literals. Two of them per entity (user + admin). Just define them next to the API files.
- Don't add a `BuilderContext`. The hooks are already localized to their page; React context solves a prop-drilling problem that doesn't exist here.
- Don't `useCallback` everything in the return by default. Wrap in `useCallback` only where the reference is passed as a prop to a component that is separately memoized (i.e., practically never in this codebase given the pages are already re-rendering on every field change).
- Don't memoize the return object. Its consumer re-renders on every field change anyway.

---

## Order of operations

1. **Question builder** — full rewrite, establish the pattern
   - Rewrite `question-form-values.ts` (simplify types)
   - Rewrite `useQuestionBuilderForm.ts` (inline state, inject api layer)
   - Define `userQuestionApiLayer` and `adminQuestionApiLayer` (probably in `theory/builder/api/` and `admin/questions/api/` respectively)
   - Update `QuestionBuilderPage` to pass `apiLayer` instead of `variant`
   - Update `SystemQuestionBuilderPage` to pass `adminQuestionApiLayer`

2. **Topic builder** — simplest, good second step
   - Remove `useSnapshotForm` usage, inline scalar logic
   - Use shared `mapZodFieldErrorsFlat` instead of local copy

3. **Exercise builder** — most complex, but the pattern is already established by question builder
   - Rewrite `exercise-form-values.ts`
   - Rewrite `useExerciseBuilderForm.ts`
   - Define `userExerciseApiLayer` and `adminExerciseApiLayer`
   - Update pages

4. **Delete** `use-snapshot-form.ts` and `use-form-guard.ts`

Each step is independently shippable and doesn't break the others. Start with question builder; if it looks good, proceed.
