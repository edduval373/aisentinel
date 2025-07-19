import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyId?: number;
  companyName?: string;
  role?: string;
  roleLevel?: number;
}

interface AuthData {
  authenticated: boolean;
  user?: User;
}

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery<AuthData>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/auth/me');
      } catch (error: any) {
        // If authentication fails, return unauthenticated state
        if (error.status === 401) {
          return { authenticated: false };
        }
        throw error;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', 'POST');
      queryClient.clear();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      queryClient.clear();
      window.location.href = '/login';
    }
  };

  return {
    user: data?.user || null,
    isLoading,
    isAuthenticated: data?.authenticated || false,
    authMethod: 'email-verification',
    logout,
    error,
  };
}
