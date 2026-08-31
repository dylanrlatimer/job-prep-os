import type { ComponentProps } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';

type BackLinkProps = {
  href: ComponentProps<typeof Link>['href'];
  label: string;
};

export default function BackLink({ href, label }: BackLinkProps) {
  return (
    <Link href={href} className='inline-flex items-center gap-1 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground'>
      <ChevronLeft size={16} strokeWidth={1.75} aria-hidden='true' />
      {label}
    </Link>
  );
}
