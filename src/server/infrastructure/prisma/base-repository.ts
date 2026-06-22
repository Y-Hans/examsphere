import { Prisma, PrismaClient } from '@prisma/client';
import { TenantContext } from '@/server/shared/tenant-context';

type ModelDelegate<T> = {
  findUnique: (args: any) => Promise<T | null>;
  findFirst: (args: any) => Promise<T | null>;
  findMany: (args: any) => Promise<T[]>;
  count: (args: any) => Promise<number>;
  create: (args: any) => Promise<T>;
  update: (args: any) => Promise<T>;
  delete: (args: any) => Promise<T>;
};

export abstract class BaseRepository<T> {
  constructor(protected delegate: ModelDelegate<T>) {}

  async findById(id: string): Promise<T | null> {
    return this.delegate.findUnique({ where: { id } });
  }

  async findMany(args?: any): Promise<T[]> {
    return this.delegate.findMany(args);
  }

  async create(data: any): Promise<T> {
    return this.delegate.create({ data });
  }

  async update(id: string, data: any): Promise<T> {
    return this.delegate.update({ where: { id }, data });
  }

  async delete(id: string): Promise<T> {
    return this.delegate.delete({ where: { id } });
  }
}

export abstract class TenantAwareRepository<T> extends BaseRepository<T> {
  protected assertTenantContext(): string {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('TenantContext is required for TenantAwareRepository operations');
    }
    return tenantId;
  }
}