import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const isTeacher = session.user.roleIds.some(id => id.includes('teacher') || id.includes('admin'));
  if (!isTeacher) {
    redirect('/student/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <span className="text-xl font-bold text-emerald-600">ExamSphere Teacher</span>
              <div className="hidden md:flex space-x-4">
                <a href="/teacher/dashboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Overview</a>
                <a href="/teacher/doubts" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Doubts</a>
                <a href="/teacher/create-test" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Create Test</a>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500">{session.user.email}</span>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}