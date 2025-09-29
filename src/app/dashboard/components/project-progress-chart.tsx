"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';

type Project = {
  name: string;
  completion: number;
};

type ProjectProgressChartProps = {
  data: Project[];
};

export function ProjectProgressChart({ data }: ProjectProgressChartProps) {
  const chartData = data.map(project => ({
    name: project.name.split(' ').slice(0, 2).join(' '), // Shorten name for chart label
    completion: project.completion,
  }));

  return (
    <ChartContainer config={{}} className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          margin={{ top: 5, right: 20, left: -15, bottom: 5 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" dataKey="completion" tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} tickMargin={8} fontSize={12} domain={[0, 100]} />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} width={80} />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            content={<ChartTooltipContent
              formatter={(value, name) => (
                <div className="flex flex-col">
                  <span className="font-bold">{value}%</span>
                </div>
              )}
            />}
          />
          <Bar dataKey="completion" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
