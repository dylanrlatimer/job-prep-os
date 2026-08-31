'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import TopicIcon from '@/common/components/TopicIcon';
import { useFilteredTopics } from '@/common/hooks/use-filtered-topics';
import { useValidationMessage } from '@/common/hooks/use-validation-message';
import type { BuilderTopic } from '@/features/theory/builder/api/contracts';
import { cn } from '@/lib/cn';

type TopicsPickerFieldProps = {
  topics: BuilderTopic[];
  selectedIds: string[];
  onToggle: (topicId: string) => void;
  error?: string;
  labels: {
    fieldLabel: string;
    searchLabel: string;
    searchPlaceholder: string;
    noTopicsMessage: string;
    noResultsMessage: string;
  };
};

export default function TopicsPickerField({ topics, selectedIds, onToggle, error, labels }: TopicsPickerFieldProps) {
  const [query, setQuery] = useState('');
  const filteredTopics = useFilteredTopics(topics, query);
  const errorMessage = useValidationMessage(error);
  const hasTopics = topics.length > 0;

  return (
    <div data-field='topicIds'>
      <span className='mb-1.5 block text-xs text-secondary-foreground'>{labels.fieldLabel}</span>

      {!hasTopics ? (
        <p className='m-0 text-sm text-muted-foreground'>{labels.noTopicsMessage}</p>
      ) : (
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
          <div className='scrollbar-branded h-48 overflow-y-auto'>
            {filteredTopics.length === 0 ? (
              <p className='m-0 px-3 py-4 text-sm text-muted-foreground'>{labels.noResultsMessage}</p>
            ) : (
              <ul className='m-0 list-none p-0'>
                {filteredTopics.map((topic, index) => {
                  const checked = selectedIds.includes(topic.id);
                  const inputId = `topic-${topic.id}`;

                  return (
                    <li key={topic.id} className={cn(index > 0 && 'border-t border-border')}>
                      <label htmlFor={inputId} className='flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-card-muted'>
                        <input
                          id={inputId}
                          type='checkbox'
                          className='size-3.5 shrink-0 cursor-pointer accent-primary'
                          checked={checked}
                          onChange={() => onToggle(topic.id)}
                        />
                        <span className='inline-flex items-center gap-1.5 text-foreground'>
                          <TopicIcon iconKey={topic.iconKey} />
                          <span className='-translate-y-px'>{topic.name}</span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {errorMessage ? <span className='mt-1.5 block text-xs text-destructive-bright'>{errorMessage}</span> : null}
    </div>
  );
}
