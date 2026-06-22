import { superAdminRepository } from '../repositories/super-admin.repository';
import { UpdateTenantStatusInput, TenantQueryInput } from '../dto/super-admin.dto';
import { NotFoundError } from '@/server/shared/errors';
import { prisma } from '@/server/infrastructure/prisma/client';
import { writeAuditLog } from '@/server/shared/audit';

export class SuperAdminService {
  async getDashboardData() {
    const [stats, growth] = await Promise.all([
      superAdminRepository.getPlatformStats(),
      superAdminRepository.getTenantGrowth(),
    ]);

    return { stats, growth };
  }

  async getTenants(query: TenantQueryInput) {
    return superAdminRepository.findAllTenants(query);
  }

  async updateTenantStatus(input: UpdateTenantStatusInput, actorId: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: input.tenantId } });
    if (!tenant) throw new NotFoundError('Tenant', input.tenantId);

    const updated = await superAdminRepository.updateTenantStatus(input.tenantId, input.status);

    await writeAuditLog({
      action: 'UPDATE_TENANT_STATUS',
      resourceType: 'tenant',
      resourceId: input.tenantId,
      beforeState: { status: tenant.status },
      afterState: { status: input.status },
    });

    return updated;
  }
}

export const superAdminService = new SuperAdminService();