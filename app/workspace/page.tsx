import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { WorkspaceClient } from '@/components/workspace-client';

export const metadata = {
  title: 'Workspace · Memoist',
};

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: { project?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect('/signin?next=/workspace');

  return <WorkspaceClient user={user} initialProjectId={searchParams.project ?? null} />;
}
