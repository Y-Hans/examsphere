import { TenantType } from '@prisma/client';
import { tenantRepository } from '../repositories/tenant.repository';
import { TenantStrategyFactory, TenantFeatureConfig } from '../strategies/tenant-strategy';
import { UpdateBrandingInput, UpdateTenantSettingsInput } from '../dto/tenant.dto';
import { TenantContext } from '@/server/shared/tenant-context';
import { NotFoundError, ValidationError } from '@/server/shared/errors';

export class TenantService {
  async getTenantBySubdomain(subdomain: string) {
    const tenant = await tenantRepository.findBySubdomain(subdomain);
    if (!tenant) {
      throw new NotFoundError('Tenant');
    }
    return tenant;
  }

  async getCurrentTenant() {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new NotFoundError('Tenant context');
    
    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) throw new NotFoundError('Tenant', tenantId);
    return tenant;
  }

  async getFeatureConfig(tenantId: string): Promise<TenantFeatureConfig> {
    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) throw new NotFoundError('Tenant', tenantId);
    
    const strategy = TenantStrategyFactory.getStrategy(tenant.type);
    return strategy.getFeatureConfig();
  }

  async updateBranding(input: UpdateBrandingInput) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new NotFoundError('Tenant context');

    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) throw new NotFoundError('Tenant', tenantId);

    if (tenant.type === 'INDIVIDUAL') {
      throw new ValidationError('Custom branding is not available for individual accounts');
    }

    return tenantRepository.updateBranding(tenantId, input);
  }

  async updateSettings(input: UpdateTenantSettingsInput) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new NotFoundError('Tenant context');
    
    return tenantRepository.updateSettings(tenantId, input);
  }
}

export const tenantService = new TenantService();