# JobPrepOS — Exercises Direction

## What Exercises Are

Exercises are the fast-paced sibling of Theory Practice.

Theory questions ask the user to construct and preserve an open-ended answer, then reveal a reference answer and self-assess it. Exercises ask for a small, structured response that the server can grade immediately. The core loop is:

1. Show an exercise.
2. Accept a quick response.
3. Grade it and show the correction or explanation.
4. Move to the next exercise.

The purpose is repetition and quick recognition, not long-form explanation. Examples include predicting code output, identifying an error, or choosing the correct behavior from several options.

Exercises are a separate product domain from theory questions. They may share infrastructure and concepts, but they should not be forced into one generic content table or one polymorphic attempt system.

## V1 Scope

V1 supports multiple-choice exercises only.

An exercise needs:

- ownership and visibility;
- an exercise type;
- a rich-text prompt;
- ordered answer choices;
- the correct choice or choices;
- an optional rich-text explanation;
- topics and timestamps.

The schema should leave room for future types such as fill-in-the-blank or matching, but those types and their behavior should not be implemented now. Build the concrete multiple-choice workflow cleanly instead of designing a speculative universal exercise engine.

## Ownership, Discovery, and Personal Repositories

Exercises follow the same content model as theory questions:

- A null owner means system-owned content maintained by admins.
- User-owned content may be private or public.
- Public exercises can be discovered and saved by other users.
- Saving an exercise adds it to the user's personal exercise repository; it does not copy or fork the exercise.
- A user's own exercises belong in their repository naturally.

Keep exercise repository membership separate from theory repository membership. They are distinct user-facing collections even though their ownership rules are the same.

## Shared Concepts and the Existing Production Data

Topics classify knowledge areas such as JavaScript, React, CSS, and PostgreSQL. Those topics apply equally to theory questions and exercises. The existing “theory category” names are therefore too narrow and should be renamed in place:

- `app.theory_categories` → `app.topics`
- `app.theory_question_categories` → `app.theory_question_topics`
- `app.theory_question_topics.category_id` → `topic_id`

The result values `incorrect`, `partial`, and `correct` also make sense across both practice modes, so rename:

- `app.theory_attempt_result` → `app.attempt_result`

These are vocabulary changes, not a redesign of existing theory data. Preserve every production row, UUID, relationship, question, and attempt. Use a new migration that renames the existing database objects; do not recreate the tables, copy the data, or edit an already-applied migration.

`app.theory_questions` and `app.theory_attempts` remain theory-specific tables. The many-to-many topic join also remains intentional because one question or exercise can belong to multiple topics.

## Exercise Data Direction

Model Exercises with explicit tables that mirror the product concepts:

- `exercises`: common exercise content, ownership, visibility, type, prompt, explanation, and timestamps.
- `exercise_topics`: many-to-many links between exercises and shared `topics`.
- `exercise_choices`: ordered multiple-choice options and the authoritative correctness data.
- `exercise_library_items`: exercises saved to each user's repository.
- `exercise_attempts`: the user's submitted structured response, derived result, and timestamp.

Use the existing Tiptap JSONB content convention where rich content is useful, including prompts, choices, and explanations. Store the submitted response in a structured form such as JSONB so later exercise types can represent different answer shapes without changing the meaning of the attempt ledger.

Theory attempts and exercise attempts must stay separate. A theory attempt contains a long-form response and a self-assigned result; an exercise attempt contains a structured response and a server-derived result. Combining them would hide materially different rules behind nullable columns and type branches.

## Grading and Answer Security

The server is authoritative for grading.

Before submission, the client must not receive choice correctness flags or the private explanation. The client submits only the selected choice IDs. The server loads the authoritative exercise and choices, evaluates the response, records the attempt, and returns the result plus the correction or explanation.

Do not trust a client-supplied result, and do not embed the answer in initial page data where it can be inspected before answering.

## Product Surfaces

Exercises should ultimately have the same broad surfaces as Theory Practice, adapted to their faster loop:

- a personal exercise repository;
- a public/system exercise browser with save actions;
- an exercise builder for users and appropriate admin management;
- a focused, one-at-a-time practice view;
- per-exercise attempt history and simple result counts.

The first implementation should be a complete vertical slice: schema and migration, server queries and mutations, validation and authorization, then the smallest coherent UI needed to create, find, save, practice, grade, and revisit multiple-choice exercises.

Follow the codebase's established server-only database access, explicit authorization, query patterns, rich-text handling, component conventions, and visual language. Do not introduce recommendation engines, familiarity scores, spaced repetition, streaks, points, automated study plans, or session analytics. The value of V1 is a dependable repository and attempt ledger with a quick practice loop.
