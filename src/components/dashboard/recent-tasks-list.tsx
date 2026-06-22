import Link from 'next/link';

interface RecentTestsListProps {
  tests: Array<any>;
}

export function RecentTestsList({ tests }: RecentTestsListProps) {
  if (!tests || tests.length === 0) {
    return <div className="text-center py-8 text-gray-400">No tests attempted yet.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {tests.map((test) => (
            <tr key={test.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{test.template.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {test.totalScore?.toFixed(2)} / {test.template.totalMarks.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(test.submittedAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <Link href={`/student/test/result/${test.id}`} className="text-indigo-600 hover:text-indigo-900">View Result</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}