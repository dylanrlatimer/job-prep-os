import BrowsePage from '@/features/theory/browse/components/BrowsePage';
import { parseBrowseKind } from '@/features/theory/browse/lib/browse-filters';

type PageProps = {
  searchParams: Promise<{ kind?: string }>;
};

export default async function BrowsePageEntry({ searchParams }: PageProps) {
  const params = await searchParams;
  return <BrowsePage initialKind={parseBrowseKind(params.kind)} />;
}
