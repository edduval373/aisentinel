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
  
  // BYPASS AUTHENTICATION FOR PRODUCTION - DIRECT ACCESS TO CHAT
  const { data, isLoading, error } = useQuery<AuthData>({
    queryKey: ['/api/user/current'],
    queryFn: async () => {
      // Always return authenticated state to bypass landing page
      return { 
        authenticated: true, 
        user: { 
          id: 'demo-user', 
          email: 'demo@aisentinel.app', 
          name: 'Demo User',
          role: 'user'
        } 
      };
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
