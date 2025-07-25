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
  
  // Check if we're in demo mode (only when explicitly accessing /demo path)
  const hasAuthCookie = document.cookie.includes('sessionToken=');
  const isDemoMode = window.location.pathname === '/demo';
  
  console.log('🔍 useAuth - Cookie check:', { hasAuthCookie, isDemoMode, pathname: window.location.pathname });
  
  // Real authentication - with demo mode bypass
  const { data, isLoading, error } = useQuery<AuthData>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      // If in demo mode, return demo user authenticated under company 1
      if (isDemoMode) {
        console.log("Demo mode activated - returning demo user under company 1 with roleLevel 0");
        return { 
          authenticated: true, 
          user: {
            id: 'demo@aisentinel.com',
            email: 'demo@aisentinel.com',
            firstName: 'Demo',
            lastName: 'User',
            companyId: 1,
            companyName: 'Duval AI Solutions', // Use real company name
            role: 'demo',
            roleLevel: 0 // Demo level - limited access, no super-user features
          }
        };
      }
      
      try {
        const authResponse = await apiRequest('/api/auth/me', 'GET');
        console.log("Authentication response:", authResponse);
        
        if (authResponse.authenticated && authResponse.user) {
          return { 
            authenticated: true, 
            user: authResponse.user
          };
        } else {
          return { 
            authenticated: false, 
            user: undefined
          };
        }
      } catch (error) {
        console.log("Authentication failed:", error);
        // No fallback - user must be authenticated (unless demo mode)
        console.log('🔒 Returning authenticated: false for fresh user');
        return { 
          authenticated: false, 
          user: undefined
        };
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

  // Extract user data for role-based authentication
  const user = data?.user || null;
  const isAuthenticated = data?.authenticated || false;
  // For demo mode, ensure roleLevel is 0, otherwise default to 1 for regular users
  const roleLevel = isDemoMode ? 0 : (user?.roleLevel ?? 1);
  
  // Role level hierarchy: super-user (100), owner (99), admin (2), user (1)
  const isAdmin = roleLevel >= 2;
  const isOwner = roleLevel >= 99;
  const isSuperUser = roleLevel >= 100;
  
  const hasRole = (requiredLevel: number) => {
    return roleLevel >= requiredLevel;
  };

  console.log("Authentication check:", {
    isAuthenticated,
    role: user?.role,
    roleLevel,
    isAdmin,
    isOwner,
    isSuperUser
  });

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isOwner,
    isSuperUser,
    hasRole,
    authMethod: 'replit-auth',
    logout,
    error,
  };
}
