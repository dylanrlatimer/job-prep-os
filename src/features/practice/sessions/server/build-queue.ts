import type { PreviewSessionResponse, SessionFill } from '@/features/practice/sessions/api/contracts';
import type { Inventory } from './load-inventory';

export type Allocation = {
  topicId: string;
  count: number;
};

export type QueuePick = {
  contentType: 'theory' | 'exercise';
  contentId: string;
  topicId: string;
};

export type BuiltQueue = {
  queue: QueuePick[];
  fills: SessionFill[];
};

type ContentType = QueuePick['contentType'];

type SharedItem = {
  contentType: ContentType;
  contentId: string;
  topicIds: string[];
};

function itemKey(contentType: ContentType, contentId: string) {
  return `${contentType}:${contentId}`;
}

function splitCount(n: number, exerciseRatio: number) {
  const exercises = Math.round((n * exerciseRatio) / 100);
  return { exercises, theory: n - exercises };
}

export function shuffle<T>(items: T[]): T[] {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = next[index]!;
    next[index] = next[swapIndex]!;
    next[swapIndex] = current;
  }

  return next;
}

function takeRandom<T>(pool: T[], count: number): T[] {
  if (count <= 0 || pool.length === 0) {
    return [];
  }

  return shuffle(pool).slice(0, Math.min(count, pool.length));
}

function remainingNeed(count: number, picks: QueuePick[]) {
  return count - picks.length;
}

export function fillsToPreview(fills: SessionFill[]): PreviewSessionResponse {
  return {
    total: fills.reduce((sum, fill) => sum + fill.filled, 0),
    exercises: fills.reduce((sum, fill) => sum + fill.exercises, 0),
    theory: fills.reduce((sum, fill) => sum + fill.theory, 0),
    topics: fills,
  };
}

export function buildQueue(allocations: Allocation[], inventory: Inventory, exerciseRatio: number): BuiltQueue {
  const selectedTopicIds = allocations.map((allocation) => allocation.topicId);
  const selected = new Set(selectedTopicIds);

  const itemTopics = new Map<string, { contentType: ContentType; contentId: string; topicIds: Set<string> }>();

  for (const topicId of selectedTopicIds) {
    const topicInventory = inventory.get(topicId) ?? { theory: [], exercise: [] };

    for (const contentId of topicInventory.theory) {
      const key = itemKey('theory', contentId);
      const existing = itemTopics.get(key) ?? { contentType: 'theory' as const, contentId, topicIds: new Set<string>() };
      existing.topicIds.add(topicId);
      itemTopics.set(key, existing);
    }

    for (const contentId of topicInventory.exercise) {
      const key = itemKey('exercise', contentId);
      const existing = itemTopics.get(key) ?? { contentType: 'exercise' as const, contentId, topicIds: new Set<string>() };
      existing.topicIds.add(topicId);
      itemTopics.set(key, existing);
    }
  }

  const exclusive = new Map<string, { theory: string[]; exercise: string[] }>();
  const shared: SharedItem[] = [];

  for (const topicId of selectedTopicIds) {
    exclusive.set(topicId, { theory: [], exercise: [] });
  }

  for (const item of itemTopics.values()) {
    const topicIds = [...item.topicIds].filter((topicId) => selected.has(topicId));

    if (topicIds.length === 1) {
      exclusive.get(topicIds[0]!)?.[item.contentType].push(item.contentId);
      continue;
    }

    if (topicIds.length > 1) {
      shared.push({ contentType: item.contentType, contentId: item.contentId, topicIds });
    }
  }

  const picksByTopic = new Map<string, QueuePick[]>();
  const needByTopic = new Map<string, { exercises: number; theory: number }>();

  for (const allocation of allocations) {
    picksByTopic.set(allocation.topicId, []);
    needByTopic.set(allocation.topicId, splitCount(allocation.count, exerciseRatio));
  }

  const takeForTopic = (topicId: string, contentType: ContentType, pool: string[], count: number) => {
    const picks = picksByTopic.get(topicId);
    if (!picks || count <= 0) {
      return;
    }

    const taken = takeRandom(pool, count);
    const takenSet = new Set(taken);
    for (let index = pool.length - 1; index >= 0; index -= 1) {
      if (takenSet.has(pool[index]!)) {
        pool.splice(index, 1);
      }
    }

    for (const contentId of taken) {
      picks.push({ contentType, contentId, topicId });
    }
  };

  for (const allocation of allocations) {
    const pools = exclusive.get(allocation.topicId) ?? { theory: [], exercise: [] };
    const need = needByTopic.get(allocation.topicId)!;
    const picks = picksByTopic.get(allocation.topicId)!;

    const currentExercises = () => picks.filter((pick) => pick.contentType === 'exercise').length;
    const currentTheory = () => picks.filter((pick) => pick.contentType === 'theory').length;

    takeForTopic(allocation.topicId, 'exercise', pools.exercise, need.exercises - currentExercises());
    takeForTopic(allocation.topicId, 'theory', pools.theory, need.theory - currentTheory());
    takeForTopic(allocation.topicId, 'exercise', pools.exercise, remainingNeed(allocation.count, picks));
    takeForTopic(allocation.topicId, 'theory', pools.theory, remainingNeed(allocation.count, picks));
  }

  for (const item of shuffle(shared)) {
    const eligible = allocations.filter((allocation) => {
      if (!item.topicIds.includes(allocation.topicId)) {
        return false;
      }

      return remainingNeed(allocation.count, picksByTopic.get(allocation.topicId) ?? []) > 0;
    });

    if (eligible.length === 0) {
      continue;
    }

    const wantingType = eligible.filter((allocation) => {
      const need = needByTopic.get(allocation.topicId)!;
      const picks = picksByTopic.get(allocation.topicId)!;
      const filledOfType = picks.filter((pick) => pick.contentType === item.contentType).length;
      const wanted = item.contentType === 'exercise' ? need.exercises : need.theory;
      return filledOfType < wanted;
    });

    const candidates = wantingType.length > 0 ? wantingType : eligible;
    const maxRemaining = Math.max(...candidates.map((allocation) => remainingNeed(allocation.count, picksByTopic.get(allocation.topicId) ?? [])));
    const neediest = candidates.filter((allocation) => remainingNeed(allocation.count, picksByTopic.get(allocation.topicId) ?? []) === maxRemaining);
    const chosen = takeRandom(neediest, 1)[0];

    if (!chosen) {
      continue;
    }

    picksByTopic.get(chosen.topicId)!.push({
      contentType: item.contentType,
      contentId: item.contentId,
      topicId: chosen.topicId,
    });
  }

  const fills: SessionFill[] = allocations.map((allocation) => {
    const picks = picksByTopic.get(allocation.topicId) ?? [];
    const exercises = picks.filter((pick) => pick.contentType === 'exercise').length;

    return {
      topicId: allocation.topicId,
      requested: allocation.count,
      filled: picks.length,
      exercises,
      theory: picks.length - exercises,
    };
  });

  return {
    queue: shuffle(allocations.flatMap((allocation) => picksByTopic.get(allocation.topicId) ?? [])),
    fills,
  };
}
