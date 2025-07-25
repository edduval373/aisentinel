/**
 * Role-Based Access Control Utility
 * 
 * Security hierarchy:
 * - Demo (0): Limited demo access
 * - User (1): Chat interface access only
 * - Admin (2): Standard admin features
 * - Administrator (98): Security settings, user management, activity management, monitoring
 * - Owner (99): Company configuration, API keys, AI models, model fusion
 * - Super-User (100): Full system access, company management
 */

export const roleBasedAccess = {
  /**
   * Check if user has access level equal to or above the required level
   * @param userLevel - User's role level
   * @param requiredLevel - Required minimum role level
   * @returns boolean - true if user has access, false otherwise
   */
  hasAccessLevel(userLevel: number, requiredLevel: number): boolean {
    return userLevel >= requiredLevel;
  },

  /**
   * Role level constants for easy reference
   */
  LEVELS: {
    DEMO: 0,
    USER: 1,
    ADMIN: 2,
    ADMINISTRATOR: 98,
    OWNER: 99,
    SUPER_USER: 100,
  } as const,

  /**
   * Get role name from level
   */
  getRoleName(level: number): string {
    switch (level) {
      case 0: return 'Demo';
      case 1: return 'User';
      case 2: return 'Admin';
      case 98: return 'Administrator';
      case 99: return 'Owner';
      case 100: return 'Super-User';
      default: return `Level ${level}`;
    }
  },

  /**
   * Check if user can access admin features
   */
  canAccessAdmin(userLevel: number): boolean {
    return userLevel >= 2;
  },

  /**
   * Check if user can access administrator features
   */
  canAccessAdministrator(userLevel: number): boolean {
    return userLevel >= 98;
  },

  /**
   * Check if user can access owner features
   */
  canAccessOwner(userLevel: number): boolean {
    return userLevel >= 99;
  },

  /**
   * Check if user is super-user
   */
  isSuperUser(userLevel: number): boolean {
    return userLevel >= 100;
  },
};