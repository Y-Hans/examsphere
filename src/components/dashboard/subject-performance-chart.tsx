'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SubjectPerformanceChartProps {
  data: Array<{ subject: string; accuracy: number; totalAttempted: number }>;
}

export function SubjectPerformanceChart({ data }: SubjectPerformanceChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-64 text-gray-400">No data available yet. Take a test to see your performance.</div>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="subject" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Accuracy']}
          />
          <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.accuracy > 75 ? '#10b981' : entry.accuracy > 50 ? '#6366f1' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}