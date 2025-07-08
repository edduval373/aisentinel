import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Activity, Settings, Plus, Shield } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminActivityTypes() {
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

  const activityTypes = [
    {
      id: 1,
      name: "Brainstorming",
      description: "Creative ideation and problem-solving sessions",
      enabled: true,
      riskLevel: "low",
      permissions: ["read", "write"],
      usageCount: 342
    },
    {
      id: 2,
      name: "Data Analysis",
      description: "Processing and analyzing datasets",
      enabled: true,
      riskLevel: "medium",
      permissions: ["read", "write", "analyze"],
      usageCount: 156
    },
    {
      id: 3,
      name: "Code Review",
      description: "Reviewing and analyzing code for quality and security",
      enabled: false,
      riskLevel: "high",
      permissions: ["read", "analyze", "audit"],
      usageCount: 89
    },
    {
      id: 4,
      name: "Content Creation",
      description: "Writing and editing content for various purposes",
      enabled: true,
      riskLevel: "low",
      permissions: ["read", "write", "edit"],
      usageCount: 278
    }
  ];

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AdminLayout title="Activity Types" subtitle="Manage allowed activities and their permissions">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Activity Type
          </Button>
        </div>

      <div className="grid gap-4">
        {activityTypes.map((activity) => (
          <Card key={activity.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Activity className="w-5 h-5 text-sentinel-blue" />
                  <div>
                    <CardTitle className="text-lg">{activity.name}</CardTitle>
                    <CardDescription>{activity.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={getRiskBadgeColor(activity.riskLevel)}>
                    {activity.riskLevel} risk
                  </Badge>
                  <Switch defaultChecked={activity.enabled} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium text-slate-900 mb-1">Permissions</p>
                  <div className="flex flex-wrap gap-1">
                    {activity.permissions.map((perm) => (
                      <Badge key={perm} variant="outline" className="text-xs">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Usage Count</p>
                  <p className="text-slate-600">{activity.usageCount} sessions</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Risk Level</p>
                  <p className="text-slate-600 capitalize">{activity.riskLevel}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Status</p>
                  <p className={activity.enabled ? "text-green-600" : "text-red-600"}>
                    {activity.enabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
                <Button variant="outline" size="sm">
                  <Shield className="w-4 h-4 mr-2" />
                  Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
          <CardDescription>Activity type usage over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">865</p>
              <p className="text-sm text-slate-600">Total Sessions Today</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">4</p>
              <p className="text-sm text-slate-600">Active Activity Types</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">12</p>
              <p className="text-sm text-slate-600">Security Blocks Today</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">98.6%</p>
              <p className="text-sm text-slate-600">Approval Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}