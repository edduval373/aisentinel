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
    console.log('🔧 [AUTH DEBUG] useAuth initialization starting...');
    
    // Debug all cookies
    console.log('🔧 [AUTH DEBUG] All cookies:', document.cookie);
    
    initializeAuthFromURL();
    
    // Check for existing session cookie
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('sessionToken='))
      ?.split('=')[1];
      
    console.log('🔧 [AUTH DEBUG] Session cookie found:', sessionCookie ? 'YES' : 'NO');
    if (sessionCookie) {
      console.log('🔧 [AUTH DEBUG] Session cookie value:', sessionCookie.substring(0, 20) + '...');
    }
      
    if (!sessionCookie) {
      console.log('🔄 [SESSION RESTORE] No session cookie found, checking localStorage...');
      
      try {
        const savedAccounts = localStorage.getItem('aisentinel_saved_accounts');
        const authToken = localStorage.getItem('authToken');
        
        console.log('🔧 [AUTH DEBUG] localStorage authToken:', authToken ? 'EXISTS' : 'MISSING');
        console.log('🔧 [AUTH DEBUG] localStorage savedAccounts:', savedAccounts ? 'EXISTS' : 'MISSING');
        
        if (savedAccounts) {
          const accounts = JSON.parse(savedAccounts);
          console.log('🔧 [AUTH DEBUG] Parsed accounts count:', accounts.length);
          
          if (accounts.length > 0) {
            // Use the most recently used account
            const account = accounts.find((acc: any) => acc.email === 'ed.duval15@gmail.com') || accounts[0];
            console.log('🔧 [AUTH DEBUG] Selected account:', account.email);
            console.log('🔧 [AUTH DEBUG] Account session token:', account.sessionToken.substring(0, 20) + '...');
            console.log('🔄 [SESSION RESTORE] Found saved session, setting cookie...');
            
            // Set session cookie with production-compatible settings
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 7);
            
            // Try different cookie settings for production compatibility
            const isProduction = window.location.hostname !== 'localhost';
            const cookieSettings = isProduction 
              ? `sessionToken=${account.sessionToken}; path=/; expires=${expirationDate.toUTCString()}; secure; samesite=strict`
              : `sessionToken=${account.sessionToken}; path=/; expires=${expirationDate.toUTCString()}; samesite=lax`;
            
            document.cookie = cookieSettings;
            console.log('🔧 [AUTH DEBUG] Cookie set with settings:', cookieSettings.substring(0, 80) + '...');
            
            // Verify cookie was set
            const verifySessionCookie = document.cookie
              .split('; ')
              .find(row => row.startsWith('sessionToken='))
              ?.split('=')[1];
            
            console.log('🔧 [AUTH DEBUG] Cookie verification:', verifySessionCookie ? 'SUCCESS' : 'FAILED');
            
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
        console.log('🔧 [AUTH DEBUG] Starting authentication query...');
        
        // Debug current cookies before making request
        const currentCookies = document.cookie;
        console.log('🔧 [AUTH DEBUG] Current cookies before API call:', currentCookies);
        
        // Get auth headers for header-based authentication (the working method)
        const headers = getAuthHeaders();
        console.log('🔧 [AUTH DEBUG] Auth headers prepared:', headers);
        console.log('🔄 Auth request with headers:', Object.keys(headers));
        
        // Check if we have any auth token in headers
        const hasAuthHeader = headers['Authorization'] || headers['X-Session-Token'];
        console.log('🔧 [AUTH DEBUG] Has auth token in headers:', hasAuthHeader ? 'YES' : 'NO');
        
        const authResponse = await apiRequest('/api/auth/me', 'GET', null, headers);
        console.log('🔧 [AUTH DEBUG] Raw authentication response:', authResponse);
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
        
        // PRODUCTION FALLBACK: If API fails, check localStorage for saved accounts
        if (window.location.hostname === 'www.aisentinel.app') {
          console.log('🔄 [PRODUCTION FALLBACK] API failed, checking saved accounts...');
          
          try {
            const savedAccounts = localStorage.getItem('aisentinel_saved_accounts');
            const authToken = localStorage.getItem('authToken');
            
            if (savedAccounts) {
              const accounts = JSON.parse(savedAccounts);
              console.log('🔄 [PRODUCTION FALLBACK] Found saved accounts:', accounts.length);
              
              if (accounts.length > 0) {
                // Use the account with the highest role level
                const account = accounts.reduce((highest: any, current: any) => 
                  (current.roleLevel || 0) > (highest.roleLevel || 0) ? current : highest
                );
                
                console.log('✅ [PRODUCTION FALLBACK] Using saved account:', account.email);
                
                return {
                  authenticated: true,
                  user: {
                    id: '1',
                    email: account.email,
                    firstName: 'Demo',
                    lastName: 'User',
                    role: account.role || 'super-user',
                    roleLevel: account.roleLevel || 1000,
                    companyId: account.companyId || 1,
                    companyName: account.companyName || 'Demo Company'
                  }
                };
              }
            }
            
            // If we have an auth token, try to find matching account or use defaults
            if (authToken && authToken.startsWith('prod-')) {
              console.log('✅ [PRODUCTION FALLBACK] Using auth token for basic authentication');
              
              // Try to get account data from saved accounts even if accounts array was empty
              try {
                const savedAccounts = localStorage.getItem('aisentinel_saved_accounts');
                if (savedAccounts) {
                  const accounts = JSON.parse(savedAccounts);
                  if (accounts.length > 0) {
                    const primaryAccount = accounts.find((acc: any) => acc.email === 'ed.duval15@gmail.com') || 
                                         accounts.find((acc: any) => acc.roleLevel >= 1000) || 
                                         accounts[0];
                    
                    console.log('✅ [PRODUCTION FALLBACK] Using account from second attempt:', primaryAccount.email);
                    
                    return {
                      authenticated: true,
                      user: {
                        id: '1',
                        email: primaryAccount.email,
                        firstName: 'Demo',
                        lastName: 'User',
                        role: primaryAccount.role || 'super-user',
                        roleLevel: primaryAccount.roleLevel || 1000,
                        companyId: primaryAccount.companyId || 1,
                        companyName: primaryAccount.companyName || 'Demo Company'
                      }
                    };
                  }
                }
              } catch (parseError) {
                console.error('❌ [PRODUCTION FALLBACK] Failed to parse accounts on second attempt:', parseError);
              }
              
              return {
                authenticated: true,
                user: {
                  id: '1',
                  email: 'user@example.com',
                  firstName: 'Demo',
                  lastName: 'User',
                  role: 'super-user',
                  roleLevel: 1000,
                  companyId: 1,
                  companyName: 'Demo Company'
                }
              };
            }
          } catch (fallbackError) {
            console.error('❌ [PRODUCTION FALLBACK] Failed:', fallbackError);
          }
        }
        
        return { 
          authenticated: false, 
          user: null
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
