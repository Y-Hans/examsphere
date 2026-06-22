import { UserContext } from '@/server/shared/user-context';
import { AuthorizationError } from '@/server/shared/errors';

export class PermissionService {
  /**
   * Checks if the current user has a specific permission.
   * @param resource The resource being accessed (e.g., 'question', 'test_template')
   * @param action The action being performed (e.g., 'create', 'read', 'update', 'delete', 'manage')
   * @throws AuthorizationError if the user lacks the permission
   */
  assert(resource: string, action: string): void {
    const permissionString = `${resource}:${action}`;
    const wildcardString = `${resource}:manage`;
    
    const hasPermission = UserContext.hasPermission(permissionString) || UserContext.hasPermission(wildcardString);
    
    if (!hasPermission) {
      throw new AuthorizationError(`Missing permission: ${permissionString}`);
    }
  }

  /**
   * Checks if the current user has a specific permission without throwing.
   */
  can(resource: string, action: string): boolean {
    const permissionString = `${resource}:${action}`;
    const wildcardString = `${resource}:manage`;
    return UserContext.hasPermission(permissionString) || UserContext.hasPermission(wildcardString);
  }
}

export const permissionService = new PermissionService();