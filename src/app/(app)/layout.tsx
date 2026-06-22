import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { tenantService } from '@/modules/tenant/services/tenant.service';
import { AppContextProvider } from '@/client/providers/app-context-provider';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const headersList = headers();
  const subdomain = headersList.get('x-tenant-subdomain') || session?.user?.tenantSubdomain;

  if (!session?.user) {
    redirect('/login');
  }

  // If on a subdomain that doesn't match the user's tenant, reject (or handle gracefully)
  if (subdomain && subdomain !== session.user.tenantSubdomain) {
    // In a full impl, we might allow super admins to cross domains.
    // For now, force them to their own domain.
    redirect(`https://${session.user.tenantSubdomain}.examsphere.com/app`);
  }

  const tenant = await tenantService.getTenantBySubdomain(session.user.tenantSubdomain);

  return (
    <AppContextProvider
      value={{
        userId: session.user.id,
        tenantId: session.user.tenantId,
        roleIds: session.user.roleIds,
        permissions: session.user.permissions,
        subdomain: session.user.tenantSubdomain,
      }}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Basic layout shell, will be expanded in dashboard segments */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="text-xl font-bold" style={{ color: (tenant.branding as any)?.primaryColor || '#0f172a' }}>
                  {tenant.name}
                </span>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </AppContextProvider>
  );
}
