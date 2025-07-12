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
  const isAuthenticated = !!user;

  return {
    user,
    isLoading,
    isAuthenticated,
    authMethod: cookieAuth?.authenticated ? 'cookie' : 'replit',
  };
}
