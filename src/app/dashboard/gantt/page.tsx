'use client';

import { useEffect, useMemo, useState } from 'react';
import { getProjects } from '../projects/actions';
import type { Project } from '../projects/page';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { format, differenceInDays, addMonths, eachMonthOfInterval } from 'date-fns';
import { Calendar, ChevronRight, Folder, GanttChartSquare } from 'lucide-react';
import { PageHeader } from '../components/page-header';

const GanttBar = ({
  project,
  timelineStart,
  timelineEnd,
}: {
  project: Project;
  timelineStart: Date;
  timelineEnd: Date;
}) => {
  const projectStart = new Date(project.start_date);
  const projectEnd = new Date(project.end_date);
  const timelineDuration = differenceInDays(timelineEnd, timelineStart);

  if (timelineDuration <= 0) return null;

  const startOffset = Math.max(0, differenceInDays(projectStart, timelineStart));
  const duration = Math.max(0, differenceInDays(projectEnd, projectStart));

  const left = (startOffset / timelineDuration) * 100;
  const width = (duration / timelineDuration) * 100;

  const statusColor = {
    'On Track': 'bg-green-500',
    'Delayed': 'bg-red-500',
    'Completed': 'bg-blue-500',
    'Planning': 'bg-gray-400',
    'In Progress': 'bg-yellow-500',
  }[project.status] || 'bg-gray-400';

  return (
    <div
      className="absolute h-6 rounded-lg flex items-center px-2 text-white text-xs whitespace-nowrap overflow-hidden"
      style={{
        left: `${Math.max(0, left)}%`,
        width: `${Math.min(100 - left, width)}%`,
        top: '50%',
        transform: 'translateY(-50%)',
      }}
    >
      <div className={`absolute inset-0 ${statusColor} opacity-90 rounded-lg`}></div>
    </div>
  );
};

const ProjectGanttRow = ({ project, timelineStart, timelineEnd }: { project: Project, timelineStart: Date, timelineEnd: Date }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasSubProjects = project.subProjects && project.subProjects.length > 0;

    return (
        <>
            <div className="contents">
                <div className="flex items-center gap-2 p-2 border-t border-border font-medium">
                    {hasSubProjects && (
                        <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 rounded-md hover:bg-muted">
                            <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : 'rotate-0'}`} />
                        </button>
                    )}
                    {!hasSubProjects && <div className="w-6 h-6"></div>}
                     <Folder className="h-4 w-4 text-muted-foreground mr-2" />
                    <span>{project.name}</span>
                </div>
                <div className="relative p-2 border-t border-border">
                    <GanttBar project={project} timelineStart={timelineStart} timelineEnd={timelineEnd} />
                </div>
            </div>
            {isExpanded && hasSubProjects && project.subProjects?.map(sub => (
                <div className="contents" key={sub.id}>
                     <div className="flex items-center gap-2 p-2 border-t border-border pl-12">
                        <GanttChartSquare className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-sm">{sub.name}</span>
                    </div>
                    <div className="relative p-2 border-t border-border">
                        <GanttBar project={sub} timelineStart={timelineStart} timelineEnd={timelineEnd} />
                    </div>
                </div>
            ))}
        </>
    )
}

export default function GanttChartPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      const { data, error } = await getProjects();
      if (!error && data) {
        const allProjects = data as unknown as Project[];
        const projectMap = new Map(allProjects.map(p => [p.id, { ...p, subProjects: [] as Project[] }]));

        const hierarchicalProjects: Project[] = [];

        allProjects.forEach(p => {
          if (p.parent_id && projectMap.has(p.parent_id)) {
            const parent = projectMap.get(p.parent_id);
            if (parent) {
              parent.subProjects.push(projectMap.get(p.id)!);
            }
          } else {
            hierarchicalProjects.push(projectMap.get(p.id)!);
          }
        });

        hierarchicalProjects.forEach(p => {
          if (p.subProjects && p.subProjects.length > 0) {
            p.subProjects.sort((a, b) => (a.phase_order || 0) - (b.phase_order || 0));
          }
        });

        setProjects(hierarchicalProjects);
      } else {
        console.error('Error fetching projects:', error);
      }
      setLoading(false);
    }
    fetchProjects();
  }, []);

  const { timelineStart, timelineEnd, months, totalCompletion, activeTasks } = useMemo(() => {
    if (projects.length === 0) {
      const start = new Date();
      start.setDate(1);
      return { timelineStart: start, timelineEnd: addMonths(start, 6), months: [], totalCompletion: 0, activeTasks: 0 };
    }

    const allProjects = projects.flatMap(p => [p, ...(p.subProjects || [])]);
    const allDates = allProjects.flatMap(p => [new Date(p.start_date), new Date(p.end_date)]);

    const timelineStart = new Date(Math.min(...allDates.map(d => d.getTime())));
    const timelineEnd = new Date(Math.max(...allDates.map(d => d.getTime())));
    timelineStart.setDate(1);
    
    let monthArray: Date[] = [];
    if (timelineStart < timelineEnd) {
      monthArray = eachMonthOfInterval({ start: timelineStart, end: timelineEnd });
    }

    const totalCompletion = allProjects.length > 0 ? allProjects.reduce((acc, p) => acc + p.completion, 0) / allProjects.length : 0;
    const activeTasks = allProjects.filter(p => p.status === 'In Progress' || p.status === 'On Track').length;

    return { timelineStart, timelineEnd, months: monthArray, totalCompletion, activeTasks };
  }, [projects]);


  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Project Timeline"
          description="Track your project progress and milestones"
          children={<Calendar className="h-6 w-6" />}
        />
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Project Timeline"
        description="Track your project progress and milestones"
        children={<Calendar className="h-6 w-6" />}
       />

      <Card>
        <CardContent className="pt-6">
          <div className="grid" style={{ gridTemplateColumns: 'minmax(250px, 1.5fr) 3fr' }}>
            {/* Header */}
            <div className="p-2 font-semibold text-sm text-muted-foreground border-b border-border">Tasks</div>
            <div className="grid border-b border-border" style={{ gridTemplateColumns: `repeat(${months.length}, 1fr)`}}>
              {months.map((month, i) => (
                <div key={i} className="text-center p-2 text-sm font-semibold text-muted-foreground border-l border-border">
                  {format(month, 'MMM')}
                </div>
              ))}
            </div>
            
            {/* Body */}
            {projects.map(project => (
                <ProjectGanttRow key={project.id} project={project} timelineStart={timelineStart} timelineEnd={timelineEnd} />
            ))}
          </div>

          <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
            <span className="font-semibold">Status:</span>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-yellow-500"></div>In Progress</div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-blue-500"></div>Completed</div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-red-500"></div>Delayed</div>
             <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-gray-400"></div>Planning</div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
            <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Total Projects</div>
                <div className="text-3xl font-bold">{projects.length}</div>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Active Tasks</div>
                <div className="text-3xl font-bold">{activeTasks}</div>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Completion Rate</div>
                <div className="text-3xl font-bold">{Math.round(totalCompletion)}%</div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
