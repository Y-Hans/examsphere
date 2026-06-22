import { PrismaClient } from '@prisma/client';
import { prisma } from '@/server/infrastructure/prisma/client';
import { BaseRepository } from '@/server/infrastructure/prisma/base-repository';

export class TenantRepository extends BaseRepository<any> {
  constructor() {
    super(prisma.tenant as any);
  }

  async findBySubdomain(subdomain: string) {
    return prisma.tenant.findUnique({
      where: { subdomain },
    });
  }

  async updateBranding(tenantId: string, branding: any) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error('Tenant not found');

    return prisma.tenant.update({
      where: { id: tenantId },
      data: {
        branding: {
          ...(tenant.branding as any || {}),
          ...branding,
        },
      },
    });
  }

  async updateSettings(tenantId: string, settings: any) {
    // In a real app, settings might be a separate table or JSON field. 
    // Our schema has branding JSON, let's assume settings are stored there too 
    // or we add a settings JSON field. For this example, we'll upsert a setting record 
    // if it existed, but to stick to schema.prisma, we'll store settings inside branding JSON 
    // or create a mock tenant_settings table. Let's use branding JSON for simplicity.
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error('Tenant not found');

    const currentBranding = (tenant.branding as any) || {};
    return prisma.tenant.update({
      where: { id: tenantId },
      data: {
        branding: {
          ...currentBranding,
          settings: settings,
        },
      },
    });
  }
}

export const tenantRepository = new TenantRepository();