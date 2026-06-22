'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TenantGrowthChartProps {
  data: Array<any>;
}

export function TenantGrowthChart({ data }: TenantGrowthChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-64 text-gray-400">No growth data available yet.</div>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="INDIVIDUAL" stroke="#6366f1" strokeWidth={2} />
          <Line type="monotone" dataKey="INSTITUTE" stroke="#10b981" strokeWidth={2} />
          <Line type="monotone" dataKey="SCHOOL" stroke="#f59e0b" strokeWidth={2} />
          <Line type="monotone" dataKey="ENTERPRISE" stroke="#ef4444" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}