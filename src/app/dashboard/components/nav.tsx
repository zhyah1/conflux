'use client';

import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
  Sidebar,
  SidebarTrigger,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  Home,
  Briefcase,
  ListTodo,
  ShieldAlert,
  FolderKanban,
  Settings,
  Users,
  CheckSquare,
  BarChart,
  ChevronLeft,
  Search,
  Book,
  LineChart,
  GanttChartSquare,
} from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { useUser } from '@/app/user-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import { getProjects } from '../projects/actions';
import { getIssues } from '../issues/actions';
import { getDocuments } from '../documents/actions';

const getInitials = (name?: string | null) => {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length > 1) {
    return names[0][0] + names[names.length - 1][0];
  }
  return name.substring(0, 2);
};


export function Nav() {
  const pathname = usePathname();
  const { profile } = useUser();
  const [projectCount, setProjectCount] = useState(0);
  const [issueCount, setIssueCount] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);

  useEffect(() => {
    async function fetchCounts() {
      const { data: projectsData } = await getProjects();
      if (projectsData) setProjectCount(projectsData.length);

      const { data: issuesData } = await getIssues();
      if (issuesData) setIssueCount(issuesData.count);

      const { data: documentsData } = await getDocuments();
      if (documentsData) setDocumentCount(documentsData.length);
    }
    fetchCounts();
  }, []);

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/projects', icon: Briefcase, label: 'Projects', count: projectCount },
    { href: '/dashboard/tasks', icon: GanttChartSquare, label: 'Board' },
    { href: '/dashboard/issues', icon: ListTodo, label: 'Issues', count: issueCount },
    { href: '/dashboard/documents', icon: Book, label: 'Documents', count: documentCount },
    { href: '/dashboard/users', icon: Users, label: 'Team', adminOnly: true },
    { href: '/dashboard/approvals', icon: CheckSquare, label: 'Pending Task Approvals' },
  ];

  const isAdmin = profile?.role === 'admin';

  return (
    <>
      <SidebarHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary" />
          <span className="text-lg font-bold group-data-[collapsible=icon]:hidden">Construx</span>
        </div>
         <SidebarTrigger>
            <ChevronLeft />
        </SidebarTrigger>
      </SidebarHeader>

      <SidebarContent className="p-2">
         <div className="relative group-data-[collapsible=icon]:hidden">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
            type="search"
            placeholder="Search issues..."
            className="w-full rounded-lg bg-background pl-8"
            />
        </div>
        <SidebarMenu>
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) {
              return null;
            }
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')}
                  tooltip={item.label}
                  size="lg"
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                    {item.count > 0 && <Badge variant="secondary" className="ml-auto group-data-[collapsible=icon]:hidden">{item.count}</Badge>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-2 space-y-4">
        <div className="group-data-[collapsible=icon]:hidden">
          <ThemeToggle />
        </div>
        {profile && (
            <div className="flex items-center gap-3 p-2 rounded-md group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
                </Avatar>
                <div className="group-data-[collapsible=icon]:hidden">
                    <div className="font-semibold text-sm">{profile.full_name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{profile.role.replace('_', ' ')} / Project Owner</div>
                </div>
            </div>
        )}
         <SidebarMenu>
             <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/dashboard/settings')}
                  tooltip="Settings"
                  size="lg"
                >
                  <Link href="/dashboard/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
