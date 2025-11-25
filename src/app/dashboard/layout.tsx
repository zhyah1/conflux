import type { ReactNode } from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { Nav } from './components/nav';
import { Header } from './components/header';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <Nav />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex flex-1 flex-col gap-4 p-4 sm:gap-8 sm:p-8">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
