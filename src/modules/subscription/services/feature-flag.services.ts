import { prisma } from '@/server/infrastructure/prisma/client';
import { TenantContext } from '@/server/shared/tenant-context';

export class FeatureFlagService {
  private cache: Map<string, boolean> = new Map();

  async isEnabled(key: string): Promise<boolean> {
    const tenantId = TenantContext.getTenantId();
    const cacheKey = `${tenantId}:${key}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const flag = await prisma.featureFlag.findUnique({
      where: { key },
      include: {
        overrides: {
          where: { tenantId },
        },
      },
    });

    if (!flag) {
      this.cache.set(cacheKey, false);
      return false;
    }

    // Override takes precedence
    if (flag.overrides.length > 0) {
      const enabled = flag.overrides[0].enabled;
      this.cache.set(cacheKey, enabled);
      return enabled;
    }

    this.cache.set(cacheKey, flag.defaultEnabled);
    return flag.defaultEnabled;
  }

  async setOverride(tenantId: string, flagKey: string, enabled: boolean) {
    const flag = await prisma.featureFlag.findUnique({ where: { key: flagKey } });
    if (!flag) throw new Error('Flag not found');

    await prisma.tenantFeatureOverride.upsert({
      where: {
        tenantId_flagId: { tenantId, flagId: flag.id },
      },
      update: { enabled },
      create: { tenantId, flagId: flag.id, enabled },
    });

    this.cache.delete(`${tenantId}:${flagKey}`);
  }
}

export const featureFlagService = new FeatureFlagService();