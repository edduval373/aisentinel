import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth"; 
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button-standard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card-standard";
import { Badge } from "@/components/ui/badge-standard";
import { hasAccessLevel, ACCESS_REQUIREMENTS } from "@/utils/roleBasedAccess";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Users, Plus, Shield, Edit, Ban, Mail, UserPlus } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminUsers() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'user',
    message: ''
  });
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    status: ''
  });

  // Check if user has administrator level access (98 or above)
  const hasAdminAccess = hasAccessLevel(user?.roleLevel, ACCESS_REQUIREMENTS.USER_MANAGEMENT);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !hasAdminAccess)) {
      toast({
        title: "Access Denied",
        description: "Administrator access required (level 98+)",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, hasAdminAccess, toast]);

  if (isLoading) {
    return (
      <AdminLayout title="User Management" subtitle="Manage users, roles, and permissions">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '256px' 
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '2px solid #3b82f6',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      </AdminLayout>
    );
  }
  
  // Return access denied if not authenticated or lacks access
  if (!isAuthenticated || !hasAdminAccess) {
    return (
      <AdminLayout title="User Management" subtitle="Manage users, roles, and permissions">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '256px',
          gap: '16px'
        }}>
          <Users style={{ width: '48px', height: '48px', color: '#ef4444' }} />
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>
              Access Denied
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              Administrator access required (level 98+)
            </p>
          </div>
        </div>
      </AdminLayout>
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

  const handleInviteUser = async () => {
    if (!inviteForm.email || !inviteForm.name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteForm.email} successfully`,
      });
      
      // Reset form and close dialog
      setInviteForm({
        email: '',
        name: '',
        role: 'user',
        message: ''
      });
      setInviteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    setEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editForm.name || !editForm.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "User Updated",
        description: `${editForm.name}'s information has been updated successfully`,
      });
      
      setEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout title="User Management" subtitle="Manage user accounts, roles, and permissions">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Invite New User
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@company.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({...inviteForm, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteForm.role} onValueChange={(value) => setInviteForm({...inviteForm, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Welcome Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Welcome to AI Sentinel! You've been invited to join our platform..."
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm({...inviteForm, message: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInviteUser}>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit User Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Edit className="w-5 h-5 mr-2" />
                  Edit User
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name *</Label>
                  <Input
                    id="edit-name"
                    placeholder="John Doe"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email Address *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    placeholder="user@company.com"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select value={editForm.role} onValueChange={(value) => setEditForm({...editForm, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={editForm.status} onValueChange={(value) => setEditForm({...editForm, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="banned">Banned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveUser}>
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                    <Button variant="outline" size="sm" onClick={() => handleEditUser(userData)}>
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