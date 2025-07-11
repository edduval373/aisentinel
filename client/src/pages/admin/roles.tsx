
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Settings, Edit, Plus, Trash2 } from "lucide-react";

interface CompanyRole {
  id: number;
  companyId: number;
  name: string;
  level: number;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

export default function AdminRoles() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [loading, setLoading] = useState(true);

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

    if (isAuthenticated && user?.companyId) {
      fetchRoles();
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const fetchRoles = async () => {
    try {
      const response = await fetch(`/api/company/roles/${user?.companyId}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch roles",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (level: number) => {
    if (level >= 100) return "destructive"; // Super-user
    if (level >= 99) return "default"; // Owner
    if (level >= 2) return "secondary"; // Admin
    return "outline"; // User
  };

  const getRoleDisplayName = (level: number) => {
    if (level >= 100) return "Super-user";
    if (level >= 99) return "Owner";
    if (level >= 2) return "Admin";
    return "User";
  };

  if (isLoading || loading) {
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
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">{role.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-sm text-slate-500">
                    <Users className="w-4 h-4 mr-1" />
                    Level {role.level}
                  </div>
                  <Badge variant={getRoleBadgeColor(role.level) as any}>
                    {getRoleDisplayName(role.level)}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Permissions:</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions && role.permissions.length > 0 ? (
                      role.permissions.map((permission, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {permission.replace('_', ' ')}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        No permissions set
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-4 text-xs text-slate-500">
                  Created: {new Date(role.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {roles.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No roles found</h3>
            <p className="text-slate-500 mb-4">Create your first company role to get started.</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Role
            </Button>
          </div>
        )}

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
