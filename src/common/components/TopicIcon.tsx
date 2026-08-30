import { cn } from '@/lib/cn';
import { isTopicIconKey } from '@/common/topics/icon-keys';
import { TopicIconMark } from '@/common/topics/icons';

type TopicIconProps = {
  iconKey: string | null | undefined;
  className?: string;
};

export default function TopicIcon({ iconKey, className }: TopicIconProps) {
  if (!isTopicIconKey(iconKey)) {
    return null;
  }

  return <TopicIconMark iconKey={iconKey} className={cn('mr-1.5 size-3 shrink-0', className)} />;
}
