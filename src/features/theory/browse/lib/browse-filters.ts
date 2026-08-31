export type BrowseKind = 'all' | 'questions' | 'exercises';
export type BrowseSavedFilter = 'all' | 'new' | 'saved';

export function parseBrowseKind(value: string | undefined): BrowseKind {
  if (value === 'questions' || value === 'exercises') {
    return value;
  }

  return 'all';
}

export function browseHref(kind: BrowseKind): '/browse' | '/browse?kind=questions' | '/browse?kind=exercises' {
  if (kind === 'questions') {
    return '/browse?kind=questions';
  }

  if (kind === 'exercises') {
    return '/browse?kind=exercises';
  }

  return '/browse';
}

export function matchesSaved(isSaved: boolean, filter: BrowseSavedFilter) {
  if (filter === 'new') {
    return !isSaved;
  }

  if (filter === 'saved') {
    return isSaved;
  }

  return true;
}
