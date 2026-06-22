import { getInstituteDashboardAction } from '@/modules/institute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default async function InstituteDashboardPage() {
  const result = await getInstituteDashboardAction();
  
  if (!result.success || !result.data) {
    return <div className="text-center text-red-500 py-10">{result.error?.message || 'Failed to load dashboard'}</div>;
  }

  const { stats, recentBatches } = result.data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Institute Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{stats.studentCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{stats.teacherCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.batchCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Batches</h2>
          <Link href="/institute/batches" className="text-sm text-indigo-600 hover:underline">View All</Link>
        </div>
        {recentBatches.length === 0 ? (
          <div className="text-gray-400 text-center py-4">No batches created yet.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {recentBatches.map((batch: any) => (
              <li key={batch.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">{batch.name}</p>
                  <p className="text-xs text-gray-500">{batch._count.enrollments} students enrolled</p>
                </div>
                <Link href={`/institute/batches/${batch.id}`} className="text-sm text-indigo-600 hover:underline">Manage</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}