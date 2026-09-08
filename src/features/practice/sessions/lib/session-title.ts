import type { SessionAllocation } from '@/features/practice/sessions/api/contracts';

export function formatSessionDate(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function sessionTopicLabel(topics: SessionAllocation[], emptyLabel: string) {
  if (topics.length === 0) {
    return emptyLabel;
  }

  return topics.map((topic) => `${topic.name} ${topic.requested}`).join(' · ');
}
