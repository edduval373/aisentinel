import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { CompanyProvider } from "@/hooks/useCompanyContext";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import CompanyManagement from "@/pages/admin/company-management";
import AdminModels from "@/pages/admin/models";
import AdminActivityTypes from "@/pages/admin/activity-types";
import AdminUsers from "@/pages/admin/users";
import AdminPolicies from "@/pages/admin/policies";
import AdminLogs from "@/pages/admin/logs";
import AdminSecurity from "@/pages/admin/security";
import AdminRoles from "@/pages/admin/roles";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminApiConfig from "@/pages/admin/api-config";
import AdminSecuritySettings from "@/pages/admin/security-settings";
import AdminPermissions from "@/pages/admin/permissions";
import AdminModelSettings from "@/pages/admin/model-settings";
import AdminContextManagement from "@/pages/admin/context-management";
import CreateModels from "@/pages/admin/create-models";
import ModelFusion from "@/pages/admin/model-fusion";
import CompanySetup from "@/pages/company-setup";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
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
          <Route path="/admin/companies" component={CompanyManagement} />
          <Route path="/company-setup" component={CompanySetup} />
          <Route path="/admin/company-setup" component={CompanySetup} />
        </>
      )}
      <Route component={NotFound} />
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
