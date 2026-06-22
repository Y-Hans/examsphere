import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Basic role check - ensure user has student-like access
  const isStudent = session.user.roleIds.some(id => id.includes('student')) || 
                    !session.user.roleIds.some(id => id.includes('admin') || id.includes('teacher'));

  if (!isStudent) {
    // Redirect to their appropriate dashboard if they aren't a student
    if (session.user.roleIds.some(id => id.includes('teacher'))) redirect('/teacher/dashboard');
    if (session.user.roleIds.some(id => id.includes('admin'))) redirect('/institute/dashboard');
    if (session.user.roleIds.some(id => id.includes('super-admin'))) redirect('/super-admin/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <span className="text-xl font-bold text-indigo-600">ExamSphere</span>
              <div className="hidden md:flex space-x-4">
                <a href="/student/dashboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Dashboard</a>
                <a href="/student/practice" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Practice</a>
                <a href="/student/ai-tutor" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">AI Tutor</a>
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