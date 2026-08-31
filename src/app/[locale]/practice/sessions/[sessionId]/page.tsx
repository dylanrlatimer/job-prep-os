import SessionPage from '@/features/practice/sessions/components/SessionPage';

type SessionRoutePageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function SessionPageEntry({ params }: SessionRoutePageProps) {
  const { sessionId } = await params;
  return <SessionPage sessionId={sessionId} />;
}
