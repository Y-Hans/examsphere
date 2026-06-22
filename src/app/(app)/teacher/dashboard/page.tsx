import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTeacherDoubtsAction } from '@/modules/doubt';
import { getQuestionsAction } from '@/modules/question-bank';
import Link from 'next/link';

export default async function TeacherDashboardPage() {
  const [doubtsResult, questionsResult] = await Promise.all([
    getTeacherDoubtsAction('OPEN'),
    getQuestionsAction({ pageSize: 5 })
  ]);

  const openDoubts = doubtsResult.success ? doubtsResult.data : [];
  const recentQuestions = questionsResult.success ? questionsResult.data?.data : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Teacher Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Open Doubts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{openDoubts.length}</div>
            <Link href="/teacher/doubts" className="text-sm text-indigo-600 hover:underline mt-2 block">View Doubts</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Questions Authored</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{recentQuestions.length}</div>
            <Link href="/teacher/create-test" className="text-sm text-indigo-600 hover:underline mt-2 block">Create Test</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Batch Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-400">N/A</div>
            <span className="text-sm text-gray-400 mt-2 block">Coming soon</span>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Open Doubts</h2>
        {openDoubts.length === 0 ? (
          <div className="text-gray-400 text-center py-4">No open doubts. Great job!</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {openDoubts.slice(0, 5).map((doubt: any) => (
              <li key={doubt.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">{doubt.title}</p>
                  <p className="text-xs text-gray-500">By {doubt.user.email} at {new Date(doubt.createdAt).toLocaleString()}</p>
                </div>
                <Link href={`/teacher/doubts/${doubt.id}`} className="text-sm text-indigo-600 hover:underline">Resolve</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}