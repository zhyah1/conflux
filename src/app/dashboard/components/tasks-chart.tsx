"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';

const data = [
  { status: 'Backlog', tasks: 12 },
  { status: 'To Do', tasks: 19 },
  { status: 'In Progress', tasks: 25 },
  { status: 'Done', tasks: 35 },
  { status: 'Cancelled', tasks: 3 },
];

export function TasksChart() {
  return (
    <ChartContainer config={{}} className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <XAxis dataKey="status" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
          <Tooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={8} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
