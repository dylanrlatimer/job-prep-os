import BrowsePage from '@/features/theory/browse/components/BrowsePage';

type PageProps = {
  searchParams: Promise<{ kind?: string }>;
};

function parseKind(value: string | undefined): 'questions' | 'exercises' {
  return value === 'exercises' ? 'exercises' : 'questions';
}

export default async function BrowsePageEntry({ searchParams }: PageProps) {
  const params = await searchParams;
  return <BrowsePage initialKind={parseKind(params.kind)} />;
}
