'use client';

import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { useUser } from '@/app/user-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/dashboard/projects', icon: Briefcase, label: 'Projects', count: 12 },
  { href: '/dashboard/tasks', icon: BarChart, label: 'Board' },
  { href: '/dashboard/issues', icon: ListTodo, label: 'Issues', count: 23, soon: true },
  { href: '/dashboard/documents', icon: Book, label: 'Materials', count: 5, soon: true },
  { href: '/dashboard/users', icon: Users, label: 'Team', adminOnly: true, soon: true },
  { href: '/dashboard/approvals', icon: CheckSquare, label: 'Reports', soon: true },
];

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

  const isAdmin = profile?.role === 'admin';

  return (
    <>
      <SidebarHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary" />
          <span className="text-lg font-bold">ConstructFlow</span>
        </div>
        <SidebarTrigger className="h-8 w-8">
            <ChevronLeft />
        </SidebarTrigger>
      </SidebarHeader>

      <SidebarContent className="p-2">
         <div className="relative">
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
                    {item.count && <Badge variant="secondary" className="ml-auto">{item.count}</Badge>}
                    {item.soon && <Badge variant="outline" className="ml-auto">Soon</Badge>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarContent className="p-2">
        {profile && (
            <div className="flex items-center gap-3 p-2 rounded-md">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                    <div className="font-semibold text-sm">{profile.full_name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{profile.role.replace('_', ' ')} / Project Owner</div>
                </div>
            </div>
        )}
      </SidebarContent>

      <SidebarFooter>
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
