import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Plus, Shield, Edit, Ban } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminUsers() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (!user?.role?.includes('admin') && !user?.email?.includes('admin')))) {
      toast({
        title: "Unauthorized",
        description: "You need admin privileges to access this page.",
        variant: "destructive",
      });
      window.location.href = "/";
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sentinel-blue"></div>
      </div>
    );
  }

  const users = [
    {
      id: "1",
      name: "Edward Duval",
      email: "ed.duval15@gmail.com",
      role: "admin",
      status: "active",
      lastActive: "2 minutes ago",
      totalSessions: 45,
      avatar: null
    },
    {
      id: "2", 
      name: "Sarah Johnson",
      email: "sarah.j@company.com",
      role: "user",
      status: "active",
      lastActive: "1 hour ago",
      totalSessions: 23,
      avatar: null
    },
    {
      id: "3",
      name: "Mike Chen",
      email: "mike.chen@company.com", 
      role: "user",
      status: "inactive",
      lastActive: "3 days ago",
      totalSessions: 12,
      avatar: null
    },
    {
      id: "4",
      name: "Lisa Rodriguez",
      email: "lisa.r@company.com",
      role: "moderator",
      status: "active", 
      lastActive: "30 minutes ago",
      totalSessions: 67,
      avatar: null
    }
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800";
      case "moderator": return "bg-blue-100 text-blue-800";
      case "user": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-yellow-100 text-yellow-800";
      case "banned": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AdminLayout title="User Management" subtitle="Manage user accounts, roles, and permissions">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-sentinel-blue" />
              <div>
                <p className="text-2xl font-bold text-slate-900">{users.length}</p>
                <p className="text-sm text-slate-600">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-slate-900">{users.filter(u => u.status === 'active').length}</p>
                <p className="text-sm text-slate-600">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-slate-900">{users.filter(u => u.role === 'admin').length}</p>
                <p className="text-sm text-slate-600">Administrators</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-slate-900">{users.reduce((sum, u) => sum + u.totalSessions, 0)}</p>
                <p className="text-sm text-slate-600">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((userData) => (
              <div key={userData.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={userData.avatar || undefined} />
                    <AvatarFallback>
                      {userData.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-slate-900">{userData.name}</p>
                    <p className="text-sm text-slate-600">{userData.email}</p>
                    <p className="text-xs text-slate-500">Last active: {userData.lastActive}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{userData.totalSessions} sessions</p>
                    <div className="flex space-x-2 mt-1">
                      <Badge className={getRoleBadgeColor(userData.role)}>
                        {userData.role}
                      </Badge>
                      <Badge className={getStatusBadgeColor(userData.status)}>
                        {userData.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Ban className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Management */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>Configure permissions for each user role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-slate-200 rounded-lg">
              <h3 className="font-medium text-slate-900 mb-2">Administrator</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Full system access</li>
                <li>• User management</li>
                <li>• AI model configuration</li>
                <li>• Security settings</li>
                <li>• Analytics and reports</li>
              </ul>
            </div>
            <div className="p-4 border border-slate-200 rounded-lg">
              <h3 className="font-medium text-slate-900 mb-2">Moderator</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Content moderation</li>
                <li>• User activity monitoring</li>
                <li>• Security alerts</li>
                <li>• Basic reporting</li>
                <li>• Activity type management</li>
              </ul>
            </div>
            <div className="p-4 border border-slate-200 rounded-lg">
              <h3 className="font-medium text-slate-900 mb-2">User</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• AI chat access</li>
                <li>• Approved activity types</li>
                <li>• Personal usage history</li>
                <li>• Basic profile settings</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}