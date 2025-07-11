
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    level: '',
    description: '',
    permissions: [] as string[]
  });

  const availablePermissions = [
    'full_system_access',
    'manage_companies',
    'manage_company',
    'manage_users',
    'manage_roles',
    'manage_settings',
    'manage_content',
    'manage_ai_models',
    'manage_activity_types',
    'view_analytics',
    'view_all_data',
    'view_personal_data',
    'use_chat',
    'use_ai_models'
  ];

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
    if (level >= 1000) return "destructive"; // Super-user
    if (level >= 999) return "default"; // Owner
    if (level >= 998) return "secondary"; // Admin
    return "outline"; // User
  };

  const getRoleDisplayName = (level: number) => {
    if (level >= 1000) return "Super-user";
    if (level >= 999) return "Owner";
    if (level >= 998) return "Admin";
    return "User";
  };

  const createRole = async () => {
    try {
      const roleData = {
        ...newRole,
        level: parseInt(newRole.level),
        permissions: newRole.permissions
      };

      const response = await fetch(`/api/company/roles/${user?.companyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(roleData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Role created successfully",
        });
        setIsCreateDialogOpen(false);
        setNewRole({ name: '', level: '', description: '', permissions: [] });
        fetchRoles();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to create role",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating role:", error);
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive",
      });
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setNewRole(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission)
    }));
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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Role Name</Label>
                  <Input
                    id="name"
                    value={newRole.name}
                    onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Manager, Team Lead"
                  />
                </div>
                
                <div>
                  <Label htmlFor="level">Role Level</Label>
                  <Input
                    id="level"
                    type="number"
                    value={newRole.level}
                    onChange={(e) => setNewRole(prev => ({ ...prev, level: e.target.value }))}
                    placeholder="e.g., 500 (between 1-999 for custom roles)"
                    min="1"
                    max="999"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    1000: Super User, 999: Owner, 998: Admin, 1: User. Use values between for custom roles.
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newRole.description}
                    onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this role's responsibilities"
                  />
                </div>
                
                <div>
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto">
                    {availablePermissions.map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission}
                          checked={newRole.permissions.includes(permission)}
                          onCheckedChange={(checked) => handlePermissionChange(permission, checked as boolean)}
                        />
                        <Label htmlFor={permission} className="text-sm">
                          {permission.replace(/_/g, ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createRole} disabled={!newRole.name || !newRole.level}>
                    Create Role
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Role
                </Button>
              </DialogTrigger>
            </Dialog>
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
