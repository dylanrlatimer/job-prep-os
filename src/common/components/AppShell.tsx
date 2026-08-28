import AppSidebar from './AppSidebar';

type AppShellProps = {
  children?: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className='flex min-h-screen flex-col bg-canvas md:flex-row'>
      <AppSidebar />
      <main className='min-w-0 flex-1'>{children}</main>
    </div>
  );
}
