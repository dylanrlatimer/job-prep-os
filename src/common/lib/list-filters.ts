export function matchesText(haystack: string, search: string) {
  if (!search) return true;
  return haystack.toLowerCase().includes(search.toLowerCase());
}

export function matchesTopic<T extends { topics: Array<{ id: string }> }>(item: T, topicId: string | null) {
  if (!topicId) return true;
  return item.topics.some((topic) => topic.id === topicId);
}

export type PublicationFilter = 'all' | 'published' | 'draft';

export function matchesPublication(item: { isPublic: boolean }, publication: PublicationFilter) {
  if (publication === 'all') return true;
  if (publication === 'published') return item.isPublic;
  return !item.isPublic;
}
