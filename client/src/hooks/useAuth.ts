import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // Try cookie-based auth first
  const { data: cookieAuth, isLoading: cookieLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Fallback to Replit auth
  const { data: replitAuth, isLoading: replitLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !cookieAuth?.authenticated,
  });

  const isLoading = cookieLoading || (replitLoading && !cookieAuth?.authenticated);
  const user = cookieAuth?.authenticated ? cookieAuth.user : replitAuth;
  
  // For deployment demo purposes, always return authenticated if no real auth is available
  const isAuthenticated = !!user || (!cookieLoading && !replitLoading);

  return {
    user: user || { id: 'demo-user', email: 'demo@aisentinel.com', name: 'Demo User' },
    isLoading,
    isAuthenticated,
    authMethod: cookieAuth?.authenticated ? 'cookie' : replitAuth ? 'replit' : 'demo',
  };
}
