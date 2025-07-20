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
  const { isAuthenticated, isLoading } = useAuth();

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

  return (
    <Switch>
      {/* Authentication routes - always available */}
      <Route path="/login" component={Login} />
      <Route path="/verify" component={VerificationSuccess} />
      
      {/* BYPASS LANDING PAGE - GO DIRECTLY TO CHAT */}
      
      {/* Always show chat interface - authentication bypassed */}
      <Route path="/" component={Home} />
      <Route path="/demo" component={Home} />
      
      {/* Protected routes - always accessible in bypass mode */}
      {(isAuthenticated || true) && (
        <>
          <Route path="/demo" component={Home} />
          <Route path="/test" component={() => <div>Test Route Works!</div>} />
          <Route path="/admin" component={CompanyManagement} />
          <Route path="/admin/models" component={AdminModels} />
          <Route path="/admin/activity-types" component={AdminActivityTypes} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/policies" component={AdminPolicies} />
          <Route path="/admin/logs" component={AdminLogs} />
          <Route path="/admin/security" component={AdminSecurity} />
          <Route path="/admin/roles" component={AdminRoles} />
          <Route path="/admin/analytics" component={AdminAnalytics} />
          <Route path="/admin/api-config" component={AdminApiConfig} />
          <Route path="/admin/security-settings" component={AdminSecuritySettings} />
          <Route path="/admin/permissions" component={AdminPermissions} />
          <Route path="/admin/model-settings" component={AdminModelSettings} />
          <Route path="/admin/context-management" component={AdminContextManagement} />
          <Route path="/admin/create-models" component={CreateModels} />
          <Route path="/admin/model-fusion" component={ModelFusion} />
          <Route path="/admin/setup-api-keys" component={SetupApiKeys} />
          <Route path="/admin/companies" component={CompanyManagement} />
          <Route path="/company-setup" component={CompanySetup} />
          <Route path="/admin/company-setup" component={CompanySetup} />
        </>
      )}
      
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
