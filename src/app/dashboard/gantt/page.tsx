
'use client';

import { useEffect, useMemo, useState } from 'react';
import { getProjects } from '../projects/actions';
import type { Project } from '../projects/page';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { format, differenceInDays, addMonths, eachMonthOfInterval, getYear } from 'date-fns';
import { Calendar, ChevronRight, GanttChartSquare } from 'lucide-react';
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

const ProjectGanttRow = ({ project, timelineStart, timelineEnd, level = 0 }: { project: Project, timelineStart: Date, timelineEnd: Date, level?: number }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasSubProjects = project.subProjects && project.subProjects.length > 0;

    return (
        <>
            <div className="contents">
                <div 
                    className="flex items-center gap-2 p-2 border-t border-border font-medium"
                    style={{ paddingLeft: `${1 + level * 2}rem` }}
                >
                    {hasSubProjects ? (
                        <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 rounded-md hover:bg-muted">
                            <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : 'rotate-0'}`} />
                        </button>
                    ) : (
                      <div className="w-6 h-6"></div>
                    )}
                     <GanttChartSquare className="h-4 w-4 text-muted-foreground mr-2" />
                    <span>{project.name}</span>
                </div>
                <div className="relative p-2 border-t border-border">
                    <GanttBar project={project} timelineStart={timelineStart} timelineEnd={timelineEnd} />
                </div>
            </div>
            {isExpanded && hasSubProjects && project.subProjects?.map(sub => (
                <ProjectGanttRow 
                    key={sub.id} 
                    project={sub} 
                    timelineStart={timelineStart} 
                    timelineEnd={timelineEnd} 
                    level={level + 1} 
                />
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
          const p_mapped = projectMap.get(p.id)!;
          if (p.parent_id && projectMap.has(p.parent_id)) {
            const parent = projectMap.get(p.parent_id);
            if (parent) {
              parent.subProjects.push(p_mapped);
            }
          } else {
            hierarchicalProjects.push(p_mapped);
          }
        });
        
        const sortProjectsRecursive = (projectList: Project[]) => {
          projectList.sort((a, b) => (a.phase_order || 0) - (b.phase_order || 0));
          projectList.forEach(p => {
            if (p.subProjects && p.subProjects.length > 0) {
              sortProjectsRecursive(p.subProjects);
            }
          });
        };
        
        sortProjectsRecursive(hierarchicalProjects);
        setProjects(hierarchicalProjects);

      } else {
        console.error('Error fetching projects:', error);
      }
      setLoading(false);
    }
    fetchProjects();
  }, []);

  const { timelineStart, timelineEnd, monthsByYear, totalCompletion, activeTasks } = useMemo(() => {
    if (projects.length === 0) {
      const start = new Date();
      start.setDate(1);
      return { timelineStart: start, timelineEnd: addMonths(start, 6), monthsByYear: {}, totalCompletion: 0, activeTasks: 0 };
    }
    
    const getAllProjects = (projectList: Project[]): Project[] => {
      let flatList: Project[] = [];
      projectList.forEach(p => {
        flatList.push(p);
        if (p.subProjects && p.subProjects.length > 0) {
          flatList = flatList.concat(getAllProjects(p.subProjects));
        }
      });
      return flatList;
    };

    const allProjects = getAllProjects(projects);
    const allDates = allProjects.flatMap(p => [new Date(p.start_date), new Date(p.end_date)]).filter(d => !isNaN(d.getTime()));


    if (allDates.length === 0) {
      const start = new Date();
      start.setDate(1);
      return { timelineStart: start, timelineEnd: addMonths(start, 6), monthsByYear: {}, totalCompletion: 0, activeTasks: 0 };
    }

    const timelineStart = new Date(Math.min(...allDates.map(d => d.getTime())));
    const timelineEnd = new Date(Math.max(...allDates.map(d => d.getTime())));
    timelineStart.setDate(1);
    
    const monthsByYear: Record<string, Date[]> = {};
    if (timelineStart < timelineEnd) {
      const monthArray = eachMonthOfInterval({ start: timelineStart, end: timelineEnd });
      monthArray.forEach(month => {
        const year = getYear(month);
        if (!monthsByYear[year]) {
          monthsByYear[year] = [];
        }
        monthsByYear[year].push(month);
      });
    }

    const totalCompletion = allProjects.length > 0 ? allProjects.reduce((acc, p) => acc + p.completion, 0) / allProjects.length : 0;
    const activeTasks = allProjects.filter(p => p.status === 'In Progress' || p.status === 'On Track').length;

    return { timelineStart, timelineEnd, monthsByYear, totalCompletion, activeTasks };
  }, [projects]);


  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Project Timeline"
          description="Track your project progress and milestones"
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

  const allMonths = Object.values(monthsByYear).flat();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Project Timeline"
        description="Track your project progress and milestones"
      >
        <Calendar className="h-6 w-6" />
      </PageHeader>
      
      <Card>
        <CardContent className="pt-6">
          <div className="grid" style={{ gridTemplateColumns: 'minmax(250px, 1.5fr) 3fr' }}>
            {/* Header */}
            <div className="p-2 font-semibold text-sm text-muted-foreground border-b border-border">Tasks</div>
            <div className="border-b border-border">
              <div className="grid" style={{ gridTemplateColumns: `repeat(${allMonths.length}, minmax(60px, 1fr))` }}>
                {Object.entries(monthsByYear).map(([year, months]) => (
                  <div key={year} className="contents">
                    <div
                      className="col-span-full border-b border-r border-border text-center py-1 font-bold"
                      style={{ gridColumn: `span ${months.length}` }}
                    >
                      {year}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${allMonths.length}, minmax(60px, 1fr))`}}>
                {allMonths.map((month, i) => (
                  <div key={i} className="text-center p-2 text-sm font-semibold text-muted-foreground border-l border-border">
                    {format(month, 'MMM')}
                  </div>
                ))}
              </div>
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
