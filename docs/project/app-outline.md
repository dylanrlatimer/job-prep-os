# JobPrepOS — App Outline

## Purpose

JobPrepOS is a personal interview-preparation workspace that may eventually include Theory Practice, System Design, Soft Questions, Aim Trainer, and other focused practice tools.

The first version covers **Theory Practice only**. Its purpose is to replace an awkward collection of Markdown files and external question lists with a centralized repository where users can curate questions and keep a history of their answers.

The application records practice. It does not decide what the user should study, grade answers automatically, or calculate familiarity.

## Content Model

The platform contains three kinds of questions:

- **System questions:** Created and maintained by administrators for the shared question bank.
- **Public user questions:** Created by users and made available for others to add.
- **Private user questions:** Visible only to their creator.

A question exists once. Adding a shared question to a personal repository does not copy it; it records that the user has saved it.

Questions can belong to multiple categories, such as JavaScript, TypeScript, React, CSS, SQL, or PostgreSQL. They may also reference a general source and an exact source URL.

## Main Areas

### My Repository

The user's repository is the default Theory Practice view. It lists saved questions and supports:

- text search;
- category filtering;
- opening a question for practice;
- removing a question from the repository;
- viewing incorrect, partial, and correct attempt totals;
- creating a personal question;
- exporting attempt history to CSV.

Removing a question from the repository does not delete the question or its attempt history.

### Browse Questions

The browse area contains published system questions and published user questions. Users can search and filter the bank, inspect questions, and add useful ones to their repository.

The interface clearly indicates which questions are already saved. Private questions belonging to other users never appear.

### Question Builder

Users can create questions with:

- the question;
- a reference answer;
- one or more categories;
- an optional source;
- an optional exact source URL;
- private or public visibility.

New personal questions are automatically added to their creator's repository. Users can edit their own questions.

Duplicating or “forking” a question simply prefills the normal builder with its contents. The result is a new, unrelated question.

### Practice

The practice page is centered on one question. It shows the question, categories, and source while initially hiding the reference answer.

The user may write a response or answer aloud. They then reveal the reference answer, compare it with their response, and record the attempt as:

- incorrect;
- partial;
- correct.

The written response and notes are optional. Every submitted attempt is added to the question's ledger.

The same page shows result totals and the complete attempt history, including dates, results, previous responses, and notes. This lets the user see how their answer has changed over time without reducing that history to a familiarity score.

### Administration

Administrators have a plain management area for:

- sources;
- categories;
- system questions;
- publication state.

Normal users cannot create or modify system-owned content.

### CSV Export

Users can export only their own attempt ledger. The export includes the attempt date, question, categories, result, response, notes, and source information so it can be reviewed externally or provided to an LLM.

## Access Rules

- Authentication is required for Theory Practice.
- Users can always read and edit their own questions.
- Users can read published questions created by the system or other users.
- Users can modify only their own repository and attempts.
- Administrative operations require an administrator profile.
- Visibility and ownership are enforced by the server, not merely hidden in the interface.

## Interface Direction

The interface is a restrained study tool rather than a dashboard or marketing site. It uses clear typography, ordinary lists, compact controls, dividers, and simple forms. Decorative gradients, glows, nested cards, oversized metrics, gamification, and unnecessary animation are avoided.

The question and its practice history remain the visual focus.

## Outside the Initial Version

The initial version does not include:

- LLM feedback or automatic grading;
- familiarity scores or study recommendations;
- spaced repetition;
- question version history or database-level fork tracking;
- named repositories or multiple collections per user;
- likes, comments, rankings, or social feeds;
- streaks, points, achievements, or other gamification;
- the other future JobPrepOS practice areas.

These may be considered only when a concrete product need appears.
