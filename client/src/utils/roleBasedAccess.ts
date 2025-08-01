// Role-based access control utility functions

export interface UserRole {
  role: string;
  roleLevel: number;
}

export const ROLE_LEVELS = {
  DEMO: 0,
  USER: 1,
  ADMIN: 2,
  ADMINISTRATOR: 998,
  OWNER: 999,
  SUPER_USER: 1000,
} as const;

export const ROLE_NAMES = {
  [ROLE_LEVELS.DEMO]: 'demo',
  [ROLE_LEVELS.USER]: 'user', 
  [ROLE_LEVELS.ADMIN]: 'admin',
  [ROLE_LEVELS.ADMINISTRATOR]: 'administrator',
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
  
  // Super-Users (1000+) can access everything
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
  if (level >= ROLE_LEVELS.ADMINISTRATOR) return 'Administrator';
  if (level >= ROLE_LEVELS.ADMIN) return 'Admin';
  if (level >= ROLE_LEVELS.USER) return 'User';
  return 'Demo User';
}

// Access level requirements for different admin screens
export const ACCESS_REQUIREMENTS = {
  // Super User only (1000+) - Universal template management
  COMPANY_MANAGEMENT: ROLE_LEVELS.SUPER_USER,
  CREATE_MODELS: ROLE_LEVELS.SUPER_USER,
  UNIVERSAL_TEMPLATES: ROLE_LEVELS.SUPER_USER,
  
  // Owner level (999+) - Company-specific configuration  
  SETUP_API_KEYS: ROLE_LEVELS.OWNER,
  SETUP_MODEL_FUSION: ROLE_LEVELS.OWNER,
  COMPANY_SETUP: ROLE_LEVELS.OWNER,
  
  // Administrator level (998+)
  SECURITY_SETTINGS: ROLE_LEVELS.ADMINISTRATOR,
  USER_MANAGEMENT: ROLE_LEVELS.ADMINISTRATOR,
  ACTIVITY_MANAGEMENT: ROLE_LEVELS.ADMINISTRATOR,
  MONITORING_REPORTS: ROLE_LEVELS.ADMINISTRATOR,
  PERMISSIONS: ROLE_LEVELS.ADMINISTRATOR,
  ACTIVITY_TYPES: ROLE_LEVELS.ADMINISTRATOR,
  ANALYTICS: ROLE_LEVELS.ADMINISTRATOR,
  
  // Standard Admin level (2+)
  AI_MANAGEMENT: ROLE_LEVELS.ADMIN,
  CONTENT_POLICIES: ROLE_LEVELS.ADMIN,
  ACTIVITY_LOGS: ROLE_LEVELS.ADMIN,
  SECURITY_REPORTS: ROLE_LEVELS.ADMIN,
  
  // Regular User level (1+)
  CHAT_INTERFACE: ROLE_LEVELS.USER,
  CHAT: ROLE_LEVELS.USER,
  DASHBOARD: ROLE_LEVELS.USER,
} as const;