export function isDemoModeActive(user?: any): boolean {
  return window.location.pathname === '/demo' || 
         user?.email === 'demo@aisentinel.com' || 
         user?.roleLevel === 0;
}

export function isReadOnlyMode(user?: any): boolean {
  return isDemoModeActive(user);
}

export function getDemoModeMessage(): string {
  return "Demo Mode - Read Only View";
}