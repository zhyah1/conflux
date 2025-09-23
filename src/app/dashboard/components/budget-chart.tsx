"use client";

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';

const data = [
  { month: 'Jan', budget: 4000, actual: 2400 },
  { month: 'Feb', budget: 3000, actual: 1398 },
  { month: 'Mar', budget: 2000, actual: 9800 },
  { month: 'Apr', budget: 2780, actual: 3908 },
  { month: 'May', budget: 1890, actual: 4800 },
  { month: 'Jun', budget: 2390, actual: 3800 },
];

export function BudgetChart() {
  return (
    <ChartContainer config={{}} className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={12}
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="budget" stroke="hsl(var(--accent))" strokeDasharray="5 5" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
