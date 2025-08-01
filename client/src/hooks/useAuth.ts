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
  
  console.log('🔍 useAuth - Strict authentication mode - NO FALLBACKS');
  
  // Initialize authentication from URL parameters and saved accounts
  React.useEffect(() => {
    initializeAuthFromURL();
    
    // Also check for saved session in localStorage if no cookie exists
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('sessionToken='))
      ?.split('=')[1];
      
    if (!sessionCookie) {
      console.log('🔄 [SESSION RESTORE] No session cookie found, checking localStorage...');
      
      try {
        const savedAccounts = localStorage.getItem('aisentinel_saved_accounts');
        if (savedAccounts) {
          const accounts = JSON.parse(savedAccounts);
          if (accounts.length > 0) {
            // Use the most recently used account
            const account = accounts.find((acc: any) => acc.email === 'ed.duval15@gmail.com') || accounts[0];
            console.log('🔄 [SESSION RESTORE] Found saved session, setting cookie...');
            
            // Set session cookie
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 7);
            document.cookie = `sessionToken=${account.sessionToken}; path=/; expires=${expirationDate.toUTCString()}; secure; samesite=lax`;
            
            console.log('✅ [SESSION RESTORE] Session cookie restored from localStorage');
          }
        }
      } catch (error) {
        console.error('❌ [SESSION RESTORE] Failed to restore session:', error);
      }
    }
  }, []);

  // STRICT AUTHENTICATION - NO FALLBACKS OR DEMO MODE
  const { data, isLoading, error } = useQuery<AuthData>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        // Get auth headers for header-based authentication (the working method)
        const headers = getAuthHeaders();
        console.log('🔄 Auth request with headers:', Object.keys(headers));
        
        const authResponse = await apiRequest('/api/auth/me', 'GET', null, headers);
        console.log("✅ Authentication response:", authResponse);
        
        // Check for production authentication success
        if (authResponse.authenticated === true || authResponse.isAuthenticated === true) {
          const user = authResponse.user || {
            id: authResponse.userId,
            email: authResponse.email,
            firstName: authResponse.firstName,
            lastName: authResponse.lastName,
            role: authResponse.role,
            roleLevel: authResponse.roleLevel || authResponse.effectiveRoleLevel,
            companyId: authResponse.companyId,
            companyName: authResponse.companyName
          };
          
          // Ensure companyId is properly extracted from user object if it exists there
          if (authResponse.user && authResponse.user.companyId) {
            user.companyId = authResponse.user.companyId;
            user.companyName = authResponse.user.companyName;
          }
          
          console.log('✅ Authentication successful via headers:', user);
          return { 
            authenticated: true, 
            user: user
          };
        } else {
          console.log('🔒 Server returned non-authenticated response');
          return { 
            authenticated: false, 
            user: null
          };
        }
      } catch (error) {
        console.error("❌ Authentication failed:", error);
        return { 
          authenticated: false, 
          user: null
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
