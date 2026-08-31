import { cn } from '@/lib/cn';
import TopicIcon from '@/common/components/TopicIcon';

export type TopicListItem = {
  id: string;
  name: string;
  iconKey?: string | null;
};

type TopicListProps = {
  topics: TopicListItem[];
  className?: string;
  empty?: React.ReactNode;
};

export default function TopicList({ topics, className, empty }: TopicListProps) {
  if (topics.length === 0) {
    return empty ?? null;
  }

  return (
    <span className={cn('inline-flex flex-wrap items-center gap-x-2 gap-y-1', className)}>
      {topics.map((topic, index) => (
        <span key={topic.id} className='inline-flex items-center gap-x-2'>
          {index > 0 ? (
            <span aria-hidden='true' className='text-muted-foreground'>
              ·
            </span>
          ) : null}
          <span className='inline-flex items-center'>
            <TopicIcon iconKey={topic.iconKey} className='relative top-px' />
            <span>{topic.name}</span>
          </span>
        </span>
      ))}
    </span>
  );
}
