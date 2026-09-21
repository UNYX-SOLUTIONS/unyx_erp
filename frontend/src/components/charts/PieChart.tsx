'use client';

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { ChartSeries } from './chart-types';

interface PieChartProps {
  data: Record<string, unknown>[];
  nameKey: string;
  dataKey: string;
  colors?: string[];
  height?: number;
}

const DEFAULT_COLORS = [
  'hsl(var(--primary))',
  '#38bdf8',
  '#34d399',
  '#fbbf24',
  '#f87171',
  '#a78bfa',
];

export function PieChart({
  data,
  nameKey,
  dataKey,
  colors = DEFAULT_COLORS,
  height = 320,
}: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          nameKey={nameKey}
          dataKey={dataKey}
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={`${String(entry[nameKey])}-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
