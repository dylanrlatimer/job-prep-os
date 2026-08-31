# Practice Sessions — Design Document

## Context

The current practice flow is per-question: navigate to a question, click Practice, answer, record, navigate away, manually pick the next question. That workflow is fine as a review mechanism for a specific item but poor as a training tool. The mental load of picking questions introduces bias and friction.

This document designs a **Practice Sessions** feature: a dedicated training mode where the app sequences questions and exercises at random, the user moves through them in a continuous flow, sessions can be saved and resumed, and completed sessions are kept as history.

The existing per-question practice pages remain. Sessions are a training mode layered on top; standalone practice remains useful for reviewing a specific item.

---

## UX Overview

### Practice section home (`/practice`)

- Lists the user's **active (in-progress) sessions**, each showing topics, content filter, progress (e.g. 15 / 42), and a **Resume** button.
- A **New Session** button.
- A link to **Session History** (`/practice/history`).

Active sessions accumulate if the user never finishes them. There is no auto-expire or abandon flow in v1 — old sessions simply stay resumable. A delete action can be added later.

### New session setup (`/practice/new`)

Two inputs:

1. **Topics** — multi-select. Shows only topics that have items in the user's combined repository. "All" is a toggle-all shortcut (includes topic-less items). Selecting specific topics excludes items with no topics.
2. **Content** — `All / Theory only / Exercises only`.

Submit is disabled if the resolved queue would be empty (validated before creating). On submit, queue is generated server-side, session is created, user is redirected to the session page.

### Session page (`/practice/sessions/[sessionId]`)

Always shows the **current item** — the first unanswered item by position. Progress indicator in the header: `3 / 24`. A **Save & Exit** button exits to `/practice` at any time.

Two rendering modes depending on the current item's `content_type`:

**Theory item:**

1. Question, topics, source are shown.
2. User optionally writes a response.
3. **Reveal Answer** → fetches the reference answer (and attempt history for context). No DB write yet.
4. Reference answer shown. User picks result (incorrect / partial / correct). Optional notes.
5. **Record & Next** → writes the attempt, advances to the next item.

**Exercise item:**

1. Title, prompt, choices, topics, source are shown.
2. User selects choices.
3. **Submit** → server grades, writes the attempt, returns result + explanation.
4. Result and explanation shown.
5. **Next** → advances to the next item.

A **Skip** button is available at any point before answering. Skipped items are permanent within the session — they do not requeue. They appear in session history as "Skipped." There is no "try again" within a session. Sessions are single-pass. Try-again is a standalone practice concept.

After the last item is answered or skipped, the session is marked complete and the user sees a **completion screen** with a summary (totals by result). A **View Session** link goes to the session history detail. The session then appears in history and no longer in the active sessions list.

### Session history (`/practice/history`)

List of completed sessions sorted by most recent. Each row: date, topics, content filter, item count, breakdown of incorrect / partial / correct / skipped.

Clicking a session opens a detail view showing every item with its result (or "Skipped"). This is read-only.

---

## Data Model

### New tables

```sql
create type app.practice_content_type as enum ('theory', 'exercise');
create type app.practice_session_status as enum ('active', 'completed');

create table app.practice_sessions (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references app.profiles(id) on delete cascade,
  status        app.practice_session_status not null default 'active',
  -- snapshot of what the user selected when creating the session
  topic_ids     uuid[] not null,
  content_filter text not null default 'all'
                  check (content_filter in ('all', 'theory', 'exercises')),
  created_at    timestamptz not null default now(),
  completed_at  timestamptz,
  updated_at    timestamptz not null default now()
);

create table app.practice_session_items (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references app.practice_sessions(id) on delete cascade,
  position            smallint not null,
  content_type        app.practice_content_type not null,
  content_id          uuid not null,
  -- filled in after the item is answered
  theory_attempt_id   uuid references app.theory_attempts(id),
  exercise_attempt_id uuid references app.exercise_attempts(id),
  answered_at         timestamptz,
  -- set to true if the user skipped this item; no attempt is created
  skipped             boolean not null default false,
  created_at          timestamptz not null default now(),

  unique (session_id, position),
  unique (session_id, content_type, content_id)  -- no item appears twice in a session
);
```

**Indexes:**

```sql
-- finding active sessions for a user
create index practice_sessions_profile_status_idx
  on app.practice_sessions (profile_id, status);

-- finding completed sessions for history
create index practice_sessions_profile_completed_idx
  on app.practice_sessions (profile_id, completed_at desc)
  where status = 'completed';

-- paging through a session in order
create index practice_session_items_session_position_idx
  on app.practice_session_items (session_id, position);

-- finding the current (first unanswered, non-skipped) item efficiently
create index practice_session_items_pending_idx
  on app.practice_session_items (session_id, position asc)
  where answered_at is null and skipped = false;
```

**RLS:** enable RLS, no policies (same default-deny pattern as every other `app` table).

### Relationship to existing attempt tables

Session items link to the **existing** `theory_attempts` and `exercise_attempts` tables. When a session item is answered, a normal attempt row is created (identical to standalone practice). The session item then stores the attempt id as its record.

Consequences:
- Per-question attempt history on the existing practice and detail pages reflects attempts from both standalone practice and sessions. This is desirable — attempt history is unified.
- `theory_attempt_id` and `exercise_attempt_id` are nullable until the item is answered. Exactly one of them is non-null on an answered item, depending on `content_type`. Enforced in application code, not a DB check constraint (the constraint would be unwieldy).
- Standalone attempts (not linked to any session item) and session attempts are indistinguishable at the attempt row level. If we ever need to tell them apart we add a `source` enum column to the attempt tables. Not needed in v1.

### The "current item" is derived, not stored

The current item = `min(position) where session_id = $id and answered_at is null and skipped = false`. No `current_position` column on the session. The partial index above makes this fast.

A "done" item is one where `answered_at is not null` (answered) or `skipped = true`. Session completion fires when no pending items remain.

Storing a position column would introduce the risk of it drifting out of sync. Derivation is one source of truth.

### Queue generation

On session create, server-side (inside a transaction):

1. Query `theory_library_items` for the user, joining through `theory_question_topics` to filter by selected topics (skip topic filter if "all topics").
2. Same for `exercise_library_items` through `exercise_topics`.
3. Apply the content filter (`theory`/`exercises`/`all`).
4. Validate the combined list is non-empty — return a validation error if not (so the client can handle it before inserting).
5. Fisher-Yates shuffle server-side.
6. Insert `practice_sessions` row.
7. Bulk-insert `practice_session_items` with sequential positions.
8. Return `{ id: session.id }`.

The queue is a snapshot. Questions or exercises added to the user's repo after the session is created do not appear in it. Deleted content leaves an orphaned `content_id` — the session page handles this gracefully (skip the item, mark it answered with no attempt, log a warning).

### What changes to existing tables

**Nothing structural.** The existing `theory_attempts`, `exercise_attempts`, `theory_questions`, `exercises`, and related tables are untouched. The existing practice pages continue to work as-is.

The two new tables plus RLS enables are the entirety of the migration.

---

## Feature Code Structure

Following the multi-entity convention from `flow.md`:

```
features/
  practice/
    api/
      query-keys.ts        ← shared namespace: practiceKeys.all(), practiceKeys.sessions(), etc.
    server/
      access.ts            ← assertSessionOwnedBy, sessionAccess.ownedBy(userId)
    sessions/
      api/
        contracts.ts
        queries.ts
        mutations.ts
      server/
        create-session.ts
        get-session.ts          ← session + items + current item
        list-active-sessions.ts
        list-completed-sessions.ts
        get-session-history-detail.ts
        answer-theory-item.ts   ← creates theory_attempt, marks item answered, checks completion
        answer-exercise-item.ts ← creates exercise_attempt, marks item answered, checks completion
        skip-session-item.ts    ← sets skipped=true, checks completion
        get-session-item-review.ts  ← for theory: fetches reference answer (no DB write)
        delete-session.ts       ← optional v1+
      components/
        PracticeHomePage.tsx
        NewSessionPage.tsx
        SessionPage.tsx
        SessionItemTheory.tsx
        SessionItemExercise.tsx
        SessionCompletePage.tsx
        SessionHistoryPage.tsx
        SessionHistoryDetailPage.tsx
```

The existing `features/theory/practice/` and `features/exercises/practice/` are **not changed**. They remain the per-question standalone practice surface.

---

## API Surface

New routes under `app/api/practice/`:

| Method | Path | Operation |
|--------|------|-----------|
| `GET` | `/api/practice/sessions` | `listActiveSessions` |
| `POST` | `/api/practice/sessions` | `createSession` |
| `GET` | `/api/practice/sessions/[id]` | `getSession` (current item + progress) |
| `DELETE` | `/api/practice/sessions/[id]` | `deleteSession` (v1+) |
| `GET` | `/api/practice/sessions/[id]/items/[itemId]/review` | `getSessionItemReview` (theory only — fetch reference answer, no write) |
| `POST` | `/api/practice/sessions/[id]/items/[itemId]/answer` | `answerSessionItem` |
| `POST` | `/api/practice/sessions/[id]/items/[itemId]/skip` | `skipSessionItem` |
| `GET` | `/api/practice/history` | `listCompletedSessions` |
| `GET` | `/api/practice/history/[id]` | `getSessionHistoryDetail` |

### Key contracts

**`createSession` input:**
```ts
{
  topicIds: string[];         // [] means all topics
  contentFilter: 'all' | 'theory' | 'exercises';
}
```

**`getSession` response:**
```ts
{
  id: string;
  status: 'active' | 'completed';
  topicIds: string[];
  contentFilter: 'all' | 'theory' | 'exercises';
  progress: { answered: number; skipped: number; total: number };
  currentItem: SessionItem | null;  // null = session complete
}

type SessionItem = {
  id: string;
  position: number;
  contentType: 'theory' | 'exercise';
  content: TheoryItemContent | ExerciseItemContent;
}
```

**`answerSessionItem` input (theory):**
```ts
{
  result: 'incorrect' | 'partial' | 'correct';
  response: JSONContent | null;
  notes: JSONContent | null;
}
```

Response (both types):
```ts
{
  attemptId: string;
  sessionComplete: boolean;
}
```

The response does NOT include the next item. The next item is prefetched in the background while the user is on the correction/result screen (before they click Next). By the time they click, the next item is already cached. The `answerSessionItem` operation only needs to handle the write and signal whether the session is now complete.

**`getSessionItemReview` response (theory only):**
```ts
{
  answer: JSONContent;
  attempts: AttemptTotals;
  attemptHistory: PracticeAttempt[];
}
```
Identical in shape to the existing `PracticeReviewResponse`. The endpoint asserts the session item belongs to the user and is unanswered, but does not write anything.

**`answerSessionItem` for exercise:**
Input is the same as the existing `SubmitExerciseAnswerSchema`:
```ts
{ selectedChoiceIds: string[] }
```
Response adds `sessionComplete` to the existing `SubmitExerciseAnswerResponse` shape.

---

## Key Decisions

### Sessions link to existing attempt tables rather than storing results independently

Per-question history on the detail and standalone practice pages reflects all attempts regardless of origin. Keeping two separate result ledgers (one for sessions, one for standalone) would mean the detail pages only show standalone attempts, which would make them misleading over time.

The cost is a slightly more complex join when rendering session history, but that is manageable.

### Queue is pre-generated and stored at session start

Not generated on-the-fly each time. This guarantees:
- Consistent "no repeats" across resume gaps (even if the user adds more content to their repo mid-session).
- The exact sequence the user experiences is preserved in history.
- Resume is trivial: load the session, find the first unanswered item by position.

The downside is the session queue goes stale relative to the user's repo. This is acceptable — a session is a snapshot in time. New content is available in the next session.

### Theory and exercises are mixed by default

A session can contain both. Content filter gives the user the option to separate them. Mixing is the default because training benefits from variety and the user explicitly described it that way.

The session page detects `content_type` on the current item and renders the appropriate component.

### No "try again" within a session

Sessions are single-pass. Skipping and moving on is the mechanism for items you don't want to answer right now. If you want to retry, use standalone practice.

### One active session at a time is NOT enforced

Multiple active sessions are allowed. The Practice home lists all of them. This avoids forcing a disruptive choice ("complete or abandon your current session before starting a new one") that would interrupt the user when they want to shift focus.

### Session history is read-only

Completed sessions are a record. You can see each item's result and the topics, but you cannot replay or modify them.

### Current item is derived, not stored as a column

`min(position) where answered_at is null`. A partial index on `(session_id, position asc) where answered_at is null` keeps this fast. No risk of a stale position column.

### The existing per-question practice pages are unchanged

They remain valid for reviewing a specific item. Sessions and standalone practice are parallel surfaces that happen to share the same underlying attempt storage.

---

## What Does Not Change

- `theory_attempts` and `exercise_attempts` tables (no schema change).
- Existing practice routes and server functions under `features/theory/practice/` and `features/exercises/practice/`.
- Per-question attempt history on detail pages and standalone practice pages.
- The existing attempt totals (`incorrect / partial / correct`) on repository pages and question/exercise detail pages.
- All existing routes, API, and feature code.

---

## Navigation

New sidebar item between **Browse** and the existing **Settings** link:

```
Theory Practice
Exercises
Browse
> Practice        ← new
Settings
```

The label can be "Practice" or "Train" — TBD at implementation time.

New routes:

```
/practice                          → PracticeHomePage
/practice/new                      → NewSessionPage
/practice/sessions/[sessionId]     → SessionPage (or SessionCompletePage if complete)
/practice/history                  → SessionHistoryPage
/practice/history/[sessionId]      → SessionHistoryDetailPage
```

---

## Out of Scope (v1)

These are explicitly excluded and should not creep in:

- **Spaced repetition / familiarity scores.** Sessions are random. The app does not decide what to prioritize.
- **Smart ordering.** No weighting by past performance, recency, or error rate. Pure shuffle.
- **Session notes or summary text.** History shows results. No free-text session journal.
- **Sharing sessions.** Sessions belong to one user.
- **Multiple simultaneous sessions per topic set.** Nothing prevents it technically, but there's no designed deduplication.
- **Pausing at the item level.** If you exit mid-item (after reveal but before recording), that item is treated as unanswered when you resume.
- **Non-repository content in sessions.** Sessions pull only from the user's own repository. Browse-only items (not saved) are excluded.
- **Untagged item option in topic picker.** Items with no topics are included in "all topics" sessions but excluded when specific topics are chosen. A dedicated "Untagged" toggle can be added later.

---

## Resolved Decisions

1. **Deleted content during an active session.** `content_id` has no formal FK (it's polymorphic — either a theory question or an exercise). If content is deleted while a session is active, the content query returns nothing. Handle it at the UI level: skip the item, show a brief "this item is no longer available" note, advance automatically. No special DB mechanism needed.

2. **No `source` column on attempt tables.** Keeping it simple.

3. **Item prefetch during the correction/result screen.** As soon as the user lands on the correction screen (theory) or the result screen (exercise), silently prefetch the next session item in the background. When the user clicks "Record & Next" or "Next," the write is the only blocking operation — the next item renders immediately after. No perceptible transition gap.

4. **No minimum session size.** One item, a million items — up to the user.

---

*Last modified: 31/08/2026*
