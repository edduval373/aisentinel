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
  
  // Initialize session cookie from saved accounts if none exists
  React.useEffect(() => {
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('sessionToken='))
      ?.split('=')[1];
    
    if (!sessionCookie) {
      console.log('🔒 [SESSION INIT] No session cookie found, setting from saved account...');
      
      try {
        const savedAccounts = localStorage.getItem('aisentinel_saved_accounts');
        if (savedAccounts) {
          const accounts = JSON.parse(savedAccounts);
          if (accounts.length > 0) {
            // Use the primary account
            const account = accounts.find((acc: any) => acc.email === 'ed.duval15@gmail.com') || accounts[0];
            
            // Set secure session cookie
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 30);
            
            const isProduction = window.location.hostname.includes('aisentinel.app');
            const cookieSettings = isProduction 
              ? `sessionToken=${account.sessionToken}; path=/; expires=${expirationDate.toUTCString()}; secure; samesite=strict`
              : `sessionToken=${account.sessionToken}; path=/; expires=${expirationDate.toUTCString()}; samesite=lax`;
            
            document.cookie = cookieSettings;
            console.log('🔒 [SESSION INIT] Session cookie set from saved account:', account.sessionToken.substring(0, 20) + '...');
            
            // Trigger re-authentication
            queryClient.invalidateQueries({ queryKey: ['/api/auth/secure-me'] });
          }
        }
      } catch (error) {
        console.error('🔒 [SESSION INIT] Failed to initialize session:', error);
      }
    }
  }, [queryClient]);
  
  // SECURE AUTHENTICATION - COOKIE VALIDATION AGAINST RAILWAY DATABASE ONLY
  const { data, isLoading, error } = useQuery<AuthData>({
    queryKey: ['/api/auth/secure-me'],
    queryFn: async () => {
      try {
        console.log('🔒 [SECURE AUTH] Starting secure database authentication...');
        
        // Check if session cookie exists
        const sessionCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('sessionToken='))
          ?.split('=')[1];
          
        if (!sessionCookie) {
          console.log('🔒 [SECURE AUTH] No session cookie found - authentication failed');
          throw new Error('No session cookie found');
        }
        
        console.log('🔒 [SECURE AUTH] Session cookie found, validating against database...');
        
        // Call secure authentication endpoint that validates against Railway database
        const authResponse = await fetch('/api/auth/secure-me', {
          method: 'GET',
          credentials: 'include', // Include cookies
          headers: {
            'Content-Type': 'application/json',
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
