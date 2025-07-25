import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { CompanyProvider } from "@/hooks/useCompanyContext";
import Home from "@/pages/home.tsx";
import Landing from "@/pages/landing.tsx";
import Login from "@/pages/Login.tsx";
import VerificationSuccess from "@/pages/VerificationSuccess.tsx";
import PricingPage from "@/pages/pricing.tsx";
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
import CompanySetup from "@/pages/company-setup.tsx";
import RefreshAuth from "@/pages/refresh-auth.tsx";
import NotFound from "@/pages/not-found.tsx";


function Router() {
  console.log("[APP DEBUG] Router component rendering...");
  
  const { isAuthenticated, isLoading, user, isSuperUser, isOwner, isAdmin } = useAuth();
  
  console.log("[APP DEBUG] Authentication check:", { isAuthenticated, role: user?.role, roleLevel: user?.roleLevel, isAdmin, isOwner, isSuperUser });
  console.log("[APP DEBUG] useAuth hook returned:", { isAuthenticated, isLoading, user: !!user, isSuperUser, isOwner, isAdmin });

  // Show loading state while checking authentication
  if (isLoading) {
    console.log("[APP DEBUG] Showing loading state");
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        paddingBottom: '10vh'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            animation: 'spin 2s linear infinite',
            margin: '0 auto 1.5rem'
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
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: '#1e293b', 
            marginBottom: '0.5rem' 
          }}>AI Sentinel</h1>
          <p style={{ color: '#64748b' }}>Loading Enterprise AI Governance Platform...</p>
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

  // Create role-based route guard
  const RoleGuard = ({ children, requiredRole }: { children: React.ReactNode; requiredRole: 'admin' | 'owner' | 'super-user' }) => {
    const hasAccess = 
      requiredRole === 'admin' && (isAdmin || isOwner || isSuperUser) ||
      requiredRole === 'owner' && (isOwner || isSuperUser) ||
      requiredRole === 'super-user' && isSuperUser;

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
      
      {/* Demo route - accessible without authentication */}
      <Route path="/demo">
        {() => {
          console.log("[APP DEBUG] Demo mode accessed");
          return <Home />;
        }}
      </Route>
      
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
          
          if (!isAuthenticated) {
            console.log("[APP DEBUG] Not authenticated, showing landing page");
            console.log("[APP DEBUG] About to render Landing component");
            return <Landing />;
          }
          console.log("[APP DEBUG] Authenticated, showing home");
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
