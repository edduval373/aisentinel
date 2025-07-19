import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // Simplified demo mode - always authenticated immediately
  return {
    user: { id: 'demo-user', email: 'demo@aisentinel.com', name: 'Demo User' },
    isLoading: false,
    isAuthenticated: true,
    authMethod: 'demo',
  };
}
