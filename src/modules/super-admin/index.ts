import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

export default async function SuperAdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Super admin role is typically tied to the main platform tenant or a specific role ID
  const isSuperAdmin = session.user.roleIds.some(id => id.includes('super-admin') || id === '00000000-0000-0000-0000-000000000001');
  if (!isSuperAdmin) {
    redirect('/student/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-slate-900 shadow-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <span className="text-xl font-bold text-white">ExamSphere HQ</span>
              <div className="hidden md:flex space-x-4">
                <a href="/super-admin/dashboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Overview</a>
                <a href="/super-admin/tenants" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Tenants</a>
                <a href="/super-admin/settings" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">System Config</a>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-400">{session.user.email}</span>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}