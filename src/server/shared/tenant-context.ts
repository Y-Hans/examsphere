import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextData {
  tenantId: string;
  subdomain: string | null;
}

const tenantStorage = new AsyncLocalStorage<TenantContextData>();

export const TenantContext = {
  run<T>(context: TenantContextData, callback: () => T): T {
    return tenantStorage.run(context, callback);
  },

  get(): TenantContextData | undefined {
    return tenantStorage.getStore();
  },

  getTenantId(): string | undefined {
    return tenantStorage.getStore()?.tenantId;
  },

  getSubdomain(): string | null | undefined {
    return tenantStorage.getStore()?.subdomain;
  }
};