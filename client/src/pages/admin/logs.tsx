import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button-standard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card-standard";
import { Badge } from "@/components/ui/badge-standard";
import { Input } from "@/components/ui/input-standard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-standard";
import { hasAccessLevel, ACCESS_REQUIREMENTS } from "@/utils/roleBasedAccess";
import { BarChart3, Download, Filter, Search, AlertTriangle, Shield, User } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminLogs() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  // Check if user has admin level access (2 or above)
  const hasAdminAccess = hasAccessLevel(user?.roleLevel, ACCESS_REQUIREMENTS.ACTIVITY_LOGS);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !hasAdminAccess)) {
      toast({
        title: "Access Denied",
        description: "Admin access required (level 2+)",
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
      <AdminLayout title="Activity Logs" subtitle="Monitor system activity and security events">
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
      <AdminLayout title="Activity Logs" subtitle="Monitor system activity and security events">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '256px',
          gap: '16px'
        }}>
          <BarChart3 style={{ width: '48px', height: '48px', color: '#ef4444' }} />
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>
              Access Denied
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              Admin access required (level 2+)
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const activityLogs = [
    {
      id: 1,
      timestamp: "2025-01-09 13:15:32",
      user: "ed.duval15@gmail.com",
      action: "Message Sent",
      details: "AI chat interaction with Claude 3",
      status: "approved",
      type: "chat"
    },
    {
      id: 2,
      timestamp: "2025-01-09 13:12:45",
      user: "sarah.j@company.com",
      action: "Security Block",
      details: "PII detected in message content",
      status: "blocked",
      type: "security"
    },
    {
      id: 3,
      timestamp: "2025-01-09 13:10:18",
      user: "mike.chen@company.com",
      action: "Login",
      details: "User authenticated successfully",
      status: "success",
      type: "auth"
    },
    {
      id: 4,
      timestamp: "2025-01-09 13:08:22",
      user: "lisa.r@company.com",
      action: "Message Sent",
      details: "Data analysis request processed",
      status: "approved",
      type: "chat"
    },
    {
      id: 5,
      timestamp: "2025-01-09 13:05:15",
      user: "john.doe@company.com",
      action: "Security Block",
      details: "Suspicious URL detected",
      status: "blocked",
      type: "security"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "blocked": return "bg-red-100 text-red-800";
      case "success": return "bg-blue-100 text-blue-800";
      case "warning": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "chat": return <BarChart3 className="w-4 h-4" />;
      case "security": return <Shield className="w-4 h-4" />;
      case "auth": return <User className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || log.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <AdminLayout title="Activity Logs" subtitle="Monitor system activity and security events">
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">1,247</p>
                  <p className="text-sm text-slate-600">Total Events Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">23</p>
                  <p className="text-sm text-slate-600">Security Blocks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">89</p>
                  <p className="text-sm text-slate-600">Active Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">7</p>
                  <p className="text-sm text-slate-600">Warnings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Logs</CardTitle>
            <CardDescription>Search and filter system activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>

            {/* Logs Table */}
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-full">
                      {getTypeIcon(log.type)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{log.action}</p>
                      <p className="text-sm text-slate-600">{log.details}</p>
                      <p className="text-xs text-slate-500">{log.user} • {log.timestamp}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(log.status)}>
                    {log.status}
                  </Badge>
                </div>
              ))}
            </div>

            {filteredLogs.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-500">No logs found matching your search criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}