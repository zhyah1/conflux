"use client";

import { useEffect, useState } from 'react';
import { Pie, PieChart, ResponsiveContainer, Tooltip, Legend, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { getIssues } from '@/app/dashboard/issues/actions';
import type { Issue } from '@/app/dashboard/issues/page';
import type { ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/app/user-provider';

const chartConfig = {
  High: {
    label: 'High',
    color: 'hsl(var(--destructive))',
  },
  Medium: {
    label: 'Medium',
    color: 'hsl(var(--chart-4))',
  },
  Low: {
    label: 'Low',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function IssuesPieChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    async function fetchIssueData() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data: issuesData, error } = await getIssues();
      if (!error && issuesData) {
        const allIssues = issuesData as unknown as Issue[];
        const priorityCounts = allIssues.reduce((acc, issue) => {
          acc[issue.priority] = (acc[issue.priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const chartData = [
          { name: 'High', value: priorityCounts['High'] || 0, fill: 'hsl(var(--destructive))' },
          { name: 'Medium', value: priorityCounts['Medium'] || 0, fill: 'hsl(var(--chart-4))' },
          { name: 'Low', value: priorityCounts['Low'] || 0, fill: 'hsl(var(--chart-2))' },
        ];
        setData(chartData);
      } else if (error && error !== 'Not authenticated') {
        console.error("Failed to fetch issues for chart", error);
      }
      setLoading(false);
    }
    fetchIssueData();
  }, [user]);

  if (loading) {
    return (
      <div className="h-[250px] w-full flex items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

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
              if (value === 0) return null;
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
