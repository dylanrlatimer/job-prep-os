import SessionHistoryDetailPage from '@/features/practice/sessions/components/SessionHistoryDetailPage';

type SessionHistoryDetailRoutePageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function SessionHistoryDetailPageEntry({ params }: SessionHistoryDetailRoutePageProps) {
  const { sessionId } = await params;
  return <SessionHistoryDetailPage sessionId={sessionId} />;
}
