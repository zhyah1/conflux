'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/page-header';
import { getProjects } from '../projects/actions';
import type { Project } from '../projects/page';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { format, differenceInDays, addMonths } from 'date-fns';
import { Folder, GanttChartSquare } from 'lucide-react';

const GanttBar = ({ 
  project, 
  timelineStart, 
  timelineEnd 
}: { 
  project: Project, 
  timelineStart: Date, 
  timelineEnd: Date 
}) => {
  const projectStart = new Date(project.start_date);
  const projectEnd = new Date(project.end_date);
  const timelineDuration = differenceInDays(timelineEnd, timelineStart);

  const startOffset = differenceInDays(projectStart, timelineStart);
  const duration = differenceInDays(projectEnd, projectStart);

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
      className="absolute h-full rounded flex items-center px-2 text-white text-xs whitespace-nowrap overflow-hidden"
      style={{ 
        left: `${Math.max(0, left)}%`, 
        width: `${Math.min(100 - left, width)}%`,
      }}
    >
      <div className={`absolute inset-0 ${statusColor} opacity-70`}></div>
      <span className="relative z-10 truncate">{project.name}</span>
    </div>
  );
};


const ProjectGanttRow = ({ project, level = 0, timelineStart, timelineEnd }: { project: Project, level: number, timelineStart: Date, timelineEnd: Date }) => {
  return (
    <div>
      <div className="flex items-center border-b border-border text-sm">
        <div className="w-1/3 p-2 font-medium truncate" style={{ paddingLeft: `${1 + level * 2}rem` }}>
          <div className="flex items-center gap-2">
            {project.parent_id ? <GanttChartSquare className="h-4 w-4 text-muted-foreground"/> : <Folder className="h-4 w-4 text-muted-foreground"/>}
            {project.name}
          </div>
        </div>
        <div className="w-2/3 p-2 h-10 relative">
          <GanttBar project={project} timelineStart={timelineStart} timelineEnd={timelineEnd} />
        </div>
      </div>
      {project.subProjects && project.subProjects.map(sub => (
        <ProjectGanttRow key={sub.id} project={sub} level={level + 1} timelineStart={timelineStart} timelineEnd={timelineEnd} />
      ))}
    </div>
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

  const { timelineStart, timelineEnd, months } = useMemo(() => {
    if (projects.length === 0) {
      const start = new Date();
      start.setDate(1);
      return { timelineStart: start, timelineEnd: addMonths(start, 6), months: [] };
    }

    const allDates = projects.flatMap(p => [new Date(p.start_date), new Date(p.end_date)]);
    const timelineStart = new Date(Math.min(...allDates.map(d => d.getTime())));
    const timelineEnd = new Date(Math.max(...allDates.map(d => d.getTime())));
    timelineStart.setDate(1);

    const monthArray = [];
    let currentMonth = new Date(timelineStart);
    while (currentMonth <= timelineEnd) {
      monthArray.push(new Date(currentMonth));
      currentMonth = addMonths(currentMonth, 1);
    }

    return { timelineStart, timelineEnd, months: monthArray };
  }, [projects]);
  

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Gantt Chart" description="Timeline view of all projects." />
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Gantt Chart" description="Timeline view of all projects and their phases." />
      <Card>
        <CardContent className="pt-6">
           <div className="border border-border rounded-lg">
              <div className="flex items-center border-b border-border bg-muted/50 font-semibold text-sm">
                  <div className="w-1/3 p-2">Project / Phase Name</div>
                  <div className="w-2/3 p-2 grid grid-cols-12">
                      {months.map((month, i) => (
                        <div key={i} className="text-center text-muted-foreground text-xs col-span-2">
                            {format(month, 'MMM yyyy')}
                        </div>
                      ))}
                  </div>
              </div>
              <div className="relative">
                {projects.map(project => (
                    <ProjectGanttRow key={project.id} project={project} level={0} timelineStart={timelineStart} timelineEnd={timelineEnd} />
                ))}
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
