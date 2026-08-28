import AppHeader from './AppHeader';

type AppShellProps = {
  children?: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className='flex min-h-screen flex-col bg-canvas'>
      <AppHeader />
      <main className='flex-1'>{children}</main>
    </div>
  );
}
