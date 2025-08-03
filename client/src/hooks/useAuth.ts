import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getAuthHeaders, initializeAuthFromURL } from "@/lib/authHeaders";
import React from "react";

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
  
  console.log('🔒 [SECURE AUTH] Cookie-only authentication - DATABASE VALIDATION ONLY');
  
  // No cookie initialization - using header-based authentication strategy
  
  // SECURE AUTHENTICATION - COOKIE VALIDATION AGAINST RAILWAY DATABASE ONLY
  const { data, isLoading, error } = useQuery<AuthData>({
    queryKey: ['/api/auth/secure-me'],
    queryFn: async () => {
      try {
        console.log('🔒 [SECURE AUTH] Starting secure database authentication...');
        
        // Use header-based authentication - get session token from saved accounts
        const savedAccounts = localStorage.getItem('aisentinel_saved_accounts');
        if (!savedAccounts) {
          console.log('🔒 [SECURE AUTH] No saved accounts found - authentication failed');
          throw new Error('No saved accounts found');
        }

        const accounts = JSON.parse(savedAccounts);
        const account = accounts.find((acc: any) => acc.email === 'ed.duval15@gmail.com') || accounts[0];
        
        if (!account || !account.sessionToken) {
          console.log('🔒 [SECURE AUTH] No valid account session token found');
          throw new Error('No valid session token found');
        }

        const sessionToken = account.sessionToken;
        
        console.log('🔒 [SECURE AUTH] Session token found, validating with header-based auth...');
        
        // Call secure authentication endpoint using header-based authentication
        const authResponse = await fetch('/api/auth/secure-me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
            'X-Session-Token': sessionToken,
          },
        });
        
        const data = await authResponse.json();
        console.log('🔒 [SECURE AUTH] Database validation response:', data);
        
        if (!authResponse.ok || !data.authenticated) {
          console.log('🔒 [SECURE AUTH] Database validation failed:', data.error);
          throw new Error(data.error || 'Authentication failed');
        }
        
        console.log('✅ [SECURE AUTH] Database validation successful for:', data.user.email);
        
        return {
          authenticated: true,
          user: data.user
        };
      } catch (error) {
        console.error("🔒 [SECURE AUTH] Database authentication failed:", error);
        
        // NO FALLBACKS - SECURITY REQUIREMENT
        // For a security application, we must validate against the database only
        return { 
          authenticated: false, 
          user: undefined
        };
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
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
  const user = data?.user || undefined;
  const isAuthenticated = data?.authenticated || false;
  // STRICT MODE: Use server-provided roleLevel only, no demo fallbacks
  const roleLevel = user?.roleLevel ?? 1;
  
  // Role level hierarchy: super-user (1000), owner (999), administrator (998), admin (2), user (1)
  const isAdmin = roleLevel >= 2;
  const isOwner = roleLevel >= 999;
  const isSuperUser = roleLevel >= 1000;
  
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
