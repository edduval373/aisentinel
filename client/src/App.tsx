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
import NotFound from "@/pages/not-found.tsx";


function Router() {
  const { isAuthenticated, isLoading, user, isSuperUser, isOwner, isAdmin } = useAuth();
  
  console.log("Authentication check:", { isAuthenticated, role: user?.role, roleLevel: user?.roleLevel, isAdmin, isOwner, isSuperUser });

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sentinel-blue mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
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
      
      {/* Main routes - show landing page if not authenticated */}
      <Route path="/">
        {() => {
          if (!isAuthenticated) {
            console.log("Not authenticated, showing landing page");
            return <Landing />;
          }
          console.log("Authenticated, showing home");
          return <Home />;
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
