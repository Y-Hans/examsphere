import { getTeacherDoubtsAction } from '@/modules/doubt';
import Link from 'next/link';

export default async function TeacherDoubtsPage() {
  const result = await getTeacherDoubtsAction();
  const doubts = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Doubt Management</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {doubts.length === 0 && <li className="p-4 text-center text-gray-400">No doubts found.</li>}
          {doubts.map((doubt: any) => (
            <li key={doubt.id}>
              <Link href={`/teacher/doubts/${doubt.id}`} className="block hover:bg-gray-50 px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">{doubt.title}</p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${doubt.status === 'OPEN' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {doubt.status}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">{doubt.user.email}</p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>Created on {new Date(doubt.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}