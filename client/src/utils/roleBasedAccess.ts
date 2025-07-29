// Role-based access control utility functions

export interface UserRole {
  role: string;
  roleLevel: number;
}

export const ROLE_LEVELS = {
  DEMO: 0,
  USER: 1,
  ADMIN: 2,
  OWNER: 99,
  SUPER_USER: 100,
} as const;

export const ROLE_NAMES = {
  [ROLE_LEVELS.DEMO]: 'demo',
  [ROLE_LEVELS.USER]: 'user', 
  [ROLE_LEVELS.ADMIN]: 'admin',
  [ROLE_LEVELS.OWNER]: 'owner',
  [ROLE_LEVELS.SUPER_USER]: 'super-user',
} as const;

// Check if user has required access level
export function hasAccessLevel(userRoleLevel: number | undefined, requiredLevel: number): boolean {
  return (userRoleLevel ?? 0) >= requiredLevel;
}

// Check if user can view admin page (includes demo users for read-only access)
export function canViewAdminPage(user: any, requiredLevel: number): boolean {
  const roleLevel = user?.roleLevel ?? 0;
  
  // Demo users (roleLevel 0) can view all admin pages in read-only mode
  if (roleLevel === ROLE_LEVELS.DEMO) return true;
  
  // Check if this is a demo user using other methods
  const isDemoUser = window.location.pathname === '/demo' || 
                     user?.email === 'demo@aisentinel.com' ||
                     user?.role === 'demo' ||
                     !document.cookie.includes('sessionToken=');
  
  // Demo users can view all admin pages in read-only mode
  if (isDemoUser) return true;
  
  // Super-Users (100+) can access everything
  if (roleLevel >= ROLE_LEVELS.SUPER_USER) return true;
  
  // Other users need proper access level
  return roleLevel >= requiredLevel;
}

// Check specific role types
export function isSuperUser(userRoleLevel: number | undefined): boolean {
  return hasAccessLevel(userRoleLevel, ROLE_LEVELS.SUPER_USER);
}

export function isOwner(userRoleLevel: number | undefined): boolean {
  return hasAccessLevel(userRoleLevel, ROLE_LEVELS.OWNER);
}

export function isAdmin(userRoleLevel: number | undefined): boolean {
  return hasAccessLevel(userRoleLevel, ROLE_LEVELS.ADMIN);
}

export function isUser(userRoleLevel: number | undefined): boolean {
  return hasAccessLevel(userRoleLevel, ROLE_LEVELS.USER);
}

export function isDemoUser(userRoleLevel: number | undefined): boolean {
  return (userRoleLevel ?? 0) === ROLE_LEVELS.DEMO;
}

// Get readable role name
export function getRoleName(roleLevel: number | undefined): string {
  const level = roleLevel ?? 0;
  if (level >= ROLE_LEVELS.SUPER_USER) return 'Super User';
  if (level >= ROLE_LEVELS.OWNER) return 'Owner';
  if (level >= ROLE_LEVELS.ADMIN) return 'Administrator';
  if (level >= ROLE_LEVELS.USER) return 'User';
  return 'Demo User';
}

// Access level requirements for different admin screens
export const ACCESS_REQUIREMENTS = {
  // Super User only (100+)
  COMPANY_MANAGEMENT: ROLE_LEVELS.SUPER_USER,
  
  // Owner level (99+)
  SETUP_API_KEYS: ROLE_LEVELS.OWNER,
  SETUP_AI_MODELS: ROLE_LEVELS.OWNER,
  SETUP_MODEL_FUSION: ROLE_LEVELS.OWNER,
  COMPANY_SETUP: ROLE_LEVELS.OWNER,
  
  // Administrator level (98+) - note: using 98 to be stricter than standard admin (2)
  SECURITY_SETTINGS: 98,
  USER_MANAGEMENT: 98,
  ACTIVITY_MANAGEMENT: 98,
  MONITORING_REPORTS: 98,
  
  // Standard Admin level (2+)
  AI_MANAGEMENT: ROLE_LEVELS.ADMIN,
  CONTENT_POLICIES: ROLE_LEVELS.ADMIN,
  ACTIVITY_LOGS: ROLE_LEVELS.ADMIN,
  SECURITY_REPORTS: ROLE_LEVELS.ADMIN,
  
  // Regular User level (1+)
  CHAT_INTERFACE: ROLE_LEVELS.USER,
} as const;