
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Project } from '../projects/page';
import type { ChartConfig } from '@/components/ui/chart';

type ProjectProgressChartProps = {
  data: Project[];
};

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function ProjectProgressChart({ data }: ProjectProgressChartProps) {
  const chartData = data.map((project, index) => ({
    name: project.name.split(' ').slice(0, 2).join(' '), // Shorten name for chart label
    completion: project.completion,
    fill: chartColors[index % chartColors.length],
  }));

  const chartConfig = chartData.reduce((acc, project) => {
    acc[project.name] = {
      label: project.name,
      color: project.fill,
    };
    return acc;
  }, {} as ChartConfig);


  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
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
                    <div>
                        <div className="font-bold">{name}</div>
                        <div>{value}% Complete</div>
                    </div>
                )}
                nameKey="name"
            />}
          />
          <Bar dataKey="completion" radius={[0, 4, 4, 0]}>
             {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
