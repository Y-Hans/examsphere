import { prisma } from '@/server/infrastructure/prisma/client';
import { TenantAwareRepository } from '@/server/infrastructure/prisma/base-repository';
import { TenantContext } from '@/server/shared/tenant-context';

export class InstituteRepository extends TenantAwareRepository<any> {
  constructor() {
    super(prisma.batch as any);
  }

  async getInstituteStats(tenantId: string) {
    const [studentCount, teacherCount, batchCount] = await Promise.all([
      prisma.user.count({ where: { tenantId, roles: { some: { role: { name: 'STUDENT' } } } } }),
      prisma.user.count({ where: { tenantId, roles: { some: { role: { name: 'TEACHER' } } } } }),
      prisma.batch.count({ where: { tenantId, deletedAt: null } }),
    ]);

    return { studentCount, teacherCount, batchCount };
  }

  async findBatchesByTenant(tenantId: string) {
    return prisma.batch.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBatchById(batchId: string) {
    return prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        enrollments: {
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
        },
      },
    });
  }

  async createBatch(tenantId: string, name: string, description?: string) {
    return prisma.batch.create({
      data: { tenantId, name, description },
    });
  }

  async enrollStudentByEmail(batchId: string, studentEmail: string) {
    const student = await prisma.user.findUnique({
      where: { email: studentEmail },
    });

    if (!student) {
      throw new Error('Student not found in the system. Ask them to sign up first.');
    }

    const tenantId = TenantContext.getTenantId();
    if (student.tenantId !== tenantId) {
      throw new Error('Student does not belong to your institute.');
    }

    return prisma.batchEnrollment.create({
      data: {
        batchId,
        userId: student.id,
      },
    });
  }
}

export const instituteRepository = new InstituteRepository();