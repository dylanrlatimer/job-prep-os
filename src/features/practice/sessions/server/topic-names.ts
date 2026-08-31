import 'server-only';

import { inArray } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { topicsInApp } from '@/lib/drizzle/schema';

export async function resolveTopicNames(topicIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(topicIds)];
  const names = new Map<string, string>();

  if (uniqueIds.length === 0) {
    return names;
  }

  const rows = await db
    .select({
      id: topicsInApp.id,
      name: topicsInApp.name,
    })
    .from(topicsInApp)
    .where(inArray(topicsInApp.id, uniqueIds));

  for (const row of rows) {
    names.set(row.id, row.name);
  }

  return names;
}

export function namesForTopicIds(topicIds: string[], names: Map<string, string>): string[] {
  return topicIds.map((id) => names.get(id)).filter((name): name is string => !!name);
}
