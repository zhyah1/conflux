"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip, Legend, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { issues as allIssues } from '@/lib/data';
import type { ChartConfig } from '@/components/ui/chart';

const priorityCounts = allIssues.reduce((acc, issue) => {
  acc[issue.priority] = (acc[issue.priority] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

const data = [
  { name: 'High', value: priorityCounts['High'] || 0, fill: 'hsl(var(--destructive))' },
  { name: 'Medium', value: priorityCounts['Medium'] || 0, fill: 'hsl(var(--chart-4))' },
  { name: 'Low', value: priorityCounts['Low'] || 0, fill: 'hsl(var(--chart-2))' },
];

const chartConfig = {
  high: {
    label: 'High',
    color: 'hsl(var(--destructive))',
  },
  medium: {
    label: 'Medium',
    color: 'hsl(var(--chart-4))',
  },
  low: {
    label: 'Low',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function IssuesPieChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            content={<ChartTooltipContent 
                formatter={(value, name) => (
                    <div>
                        <div className="font-bold">{name} Priority</div>
                        <div>{value} Issues</div>
                    </div>
                )}
                nameKey="name"
            />}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            labelLine={false}
            label={({
              cx,
              cy,
              midAngle,
              innerRadius,
              outerRadius,
              value,
              index,
            }) => {
              const RADIAN = Math.PI / 180
              const radius = 25 + innerRadius + (outerRadius - innerRadius)
              const x = cx + radius * Math.cos(-midAngle * RADIAN)
              const y = cy + radius * Math.sin(-midAngle * RADIAN)

              return (
                <text
                  x={x}
                  y={y}
                  fill="hsl(var(--foreground))"
                  textAnchor={x > cx ? 'start' : 'end'}
                  dominantBaseline="central"
                  className="text-xs"
                >
                  {data[index].name} ({value})
                </text>
              )
            }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
           <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
