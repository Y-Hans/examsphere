import { AsyncLocalStorage } from 'async_hooks';

export interface UserContextData {
  userId: string;
  tenantId: string;
  roleIds: string[];
  permissions: string[];
}

const userStorage = new AsyncLocalStorage<UserContextData>();

export const UserContext = {
  run<T>(context: UserContextData, callback: () => T): T {
    return userStorage.run(context, callback);
  },

  get(): UserContextData | undefined {
    return userStorage.getStore();
  },

  getUserId(): string | undefined {
    return userStorage.getStore()?.userId;
  },

  getTenantId(): string | undefined {
    return userStorage.getStore()?.tenantId;
  },

  hasPermission(permission: string): boolean {
    const perms = userStorage.getStore()?.permissions || [];
    return perms.includes(permission) || perms.includes('*') || perms.some(p => p.endsWith(':manage'));
  },
};
