import { PrismaClient } from '@prisma/client';
import { prisma } from '@/server/infrastructure/prisma/client';
import { TenantAwareRepository } from '@/server/infrastructure/prisma/base-repository';
import { logger } from '@/server/shared/logger';

export class UserRepository extends TenantAwareRepository<any> {
  constructor() {
    super(prisma.user as any);
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async createUserWithTenant(data: {
    email: string;
    passwordHash: string;
    name: string;
    tenantName: string;
    subdomain: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.tenantName,
          subdomain: data.subdomain,
          type: 'INDIVIDUAL',
          status: 'ACTIVE',
        },
      });

      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          tenantId: tenant.id,
          status: 'ACTIVE',
        },
      });

      // Find or create STUDENT role for the tenant
      const role = await tx.role.upsert({
        where: { id: `${tenant.id}-student` },
        update: {},
        create: {
          id: `${tenant.id}-student`,
          tenantId: tenant.id,
          name: 'STUDENT',
          scope: 'TENANT',
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });

      // Assign basic student permissions
      const studentPermissions = await tx.permission.findMany({
        where: {
          OR: [
            { resource: 'test_session', action: 'create' },
            { resource: 'test_session', action: 'read' },
            { resource: 'practice_session', action: 'create' },
            { resource: 'practice_session', action: 'read' },
            { resource: 'analytics', action: 'read' },
            { resource: 'doubt', action: 'create' },
          ],
        },
      });

      await tx.rolePermission.createMany({
        data: studentPermissions.map((p) => ({
          roleId: role.id,
          permissionId: p.id,
        })),
      });

      return { user, tenant };
    });
  }
}

export const userRepository = new UserRepository();