# JobPrepOS — App Outline

## Purpose

JobPrepOS is a personal interview-preparation workspace that may eventually include System Design, Soft Questions, Aim Trainer, and other focused practice tools.

The current product covers **Theory Practice** and **Exercises** (multiple-choice). Theory replaces scattered Markdown files and external question lists with a curated repository and self-assessed attempt history. Exercises are the fast sibling: structured prompts the server grades immediately.

The application records practice. It does not decide what the user should study or calculate familiarity. Theory answers are self-graded; exercise answers are graded by the server.

## Content Model

The platform contains three kinds of questions and three kinds of exercises:

- **App:** Created and maintained by administrators for the shared bank.
- **Public user:** Created by users and available for others to add.
- **Private user:** Visible only to their creator.

A question or exercise exists once. Adding shared content to a personal repository does not copy it; it records that the user has saved it. Theory and exercises use separate repositories and attempt ledgers.

Content can belong to multiple shared topics, such as JavaScript, TypeScript, React, CSS, SQL, or PostgreSQL. Items may also reference a general source and an exact source URL.

## Main Areas

### My Repository

The user's theory repository is the default Theory Practice view. It lists saved questions and supports:

- text search;
- topic filtering;
- opening a question for practice;
- removing a question from the repository;
- viewing incorrect, partial, and correct attempt totals;
- creating a personal question.

Removing a question from the repository does not delete the question or its attempt history.

### Browse

The browse area is a single shared bank for published questions and exercises. Users choose Questions or Exercises, then search and filter by topic, inspect items, and add useful ones to the matching personal repository.

The interface clearly indicates which items are already saved. Private content belonging to other users never appears.

### Question Builder

Users can create questions with:

- the question;
- a reference answer;
- optional topics (questions with none are shown as having no topics in the UI);
- an optional source;
- an optional exact source URL;
- private or public visibility.

New personal questions are automatically added to their creator's repository. Users can edit their own questions.

Duplicating or “forking” a question simply prefills the normal builder with its contents. The result is a new, unrelated question.

### Practice

The practice page is centered on one question. It shows the question, topics, and source while initially hiding the reference answer.

The user may write a response or answer aloud. They then reveal the reference answer, compare it with their response, and record the attempt as:

- incorrect;
- partial;
- correct.

The written response and notes are optional. Every submitted attempt is added to the question's ledger.

The same page shows result totals and the complete attempt history, including dates, results, previous responses, and notes. This lets the user see how their answer has changed over time without reducing that history to a familiarity score. Question detail pages also show totals and history for review.

### Exercises

Exercises follow the same repository, builder, and practice surfaces as theory, with a separate personal repository. Discovery uses the shared Browse area (filtered to Exercises).

Practice shows a multiple-choice prompt, accepts selected choices, and grades the attempt on the server. Correctness and any explanation are revealed only after submit. Result totals and attempt history are kept on the practice and detail pages.

Builders support a title, rich-text prompt, ordered choices (one or more correct), optional explanation, topics, source fields, and visibility. New personal exercises are added to the creator's repository automatically.

### Administration

Administrators have a plain management area for:

- topics (active or disabled);
- app questions;
- app exercises;
- publication state via public or private visibility.

Normal users cannot create or modify app-owned content.

## Access Rules

- Browse of published content is public. Guests land on Browse.
- Personal surfaces (repositories, practice, sessions, settings, administration) and all writes require authentication.
- Guests still see save and workspace actions. Those actions open sign-in rather than navigating or writing.
- Users can always read and edit their own questions and exercises.
- Users can read published content created by the app or other users.
- Users can modify only their own repositories and attempts.
- Administrative operations require an administrator profile.
- Visibility and ownership are enforced by the server, not merely hidden in the interface.

## Interface Direction

The interface is a restrained study tool rather than a dashboard or marketing site. It uses clear typography, ordinary lists, compact controls, dividers, and simple forms. Decorative gradients, glows, nested cards, oversized metrics, gamification, and unnecessary animation are avoided.

The question or exercise and its practice history remain the visual focus.

## Out of Scope

The current product does not include:

- LLM feedback or automatic grading of theory answers;
- familiarity scores or study recommendations;
- spaced repetition;
- question or exercise version history or database-level fork tracking;
- named repositories or multiple collections per user;
- likes, comments, rankings, or social feeds;
- streaks, points, achievements, or other gamification;
- CSV export of attempt history;
- non-multiple-choice exercise types;
- the other future JobPrepOS practice areas.

These may be considered only when a concrete product need appears.
