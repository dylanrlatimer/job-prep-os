export function formatSessionDate(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function sessionTopicLabel(topicNames: string[], allTopicsLabel: string) {
  return topicNames.length > 0 ? topicNames.join(' · ') : allTopicsLabel;
}
