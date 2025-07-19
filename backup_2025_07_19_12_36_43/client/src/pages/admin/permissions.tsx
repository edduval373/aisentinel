import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Shield, Users, Settings, Eye, FileText, Bot } from "lucide-react";

export default function AdminPermissions() {
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
      <AdminLayout title="Permissions" subtitle="Configure activity permissions and access controls">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sentinel-blue"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const permissionCategories = [
    {
      name: "AI Model Access",
      icon: Bot,
      description: "Control which AI models users can access",
      permissions: [
        { name: "GPT-4", description: "Access to OpenAI GPT-4 model", enabled: true },
        { name: "Claude 3", description: "Access to Anthropic Claude 3 model", enabled: true },
        { name: "Claude 2", description: "Access to Anthropic Claude 2 model", enabled: false },
        { name: "Model Settings", description: "Configure AI model parameters", enabled: false }
      ]
    },
    {
      name: "Activity Types",
      icon: FileText,
      description: "Define what activities users can perform",
      permissions: [
        { name: "Code Review", description: "Review and analyze code", enabled: true },
        { name: "Document Analysis", description: "Analyze documents and content", enabled: true },
        { name: "Brainstorming", description: "Creative brainstorming sessions", enabled: true },
        { name: "Research", description: "Research and information gathering", enabled: true }
      ]
    },
    {
      name: "Content Access",
      icon: Eye,
      description: "Control what content users can access and share",
      permissions: [
        { name: "File Upload", description: "Upload files for analysis", enabled: true },
        { name: "Export Data", description: "Export conversation data", enabled: false },
        { name: "Share Conversations", description: "Share conversations with others", enabled: true },
        { name: "View History", description: "Access conversation history", enabled: true }
      ]
    },
    {
      name: "Administrative",
      icon: Shield,
      description: "Administrative privileges and system access",
      permissions: [
        { name: "User Management", description: "Manage user accounts", enabled: false },
        { name: "System Settings", description: "Configure system settings", enabled: false },
        { name: "View Logs", description: "Access system logs", enabled: false },
        { name: "Security Reports", description: "Generate security reports", enabled: false }
      ]
    }
  ];

  const rolePermissions = [
    {
      role: "Administrator",
      color: "destructive",
      permissions: {
        "AI Model Access": { enabled: 4, total: 4 },
        "Activity Types": { enabled: 4, total: 4 },
        "Content Access": { enabled: 4, total: 4 },
        "Administrative": { enabled: 4, total: 4 }
      }
    },
    {
      role: "Manager",
      color: "default",
      permissions: {
        "AI Model Access": { enabled: 3, total: 4 },
        "Activity Types": { enabled: 4, total: 4 },
        "Content Access": { enabled: 3, total: 4 },
        "Administrative": { enabled: 2, total: 4 }
      }
    },
    {
      role: "User",
      color: "secondary",
      permissions: {
        "AI Model Access": { enabled: 2, total: 4 },
        "Activity Types": { enabled: 4, total: 4 },
        "Content Access": { enabled: 3, total: 4 },
        "Administrative": { enabled: 0, total: 4 }
      }
    }
  ];

  return (
    <AdminLayout title="Permissions" subtitle="Configure activity permissions and access controls">
      <div className="p-6 space-y-6">
        {/* Permission Categories */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {permissionCategories.map((category) => (
            <Card key={category.name}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <category.icon className="w-5 h-5 mr-2" />
                  {category.name}
                </CardTitle>
                <p className="text-sm text-slate-600">{category.description}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {category.permissions.map((permission, index) => (
                  <div key={permission.name}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label htmlFor={`${category.name}-${permission.name}`} className="text-sm font-medium">
                          {permission.name}
                        </Label>
                        <p className="text-xs text-slate-600">{permission.description}</p>
                      </div>
                      <Switch
                        id={`${category.name}-${permission.name}`}
                        defaultChecked={permission.enabled}
                      />
                    </div>
                    {index < category.permissions.length - 1 && <Separator className="mt-3" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Role-Based Permission Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Role-Based Permissions
            </CardTitle>
            <p className="text-sm text-slate-600">Overview of permissions by role</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Role</th>
                    {permissionCategories.map((category) => (
                      <th key={category.name} className="text-center py-2 px-4">
                        {category.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rolePermissions.map((role) => (
                    <tr key={role.role} className="border-b">
                      <td className="py-3">
                        <Badge variant={role.color as any}>{role.role}</Badge>
                      </td>
                      {permissionCategories.map((category) => (
                        <td key={category.name} className="text-center py-3 px-4">
                          <div className="flex items-center justify-center">
                            <span className="text-sm">
                              {role.permissions[category.name].enabled} / {role.permissions[category.name].total}
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Activity-Specific Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Activity-Specific Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Default Activity Permissions</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New users can access all activities</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Require approval for new activities</span>
                    <Switch />
                  </div>
                </div>
              </div>
              <div>
                <Label>Content Restrictions</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Block sensitive content uploads</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Scan for PII in conversations</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings */}
        <div className="flex justify-end space-x-2">
          <Button variant="outline">Reset to Defaults</Button>
          <Button>Save Permissions</Button>
        </div>
      </div>
    </AdminLayout>
  );
}