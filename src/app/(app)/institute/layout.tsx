import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

export default async function InstituteLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const isInstituteAdmin = session.user.roleIds.some(id => id.includes('admin') || id.includes('super-admin'));
  if (!isInstituteAdmin) {
    redirect('/student/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <span className="text-xl font-bold text-purple-600">ExamSphere Institute</span>
              <div className="hidden md:flex space-x-4">
                <a href="/institute/dashboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Overview</a>
                <a href="/institute/batches" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Batches</a>
                <a href="/institute/settings" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Settings</a>
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