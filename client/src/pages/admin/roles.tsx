import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Settings, Edit, Plus } from "lucide-react";

export default function AdminRoles() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <AdminLayout title="Roles & Permissions" subtitle="Manage user roles and access permissions">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sentinel-blue"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const roles = [
    {
      id: 1,
      name: "Administrator",
      description: "Full system access with all permissions",
      userCount: 2,
      permissions: ["manage_users", "manage_ai_models", "view_logs", "manage_settings"],
      color: "destructive"
    },
    {
      id: 2,
      name: "Manager",
      description: "Moderate access with user and content management",
      userCount: 5,
      permissions: ["manage_users", "view_logs", "manage_content"],
      color: "default"
    },
    {
      id: 3,
      name: "User",
      description: "Standard user with basic AI interaction permissions",
      userCount: 150,
      permissions: ["use_ai_chat", "view_own_activity"],
      color: "secondary"
    }
  ];

  return (
    <AdminLayout title="Roles & Permissions" subtitle="Manage user roles and access permissions">
      <div className="p-6 space-y-6">
        {/* Header with Add Role Button */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Role Management</h2>
            <p className="text-slate-600 mt-1">Configure user roles and their permissions</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Role
          </Button>
        </div>

        {/* Roles Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-sentinel-blue" />
                  {role.name}
                </CardTitle>
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">{role.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-sm text-slate-500">
                    <Users className="w-4 h-4 mr-1" />
                    {role.userCount} users
                  </div>
                  <Badge variant={role.color as any}>
                    {role.name}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Permissions:</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map((permission) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Permission Categories */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Permission Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium text-slate-800 mb-2">User Management</h4>
                <div className="space-y-1 text-sm text-slate-600">
                  <div>• Create, edit, and delete users</div>
                  <div>• Assign roles to users</div>
                  <div>• View user activity logs</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-slate-800 mb-2">AI Model Management</h4>
                <div className="space-y-1 text-sm text-slate-600">
                  <div>• Configure AI models</div>
                  <div>• Enable/disable models</div>
                  <div>• Set model parameters</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-slate-800 mb-2">Content & Security</h4>
                <div className="space-y-1 text-sm text-slate-600">
                  <div>• Manage content policies</div>
                  <div>• Configure security settings</div>
                  <div>• Review flagged content</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-slate-800 mb-2">System Settings</h4>
                <div className="space-y-1 text-sm text-slate-600">
                  <div>• Configure API settings</div>
                  <div>• Manage system preferences</div>
                  <div>• Access audit logs</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}