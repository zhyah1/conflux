'use client';

import {
  Activity,
  ArrowUpRight,
  CircleDollarSign,
  Briefcase,
  ClipboardCheck,
  ShieldAlert,
  CheckCircle,
  TrendingUp,
  Clock,
  DollarSign,
  Banknote,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProjectProgressChart } from './components/project-progress-chart';
import { IssuesPieChart } from './components/issues-pie-chart';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getProjects } from './projects/actions';
import type { Project } from './projects/page';
import { Progress } from '@/components/ui/progress';
import { getDynamicStatus } from '@/lib/utils';
import { useUser } from '../user-provider';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [progressChartView, setProgressChartView] = useState('main');
  const { user } = useUser();

  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [projectStatusCounts, setProjectStatusCounts] = useState({
    Completed: 0,
    'On Track': 0,
    Delayed: 0,
  });

  useEffect(() => {
    async function fetchProjectsData() {
      if (!user) {
        setLoading(false);
        return;
      };
      setLoading(true);
      const { data, error } = await getProjects();

      if (!error && data) {
        const allProjects = data as Project[];
        setProjects(allProjects);
        setRecentProjects(allProjects.slice(0, 5));

        // Calculate financials
        const budget = allProjects.reduce((acc, p) => acc + p.budget, 0);
        const spent = allProjects.reduce(
          (acc, p) => acc + p.budget * (p.completion / 100),
          0
        );
        setTotalBudget(budget);
        setTotalSpent(spent);

        // Calculate status counts
        const counts = allProjects.reduce(
          (acc, p) => {
            const { status } = getDynamicStatus(p);
            if (
              status === 'Completed' ||
              status === 'On Track' ||
              status === 'Delayed'
            ) {
              if (acc[status]) {
                acc[status]++;
              } else {
                acc[status] = 1;
              }
            }
            return acc;
          },
          {} as Record<string, number>
        );

        setProjectStatusCounts({
          Completed: counts['Completed'] || 0,
          'On Track': counts['On Track'] || 0,
          Delayed: counts['Delayed'] || 0,
        });
      } else if (error && error !== 'Not authenticated') {
        console.error('Error fetching projects:', error);
      }
      setLoading(false);
    }
    fetchProjectsData();
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const progressChartData =
    progressChartView === 'main'
      ? projects.filter((p) => !p.parent_id)
      : (() => {
          const mainProjectIds = new Set(
            projects.filter((p) => !p.parent_id).map((p) => p.id)
          );
          return projects.filter(
            (p) => p.parent_id && mainProjectIds.has(p.parent_id)
          );
        })();


  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-40" />
              ) : (
                formatCurrency(totalBudget)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total budget for all projects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-40" />
              ) : (
                formatCurrency(totalSpent)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalBudget > 0
                ? `${Math.round((totalSpent / totalBudget) * 100)}% of budget used`
                : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Remaining Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-40" />
              ) : (
                formatCurrency(totalBudget - totalSpent)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Remaining funds across projects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Status</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-500 h-4 w-4" />{' '}
              {projectStatusCounts.Completed} Completed
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="text-blue-500 h-4 w-4" />{' '}
              {projectStatusCounts['On Track']} On Track
            </div>
            <div className="flex items-center gap-2">
              <Clock className="text-red-500 h-4 w-4" />{' '}
              {projectStatusCounts.Delayed} Delayed
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline">Project Progress</CardTitle>
              <CardDescription>
                Completion percentage for active projects.
              </CardDescription>
            </div>
            <Select value={progressChartView} onValueChange={setProgressChartView}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Main Projects</SelectItem>
                <SelectItem value="sub">Sub-Projects</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <ProjectProgressChart data={progressChartData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Issues by Priority</CardTitle>
            <CardDescription>
              A summary of issue priorities across all projects.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IssuesPieChart />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle className="font-headline">Recent Activity</CardTitle>
            <CardDescription>
              An overview of the latest project updates.
            </CardDescription>
          </div>
          <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="/dashboard/projects">
              View All
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Completion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-5 w-16 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                recentProjects.map((project) => {
                  const dynamic = getDynamicStatus(project);
                  return (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div className="font-medium">{project.name}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                          {project.owner}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            dynamic.status === 'Completed'
                              ? 'outline'
                              : dynamic.status === 'Delayed'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className={
                            dynamic.status === 'On Track'
                              ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
                              : ''
                          }
                        >
                          {dynamic.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress value={dynamic.expectedCompletion} className="h-2 w-24" />
                          <span>{dynamic.expectedCompletion}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
