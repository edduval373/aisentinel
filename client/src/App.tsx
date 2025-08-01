import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { CompanyProvider } from "@/hooks/useCompanyContext";
import { useEffect } from "react";
import { apiRequest } from "./lib/queryClient";
import Home from "@/pages/home.tsx";
import Landing from "@/pages/landing.tsx";
import Login from "@/pages/Login.tsx";
import VerificationSuccess from "@/pages/VerificationSuccess.tsx";
import PricingPage from "@/pages/pricing.tsx";
import DemoSignup from "@/pages/demo-signup.tsx";
import CompanyManagement from "@/pages/admin/company-management.tsx";
import AdminModels from "@/pages/admin/models.tsx";
import AdminActivityTypes from "@/pages/admin/activity-types.tsx";
import AdminUsers from "@/pages/admin/users.tsx";
import AdminPolicies from "@/pages/admin/policies.tsx";
import AdminLogs from "@/pages/admin/logs.tsx";
import AdminSecurity from "@/pages/admin/security.tsx";
import AdminRoles from "@/pages/admin/roles.tsx";
import AdminAnalytics from "@/pages/admin/analytics.tsx";
import AdminApiConfig from "@/pages/admin/api-config.tsx";
import AdminSecuritySettings from "@/pages/admin/security-settings.tsx";
import AdminPermissions from "@/pages/admin/permissions.tsx";
import AdminModelSettings from "@/pages/admin/model-settings.tsx";
import AdminContextManagement from "@/pages/admin/context-management.tsx";
import CreateModels from "@/pages/admin/create-models.tsx";
import ModelFusion from "@/pages/admin/model-fusion.tsx";
import SetupApiKeys from "@/pages/admin/setup-api-keys.tsx";
import RoleManagement from "@/pages/admin/role-management.tsx";
import VersionManagement from "@/pages/admin/version-management.tsx";
import CompanySetup from "@/pages/company-setup.tsx";
import RefreshAuth from "@/pages/refresh-auth.tsx";
import NotFound from "@/pages/not-found.tsx";


function Router() {
  console.log("[APP DEBUG] Router component rendering...");
  
  const { isAuthenticated, isLoading, user, isSuperUser, isOwner, isAdmin } = useAuth();
  
  // Handle URL-based session activation and header authentication
  useEffect(() => {
    // Initialize auth token from URL if present
    const initializeAuth = async () => {
      const { initializeAuthFromURL } = await import('./lib/authHeaders');
      initializeAuthFromURL();
    };
    initializeAuth();

    const params = new URLSearchParams(window.location.search);
    const sessionToken = params.get('session');
    const backupToken = params.get('backup-session');
    const directSession = params.get('direct-session');
    const authToken = params.get('auth-token');
    

    
    // Handle header-based auth token (new approach)
    if (authToken && authToken.startsWith('prod-')) {
      console.log('🔄 [HEADER AUTH] Detected auth token in URL, storing for header authentication...');
      
      const handleAuthToken = async () => {
        const { setAuthToken } = await import('./lib/authHeaders');
        setAuthToken(authToken);
        
        // Clean URL without refresh to allow immediate auth check
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Force re-render by invalidating the auth query
        setTimeout(() => {
          window.location.reload();
        }, 100);
      };
      
      handleAuthToken();
      return;
    }
    
    // Handle regular URL session transfer (legacy)
    if (sessionToken && sessionToken.startsWith('prod-session-')) {
      console.log('🔄 [URL SESSION] Detected session token in URL, activating...');
      
      apiRequest('/api/auth/activate-session', 'POST', { sessionToken })
        .then((result) => {
          console.log('✅ [URL SESSION] Session activated successfully:', result);
          // Remove session param from URL and reload to trigger auth check
          const cleanUrl = window.location.pathname + '?t=' + Date.now();
          window.history.replaceState({}, document.title, cleanUrl);
          window.location.reload();
        })
        .catch((error) => {
          console.error('❌ [URL SESSION] Session activation failed:', error);
          // Remove session param anyway to prevent loops
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        });
    }
    
    // Handle backup session from localStorage
    else if (backupToken && backupToken.startsWith('prod-session-')) {
      console.log('🔄 [BACKUP SESSION] Using backup session token...');
      
      // Set cookie manually
      document.cookie = `sessionToken=${backupToken}; path=/; secure; samesite=lax; max-age=2592000`;
      
      // Clean URL and reload
      const cleanUrl = window.location.pathname + '?t=' + Date.now();
      window.history.replaceState({}, document.title, cleanUrl);
      window.location.reload();
    }
    
    // Handle direct session flag
    else if (directSession === 'true') {
      console.log('🔄 [DIRECT SESSION] Direct session transfer detected, checking localStorage...');
      
      const backup = localStorage.getItem('aisentinel_session_backup');
      if (backup) {
        try {
          const data = JSON.parse(backup);
          if (data.sessionToken && data.sessionToken.startsWith('prod-session-')) {
            console.log('✅ [DIRECT SESSION] Found backup session, setting cookie...');
            document.cookie = `sessionToken=${data.sessionToken}; path=/; secure; samesite=lax; max-age=2592000`;
          }
        } catch (e) {
          console.error('❌ [DIRECT SESSION] Invalid backup data:', e);
        }
      }
      
      // Clean URL and reload
      const cleanUrl = window.location.pathname + '?t=' + Date.now();
      window.history.replaceState({}, document.title, cleanUrl);
      window.location.reload();
    }
  }, []);
  
  console.log("[APP DEBUG] Authentication check:", { isAuthenticated, role: user?.role, roleLevel: user?.roleLevel, isAdmin, isOwner, isSuperUser });
  console.log("[APP DEBUG] useAuth hook returned:", { isAuthenticated, isLoading, user: !!user, isSuperUser, isOwner, isAdmin });

  // If still loading authentication, show nothing (let HTML loading screen continue)
  if (isLoading) {
    return null; // Let the HTML loading screen handle this
  }

  // Check if user just logged out
  const hasLogoutFlag = new URLSearchParams(window.location.search).get('logout') === 'true' || 
                        sessionStorage.getItem('forceLogout') === 'true';
  
  // If user just logged out, clear the flag and force landing page
  if (hasLogoutFlag) {
    sessionStorage.removeItem('forceLogout');
    console.log("[APP DEBUG] Logout detected, forcing landing page");
  }
  
  // If authenticated, show main interface (not landing page)
  if (isAuthenticated && !hasLogoutFlag) {
    console.log("[APP DEBUG] User is authenticated, showing main application interface");
  } else {
    console.log("[APP DEBUG] STRICT MODE: Not authenticated, showing landing page");
  }

  // STRICT role-based route guard - NO DEMO FALLBACKS
  const RoleGuard = ({ children, requiredRole }: { children: React.ReactNode; requiredRole: 'admin' | 'owner' | 'super-user' }) => {
    const hasAccess = 
      requiredRole === 'admin' && (isAdmin || isOwner || isSuperUser) ||
      requiredRole === 'owner' && (isOwner || isSuperUser) ||
      requiredRole === 'super-user' && isSuperUser;

    // STRICT: Must be authenticated, no exceptions
    if (!isAuthenticated) {
      return <Landing />;
    }

    if (!hasAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-4">You need {requiredRole} privileges to access this section.</p>
            <p className="text-sm text-gray-500">Current role: {user?.role || 'user'}</p>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  };

  return (
    <Switch>
      {/* Authentication routes - always available */}
      <Route path="/login" component={Login} />
      <Route path="/verify" component={VerificationSuccess} />
      <Route path="/landing" component={Landing} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/demo-signup" component={DemoSignup} />
      
      {/* Demo route REMOVED - NO FALLBACKS */}
      
      {/* Chat route - authenticated users only */}
      <Route path="/chat">
        {() => {
          if (!isAuthenticated) {
            console.log("[APP DEBUG] Chat access denied - not authenticated, redirecting to landing");
            return <Landing />;
          }
          console.log("[APP DEBUG] Chat access granted - showing Home component");
          return <CompanyProvider><Home /></CompanyProvider>;
        }}
      </Route>
      
      {/* Main routes - show landing page if not authenticated */}
      <Route path="/">
        {() => {
          // Check for verification success
          const params = new URLSearchParams(window.location.search);
          const verifiedEmail = params.get('email');
          const isVerified = params.get('verified') === 'true';
          
          // If user just logged out, force landing page
          if (hasLogoutFlag) {
            console.log("[APP DEBUG] User logged out, showing landing page");
            return <Landing />;
          }
          
          if (isVerified && verifiedEmail) {
            console.log("[APP DEBUG] Email verification successful for:", verifiedEmail);
            // Clear URL parameters and force page refresh to update auth state
            window.history.replaceState({}, document.title, '/');
            setTimeout(() => window.location.reload(), 100);
            return (
              <div style={{ 
                minHeight: '100vh', 
                backgroundColor: '#f9fafb', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    animation: 'spin 2s linear infinite',
                    margin: '0 auto 16px auto'
                  }}>
                    <img 
                      src="/ai-sentinel-logo.png" 
                      alt="AI Sentinel" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain',
                        filter: 'brightness(1.1) saturate(1.3) contrast(1.2)'
                      }} 
                    />
                  </div>
                  <p style={{ color: '#6b7280' }}>Verification successful! Loading your dashboard...</p>
                </div>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            );
          }
          
          // STRICT SECURITY: Only authenticated users can access chat
          if (!isAuthenticated) {
            console.log("[APP DEBUG] STRICT MODE: Not authenticated, showing landing page");
            document.title = "AI Sentinel - Enterprise AI Governance Platform";
            return <Landing />;
          }
          
          // STRICT: Only show home if explicitly authenticated by server
          console.log("[APP DEBUG] STRICT MODE: Authenticated user verified, showing home");
          return <CompanyProvider><Home /></CompanyProvider>;
        }}
      </Route>
      
      {/* Protected admin routes with role-based access */}
      <Route path="/admin">
        {() => (
          <RoleGuard requiredRole="super-user">
            <CompanyManagement />
          </RoleGuard>
        )}
      </Route>
      
      <Route path="/admin/role-management">
        {() => (
          <RoleGuard requiredRole="super-user">
            <RoleManagement />
          </RoleGuard>
        )}
      </Route>
      
      <Route path="/admin/version-management">
        {() => (
          <RoleGuard requiredRole="super-user">
            <VersionManagement />
          </RoleGuard>
        )}
      </Route>
      
      <Route path="/admin/models">
        {() => (
          <RoleGuard requiredRole="owner">
            <AdminModels />
          </RoleGuard>
        )}
      </Route>
      
      <Route path="/admin/activity-types">
        {() => (
          <RoleGuard requiredRole="admin">
            <AdminActivityTypes />
          </RoleGuard>
        )}
      </Route>
      
      <Route path="/admin/users">
        {() => (
          <RoleGuard requiredRole="admin">
            <AdminUsers />
          </RoleGuard>
        )}
      </Route>
      
      <Route path="/admin/policies">
        {() => (
          <RoleGuard requiredRole="admin">
            <AdminPolicies />
          </RoleGuard>
        )}
      </Route>
      
      <Route path="/admin/logs">
        {() => (
          <RoleGuard requiredRole="admin">
            <AdminLogs />
          </RoleGuard>
        )}
      </Route>
      
      <Route path="/admin/security">
        {() => (
          <RoleGuard requiredRole="admin">
            <AdminSecurity />
          </RoleGuard>
        )}
      </Route>
      
      <Route path="/admin/roles">
        {() => (
          <RoleGuard requiredRole="admin">
            <AdminRoles />
          </RoleGuard>
        )}
      </Route>
      
      <Route path="/admin/analytics">
        {() => (
          <RoleGuard requiredRole="admin">
            <AdminAnalytics />
          </RoleGuard>
        )}
      </Route>
      
      <Route path="/admin/api-config">
        {() => (
          <RoleGuard requiredRole="owner">
            <AdminApiConfig />
          </RoleGuard>
        )}
      </Route>
      
      <Route path="/admin/security-settings">
        {() => (
          <RoleGuard requiredRole="admin">
            <AdminSecuritySettings />
          </RoleGuard>
        )}
      </Route>
      
      <Route path="/admin/permissions">
        {() => (
          <RoleGuard requiredRole="admin">
            <AdminPermissions />
          </RoleGuard>
        )}
      </Route>
      
      <Route path="/admin/model-settings">
        {() => (
          <RoleGuard requiredRole="owner">
            <AdminModelSettings />
          </RoleGuard>
        )}
      </Route>
      
      <Route path="/admin/context-management">
        {() => (
          <RoleGuard requiredRole="admin">
            <AdminContextManagement />
          </RoleGuard>
        )}
      </Route>
      
      <Route path="/admin/create-models">
        {() => (
          <RoleGuard requiredRole="owner">
            <CreateModels />
          </RoleGuard>
        )}
      </Route>
      
      <Route path="/admin/model-fusion">
        {() => (
          <RoleGuard requiredRole="owner">
            <ModelFusion />
          </RoleGuard>
        )}
      </Route>
      
      <Route path="/admin/setup-api-keys">
        {() => (
          <RoleGuard requiredRole="owner">
            <SetupApiKeys />
          </RoleGuard>
        )}
      </Route>
      
      <Route path="/admin/companies">
        {() => (
          <RoleGuard requiredRole="super-user">
            <CompanyManagement />
          </RoleGuard>
        )}
      </Route>
      
      <Route path="/company-setup">
        {() => (
          <RoleGuard requiredRole="owner">
            <CompanySetup />
          </RoleGuard>
        )}
      </Route>
      
      <Route path="/admin/company-setup">
        {() => (
          <RoleGuard requiredRole="owner">
            <CompanySetup />
          </RoleGuard>
        )}
      </Route>
      
      {/* Refresh authentication route */}
      <Route path="/refresh-auth" component={RefreshAuth} />
      
      {/* Fallback route */}
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CompanyProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </CompanyProvider>
    </QueryClientProvider>
  );
}

export default App;
