import { auth } from '@/lib/auth';
import { UserContext } from '@/server/shared/user-context';
import { TenantContext } from '@/server/shared/tenant-context';
import { RequestContext } from '@/server/shared/request-context';
import { AuthorizationError } from '@/server/shared/errors';

/**
 * Shared context wrapper for all Server Actions.
 * Populates UserContext, TenantContext, and RequestContext.
 */
export async function withContext<T>(callback: () => Promise<T>): Promise<T> {
  const session = await auth();
  if (!session?.user) {
    throw new AuthorizationError('Session required');
  }

  return RequestContext.run(() =>
    UserContext.run(
      {
        userId: session.user.id,
        tenantId: session.user.tenantId,
        roleIds: session.user.roleIds,
        permissions: session.user.permissions,
      },
      () =>
        TenantContext.run(
          { tenantId: session.user.tenantId, subdomain: session.user.tenantSubdomain },
          callback
        )
    )
  );
}
