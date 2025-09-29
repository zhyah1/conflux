"use client";

import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Briefcase,
  ListTodo,
  ShieldAlert,
  FolderKanban,
  Settings,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { ThemeToggle } from './theme-toggle';
import { useUser } from '@/app/user-provider';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/projects', icon: Briefcase, label: 'Projects' },
  { href: '/dashboard/tasks', icon: ListTodo, label: 'Tasks' },
  { href: '/dashboard/issues', icon: ShieldAlert, label: 'Issues' },
  { href: '/dashboard/documents', icon: FolderKanban, label: 'Documents' },
  { href: '/dashboard/users', icon: Users, label: 'Users', adminOnly: true },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function Nav() {
  const pathname = usePathname();
  const { user, profile } = useUser();

  const isAdmin = profile?.role === 'admin';

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo className="h-7 w-7 text-primary" />
          <span className="text-lg font-semibold font-headline">Conflux</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) {
              return null;
            }
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter>
        <ThemeToggle />
      </SidebarFooter>
    </>
  );
}
