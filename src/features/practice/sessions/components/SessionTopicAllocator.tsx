'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import TopicIcon from '@/common/components/TopicIcon';
import { useFilteredTopics } from '@/common/hooks/use-filtered-topics';
import { inputClassName } from '@/common/styles/form';
import type { SessionSetupTopic } from '@/features/practice/sessions/api/contracts';
import { cn } from '@/lib/cn';

type SessionTopicAllocatorProps = {
  topics: SessionSetupTopic[];
  counts: Record<string, number>;
  onCountChange: (topicId: string, count: number) => void;
  labels: {
    fieldLabel: string;
    searchLabel: string;
    searchPlaceholder: string;
    noTopicsMessage: string;
    noResultsMessage: string;
    inventory: (topic: SessionSetupTopic) => string;
  };
};

function inventoryMax(topic: SessionSetupTopic) {
  return topic.theoryCount + topic.exerciseCount;
}

export default function SessionTopicAllocator({ topics, counts, onCountChange, labels }: SessionTopicAllocatorProps) {
  const [query, setQuery] = useState('');
  const filteredTopics = useFilteredTopics(topics, query);

  if (topics.length === 0) {
    return (
      <div>
        <span className='mb-1.5 block text-xs text-secondary-foreground'>{labels.fieldLabel}</span>
        <p className='m-0 text-sm text-muted-foreground'>{labels.noTopicsMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <span className='mb-1.5 block text-xs text-secondary-foreground'>{labels.fieldLabel}</span>
      <div className='overflow-hidden rounded-sm border border-border bg-card'>
        <div className='border-b border-border px-3 py-2'>
          <label className='relative block'>
            <span className='sr-only'>{labels.searchLabel}</span>
            <Search
              size={14}
              strokeWidth={1.75}
              className='pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-muted-foreground'
              aria-hidden='true'
            />
            <input
              type='search'
              className='w-full border-0 bg-transparent py-1 pr-1 pl-5 text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={labels.searchPlaceholder}
            />
          </label>
        </div>
        <div className='scrollbar-branded max-h-80 overflow-y-auto'>
          {filteredTopics.length === 0 ? (
            <p className='m-0 px-3 py-4 text-sm text-muted-foreground'>{labels.noResultsMessage}</p>
          ) : (
            <ul className='m-0 list-none p-0'>
              {filteredTopics.map((topic, index) => {
                const max = inventoryMax(topic);
                const value = counts[topic.id] ?? 0;

                return (
                  <li key={topic.id} className={cn(index > 0 && 'border-t border-border')}>
                    <div className='flex items-center gap-3 px-3 py-2.5'>
                      <div className='min-w-0 flex-1'>
                        <p className='m-0 inline-flex items-center text-sm text-foreground'>
                          <TopicIcon iconKey={topic.iconKey} />
                          <span className='-translate-y-px'>{topic.name}</span>
                        </p>
                        <p className='m-0 mt-1 text-xs text-muted-foreground'>{labels.inventory(topic)}</p>
                      </div>
                      <input
                        type='number'
                        min={0}
                        max={max}
                        step={1}
                        className={cn(inputClassName, 'w-16 shrink-0 px-2 py-1 text-right')}
                        value={value}
                        onChange={(event) => {
                          const next = Number(event.target.value);
                          if (!Number.isFinite(next)) {
                            return;
                          }

                          onCountChange(topic.id, Math.min(max, Math.max(0, Math.round(next))));
                        }}
                        aria-label={topic.name}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
