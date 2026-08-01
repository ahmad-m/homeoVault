import { ROLES } from './constants.js';

// Define the permissions mapping for roles
const ROLE_PERMISSIONS = {
  [ROLES.ADMINISTRATOR]: [
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'users:status',
    'logs:read',
    'inventory:read',
    'inventory:write',
    'inventory:delete',
    'reports:read',
    'settings:read',
    'settings:write',
    'data:export',
    'data:import'
  ],
  [ROLES.FAMILY_MEMBER]: [
    'inventory:read',
    'inventory:write',
    'profile:update'
  ]
};

class PermissionManager {
  /**
   * Validates if a role is authorized to perform a specific action.
   * @param {string} roleName - User role name
   * @param {string} permission - Target action key
   * @returns {boolean} True if permitted
   */
  hasPermission(roleName, permission) {
    if (!roleName) return false;
    
    const permissions = ROLE_PERMISSIONS[roleName] || [];
    
    // Admins automatically get wildcards if mapped, but explicit mapping is safer.
    // Check direct matching
    return permissions.includes(permission);
  }

  /**
   * Retrieves all permissions mapped to a specific role.
   * @param {string} roleName - Role name
   * @returns {Array<string>} List of permissions
   */
  getPermissionsForRole(roleName) {
    return ROLE_PERMISSIONS[roleName] || [];
  }
}

const permissionManager = new PermissionManager();

export default permissionManager;
export { ROLE_PERMISSIONS };
