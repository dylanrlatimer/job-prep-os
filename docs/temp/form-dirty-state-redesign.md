# Form dirty state + TipTap: first-principles redesign

> **Status:** Implemented. See `use-snapshot-form`, `TiptapEditor`, and builder form hooks.

---

## 1. What we actually want

**Dirty** means: *the user has made changes they would lose by navigating away.*

That is not the same as:

- React state differing from the API response bytes
- TipTap's internal document differing from what Postgres stored
- A normalization pass having run

Dirty is about **user intent**. The navigation guard should fire only when leaving would discard meaningful user edits.

**Ready** means: *the form is fully initialized and we can reason about dirty state.* Before ready, dirty is always false — there is nothing to protect yet.

**Submit** means: *read the current form snapshot, validate it, send it.* Submit is a read operation at a point in time, not a continuous sync.

These three concepts — dirty, ready, submit — are the entire contract. Everything else is implementation.

---

## 2. What worked before TipTap

The category builder (and the original question builder for scalar fields) follows a simple, correct model:

```
API load → set values + baseline (same shape)
User edits → setField updates values only
isDirty = !equal(values, baseline)
Save success → allowNavigation + redirect
Page → useUnsavedChangesGuard(isDirty && !loading)
```

Properties that make this work:

| Property | Why it matters |
|---|---|
| **Single source of truth** | `values` is the only live state. Inputs are controlled from it. |
| **Homogeneous fields** | Every field is a primitive React can own (string, boolean). |
| **Synchronous equality** | `===` or simple comparison. No async init, no normalization. |
| **Baseline set once at load** | Load effect sets both `values` and `baseline`. Done. |
| **Guard is dumb** | Page passes a boolean. Provider doesn't know about forms. |

This is a good system. It should be preserved and generalized, not replaced.

---

## 3. What broke when TipTap was added

TipTap was integrated as a **controlled React input**:

```tsx
<TiptapEditor value={values.answer} onChange={(json) => setField('answer', json)} />
```

This treats ProseMirror's document like a `<textarea>`. It is not one.

### 3.1 Dual ownership

After integration, answer content lived in two places:

1. React state (`values.answer`)
2. TipTap's internal ProseMirror document

A `useEffect` in `TiptapEditor` constantly reconciles them (`setContent` when props change). That is a sync layer between two sources of truth — a classic source of bugs.

Scalar fields don't need this. The input *is* the state.

### 3.2 Wrong baseline timing

On edit load:

1. API returns answer JSON
2. Form sets `values` and `baseline` from API
3. TipTap mounts and **normalizes** the document
4. Normalized JSON ≠ API JSON (structure, empty nodes, property ordering)
5. Editor pushes normalized JSON into `values` via `onChange`
6. `baseline` still holds API version → **false dirty**

The baseline was captured from the wrong layer (wire format) at the wrong time (before the editor existed).

### 3.3 The patch stack (what we have now)

Each layer tried to fix symptoms without changing the ownership model:

| Layer | What it tried to fix | Why it's still wrong |
|---|---|---|
| `readyRef` | Block onChange during init | Gate opens before async TipTap transactions finish |
| `isHydrated` | Don't mount editor before API data | Doesn't fix dual ownership after mount |
| `onReady` + `syncAnswerBaseline` | Re-align baseline to editor JSON | Form hook now knows about editor lifecycle |
| `acceptsChangesRef` | Suppress spurious onChange | Editor has 4 refs managing form coordination |
| `isInternalValueChangeRef` | Distinguish user vs programmatic | Effect dependency on `value` object identity |
| `lastEstablishedJsonRef` | Prevent onReady loops | Loops exist because controlled loop shouldn't exist |
| `queueMicrotask` | Wait for normalization | Timing hack, not a contract |

The editor component is doing form-state management. The form hook is doing editor lifecycle management. Responsibilities are inverted and duplicated.

---

## 4. First-principles data flow

### 4.1 Field taxonomy

Not all form fields are the same. The system should admit two field kinds:

**Scalar fields** — React-owned, controlled, synchronously comparable:
- `question` (string)
- `sourceName`, `sourceUrl` (string)
- `isPublic` (boolean)
- `categoryIds` (string[], order-independent compare)

**Document fields** — Editor-owned, read imperatively, canonically serialized for compare:
- `answer` (TipTap JSON → stable string for equality)

Dirty detection must use the right strategy per kind. One `JSON.stringify` in a generic `areEqual` is a smell — it's a document-field concern leaking into a generic comparator.

### 4.2 Ownership rules

```
┌─────────────────────────────────────────────────────────┐
│                     Form hook                           │
│                                                         │
│  Scalar state (React useState)                          │
│    question, sourceName, sourceUrl, isPublic,           │
│    categoryIds                                          │
│                                                         │
│  Document handle (ref to editor, NOT React state)       │
│    answer → read via editorRef.getDocument()            │
│                                                         │
│  Baseline snapshot (taken once when form → ready)       │
│    scalars from API + answer from editor after init     │
│                                                         │
│  status: 'loading' | 'ready' | 'submitting'             │
└─────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
   <input value={...}>          <TiptapEditor
                                  initialContent={...}
                                  ref={editorRef}
                                />
```

**Rule 1:** Document content is not stored in React state during editing.

**Rule 2:** Baseline for document fields is captured from the editor after init, not from the API.

**Rule 3:** `onChange` on every keystroke is for UI reactivity if needed — not for dirty tracking. Dirty is computed by snapshot comparison on demand or on editor `update` events.

**Rule 4:** Submit reads a full snapshot at click time: `{ ...scalars, answer: editorRef.getJSON() }`.

### 4.3 The snapshot model

Replace `values` vs `baseline` parallel state with explicit snapshots:

```ts
type FormSnapshot = {
  question: string;
  answer: JSONContent;
  categoryIds: string[];
  sourceName: string;
  sourceUrl: string;
  isPublic: boolean;
};

type FormController = {
  status: 'loading' | 'ready' | 'submitting';
  isDirty: boolean;
  setScalar: <K>(field: K, value: ...) => void;
  scalars: ScalarFields;           // for controlled inputs
  editorRef: TiptapEditorRef;      // for document field
  submit: () => SubmitResult;
};
```

**On load (edit):**
1. `status = 'loading'`
2. API returns → store `pendingLoad` scalars, pass `initialContent` to editor
3. Editor mounts, parses content, fires `onEditorReady`
4. Take `committedSnapshot` = `{ ...pendingLoad scalars, answer: editor.getJSON() }`
5. `status = 'ready'`

**On user edit:**
- Scalar: update React state
- Document: editor mutates internally (no React state update for answer)
- Recompute: `isDirty = !snapshotsEqual(committedSnapshot, currentSnapshot())`

**`currentSnapshot()`** is a function, not stored state:

```ts
function currentSnapshot(): FormSnapshot {
  return {
    ...scalars,
    answer: editorRef.current.getJSON(),
  };
}
```

**On save success:**
- `committedSnapshot = currentSnapshot()`
- `isDirty = false`
- `allowNavigation(...)`

**Guard condition:**
```ts
useUnsavedChangesGuard(status === 'ready' && isDirty);
```

No `isHydrated`. No `!isLoading && !isError && isHydrated`. Status machine encodes it.

### 4.4 Canonical serialization for documents

Document equality must not use raw `JSON.stringify` on arbitrary API/editor objects.

Introduce one utility:

```ts
// lib/tiptap/serialize-document.ts
function serializeDocument(doc: JSONContent): string;
function documentsEqual(a: JSONContent, b: JSONContent): boolean;
```

This is the single place that knows how to compare TipTap docs. Used for:
- Dirty check
- Tests
- Optionally: server-side normalization on save

If TipTap normalizes on load, both sides of the comparison go through the same path — committed snapshot was taken *from the editor*, so they start equal by construction.

---

## 5. TipTap component contract (redesigned)

The editor should be a **leaf component**, not a form coordinator.

### Current (bad)

```tsx
<TiptapEditor
  value={values.answer}
  onChange={(json) => setField('answer', json)}
  onReady={syncAnswerBaseline}
/>
```

### Proposed (clean)

```tsx
<TiptapEditor
  ref={editorRef}
  initialContent={loadedAnswer}   // set once, never controlled
  disabled={status !== 'ready'}
/>
```

**`TiptapEditorRef` exposes:**
- `getJSON(): JSONContent`
- `isEmpty(): boolean`
- optionally `focus()`

**`TiptapEditor` accepts:**
- `initialContent: JSONContent | null` — applied once on mount (or when `initialContentKey` changes for a new question id)
- `disabled?: boolean`
- `onUpdate?: () => void` — optional, fire-and-forget signal to parent to recompute dirty (no payload — parent reads from ref)

**`TiptapEditor` does NOT:**
- Accept `value` + `onChange` (no controlled mode)
- Call `onReady` to fix parent's baseline
- Manage refs to distinguish internal vs external changes
- Run sync effects on every `value` reference change

When `questionId` changes (navigate from edit A to edit B), remount the editor via `key={questionId}` or reset via `initialContentKey`. Clean boundary.

---

## 6. Shared form infrastructure

The category builder and question builder share the same skeleton. Extract it once.

### 6.1 `useFormController<TScalars, TDocument>`

Generic hook responsible for:

| Concern | Owner |
|---|---|
| Load from query | `useFormController` |
| Status machine (`loading` → `ready`) | `useFormController` |
| Scalar state + setters | `useFormController` |
| Document ref passthrough | `useFormController` |
| `committedSnapshot` / `isDirty` | `useFormController` |
| Submit mutation wiring | Feature hook (`useQuestionBuilderForm`) |
| Zod validation | Feature hook |
| i18n toasts | Feature hook |

Category builder uses `useFormController` with no document field.

Question builder uses `useFormController` + document ref.

System question builder reuses the same question form controller (or shares the generic layer).

### 6.2 `useUnsavedChangesGuard` — keep as-is

The provider/guard layer is fine. It's orthogonal to form internals.

Only change: pages pass `status === 'ready' && isDirty` instead of a growing boolean expression.

Optionally: `useFormGuard(controller)` wrapper that reads `controller.canLeave` — one line at call site.

### 6.3 Equality registry

```ts
type FieldEquality<T> = (a: T, b: T) => boolean;

const scalarEquals = {
  string: (a, b) => a === b,
  boolean: (a, b) => a === b,
  idSet: (a, b) => sameIdSet(a, b),
  document: documentsEqual,
};
```

`snapshotsEqual` composes these. No monolithic `areQuestionFormValuesEqual` that happens to use `JSON.stringify` for one field.

---

## 7. Lifecycle diagram (target state)

```
                    ┌──────────┐
                    │ loading  │
                    └────┬─────┘
                         │ API data + editor onEditorReady
                         │ → take committedSnapshot
                         ▼
                    ┌──────────┐
         ┌─────────│  ready   │─────────┐
         │         └────┬─────┘         │
         │              │ user edits   │
         │              ▼              │
         │         isDirty=true        │
         │              │              │
         │    ┌─────────┴────────┐     │
         │    ▼                  ▼     │
         │  navigate         submit  │
         │  (guard)              │     │
         │    │                  ▼     │
         │    ▼            ┌───────────┐
         │  dialog?        │ submitting│
         │                 └─────┬─────┘
         │                       │ success
         │                       ▼
         │              committedSnapshot := current
         │              isDirty = false
         │              allowNavigation → leave
         └────────────────────────────────┘
```

---

## 8. What to delete (after redesign)

| Artifact | Reason |
|---|---|
| `values.answer` in React state | Editor owns document |
| `onChange` on `TiptapEditor` for form sync | Read imperatively |
| `onReady` / `syncAnswerBaseline` | Baseline from snapshot at ready boundary |
| `isHydrated` | Replaced by `status === 'ready'` |
| `acceptsChangesRef`, `isInternalValueChangeRef`, `lastEstablishedJsonRef` | No controlled loop |
| `queueMicrotask` in editor | No baseline coordination in editor |
| TipTap `value` prop + sync `useEffect` | Uncontrolled `initialContent` |
| `areQuestionFormValuesEqual` as monolith | Snapshot model + field equality registry |

---

## 9. What to keep

| Artifact | Reason |
|---|---|
| `UnsavedChangesProvider` + dialog | Correct, generic, unrelated to TipTap |
| `useUnsavedChangesGuard(isDirty)` | Correct interface |
| `useAllowUnsavedNavigation` on save | Correct |
| Scalar `setField` pattern | Works, fits snapshot model |
| `baseline` concept | Renamed to `committedSnapshot`, same idea |
| Load-from-query in feature hooks | Correct data source |
| Zod validation at submit | Correct — read snapshot, then validate |

---

## 10. Migration path (when implementing)

Do this in order. Each step is shippable and reduces complexity.

### Phase 1 — Snapshot without editor changes
- Introduce `FormSnapshot` type and `currentSnapshot()` in question form hook
- Keep controlled TipTap temporarily but stop using `values` vs `baseline` for answer in `isDirty`
- Compute dirty: scalars from state, answer from `values.answer` (still controlled)
- Removes nothing yet but establishes snapshot API

### Phase 2 — Uncontrolled editor
- Change `TiptapEditor` to `initialContent` + ref
- Remove answer from React state
- Remove all editor coordination refs and `onReady`
- `key={questionId}` on editor for clean remount per question
- `onEditorReady` → take committed snapshot including `editorRef.getJSON()`

### Phase 3 — Extract `useFormController`
- Pull status machine + snapshot + scalar state into shared hook
- Migrate category builder (no document field) to prove the abstraction
- Migrate question + system question builders

### Phase 4 — Document utilities
- `serializeDocument` / `documentsEqual` in `lib/tiptap/`
- Use everywhere comparisons happen
- Optional: normalize on server save for consistent storage

---

## 11. Testing strategy

The current system is hard to test because dirty state depends on React effect timing and TipTap init order.

Target system tests:

```ts
// Unit: documentsEqual
expect(documentsEqual(apiDoc, editorNormalizedDoc)).toBe(true);

// Unit: snapshotsEqual
const committed = { ...scalars, answer: emptyDoc };
expect(snapshotsEqual(committed, { ...scalars, answer: emptyDoc })).toBe(true);
expect(snapshotsEqual(committed, { ...scalars, answer: modifiedDoc })).toBe(false);

// Integration: form controller
// - load → ready → isDirty false
// - edit scalar → isDirty true
// - edit document (mock editor ref) → isDirty true
// - submit success → isDirty false
```

No `queueMicrotask` in tests. No mount/unmount timing games.

---

## 12. Summary

**Root issue:** TipTap was integrated as a controlled input into a form system designed for React-owned scalars. That created dual ownership, wrong baseline timing, and a pile of coordination hacks.

**Principle:** Scalars live in React state. Documents live in the editor. Dirty is snapshot comparison taken at the right boundary. The editor is a leaf; the form hook owns lifecycle.

**Not a solution:** More refs, more callbacks, more guards on guards, or moving the same hacks into "cleaner" files.

**Solution:** One snapshot model, one status machine, uncontrolled editor with imperative read, canonical document equality, shared form controller extracted from the pattern that already works for categories.

---

## Appendix: why the current fix "works" but shouldn't stay

The `onReady` + `syncAnswerBaseline` fix works because it eventually forces `values.answer` and `baseline.answer` to the same editor-normalized JSON. It patches the symptom (mismatch) without fixing the cause (dual ownership + wrong baseline layer).

It will break again when:
- A second rich text field is added (copy the hack?)
- Editor content is reset programmatically after load
- React Query refetches and updates `questionQuery.data` while user is editing
- Someone adds optimistic updates or autosave
- A developer assumes `values.answer` is always in sync with the editor (it isn't, during init)

The redesign makes these cases fall out naturally from the ownership model instead of requiring new patches.
