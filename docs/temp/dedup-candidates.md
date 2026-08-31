# Frontend Dedup Candidates

## 1. `Field` component — 4 identical copies
Defined inline in `QuestionBuilderPage`, `ExerciseBuilderPage`, `SystemQuestionBuilderPage`, `SystemExerciseBuilderPage`. Line-for-line identical: `label`, `htmlFor`, `error`, `children`, `useValidationMessage`. Move to `common/components/Field.tsx`.

## 2. `useFilteredTopics` hook — 4 identical copies
Same Fuse.js config (`keys: ['name', 'slug'], threshold: 0.35, ignoreLocation: true`) + same `useMemo` trim logic, defined in each of the four builder pages. Move to `common/hooks/use-filtered-topics.ts`.

## 3. Topics picker widget — 4 identical copies
The `data-field='topicIds'` block (search input with Search icon, scrollable checkbox list, `TopicIcon`, `topicsErrorMessage` span) is copied verbatim into all four builder pages. Extract to `common/components/TopicsPickerField.tsx`. Props: `topics: BuilderTopic[]`, `selectedIds: string[]`, `onToggle`, `error?`, labels.

## 4. Visibility fieldset — 4 identical copies
The private/public radio `<fieldset>` is identical across all four builder pages. Extract to `common/components/VisibilityField.tsx`.

## 5. Source citation block — 6 identical copies
```tsx
{data.sourceName ? (
  <span className='text-secondary-foreground'>
    {data.sourceUrl ? <a href={data.sourceUrl} ...>{data.sourceName}</a> : data.sourceName}
  </span>
) : null}
```
Appears in `PracticePage`, `ExercisePracticePage`, `QuestionDetailPage`, `ExerciseDetailPage`, `BrowseQuestionDetailPage`, `BrowseExerciseDetailPage`. Extract to `common/components/SourceCitation.tsx`.

## 6. Back-nav link — 8 identical copies
```tsx
<Link href='...' className='inline-flex items-center gap-1 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground'>
  <ChevronLeft size={16} strokeWidth={1.75} aria-hidden='true' />
  {label}
</Link>
```
Appears in every practice/detail/builder page (8 total). Extract to `common/components/BackLink.tsx` — props: `href`, `label`.

## 7. Page load error state — ~12 identical copies
```tsx
<AppShell>
  <div className='px-4 py-8 md:px-8'>
    <h1>...</h1>
    <p>{t('loadError')}</p>
    <button onClick={refetch} disabled={isFetching}>...</button>
  </div>
</AppShell>
```
Appears in every feature page. Extract to `common/components/PageLoadError.tsx` — props: `title`, `message`, `onRetry`, `isRetrying`, `retryLabel`, `retryingLabel`.

## 8. `hasAttempts` and `resultLabelKey` — duplicated in 4+ components
`hasAttempts` (checks `incorrect + partial + correct > 0`) is copy-pasted into `TheoryRepositoryPage`, `ExerciseRepositoryPage`, `PracticePage`, `ExercisePracticePage`, `QuestionDetailPage`, `ExerciseDetailPage`. `resultLabelKey` (maps result → i18n key suffix) is in 4 of those. Both belong in `features/theory/lib/attempt-result-styles.ts` (or a shared `common/lib/attempts.ts` since exercises now share the same type).

## 9. `AttemptTotals` in repository pages — local re-implementations
`TheoryRepositoryPage` and `ExerciseRepositoryPage` each define a local `AttemptTotals` component using `attemptCountClassName` directly, bypassing the shared `common/components/AttemptTotals`. The shared one requires pre-formatted label strings, which is why callers didn't use it. Fix by having the shared component accept `counts + t` or restructure to accept raw counts and a render prop, then delete both local components.

## 10. Repository pages — ~90% structural clone
`TheoryRepositoryPage` and `ExerciseRepositoryPage` are near-identical: same `matchesSearch`/`matchesTopic` logic (only `question.question` vs `exercise.title`), same filter/sort bar, same count strip, same empty/no-matches/list states, same error state. The row components (`QuestionRow` / `ExerciseRow`) are also structural mirrors. A generic `RepositoryPage` component parameterized on data + row renderer would eliminate most of both files.

## 11. Admin list pages — same structure, same pattern
`AdminQuestionsPage`, `AdminExercisesPage`, `AdminTopicsPage` all have the same two-tier `AdminGate` + Content split, same `matchesSearch`/`matchesTopic`/`matchesPublication` functions, same empty/hasNoMatches/list states, same error/loading pattern. Less of a full unification candidate than #10 (the row content diverges more), but the filter bar + list shell could share a common admin list layout.

## 12. `mapZodFieldErrors` — 4 near-identical copies
Defined in `useQuestionBuilderForm`, `useSystemQuestionBuilderForm` (line-for-line copy), `useExerciseBuilderForm`, `useSystemExerciseBuilderForm` (minor difference: joins path segments for nested choices). Extract to `common/lib/map-zod-field-errors.ts` with an optional `nestedPaths` flag.

## 13. Attempt history list — 3 near-identical copies
The `<ul>` history section in `QuestionDetailPage`, `PracticePage`, and `ExercisePracticePage` all share the same dated-entry structure (`formatDate · resultLabelKey`, bordered `li`, conditional response/notes rendering). Extract to `common/components/AttemptHistoryList.tsx`.

## 14. System builder hooks vs user builder hooks — structural mirrors with different wiring
`useSystemQuestionBuilderForm` is a near-copy of `useQuestionBuilderForm`, differing only in which API functions it calls and which cache invalidation it uses. Same for the exercise pair. Not a simple extraction, but worth noting: if a generic `useBuilderForm(options)` were parameterized on `{create, update, delete, invalidate, successRoute}`, all four hooks collapse into two (or one).

---

**Priority order (effort vs. impact):** #8 → #1 → #2 → #6 → #7 → #3 → #4 → #5 → #9 → #12 → #13 → #10 → #11 → #14
