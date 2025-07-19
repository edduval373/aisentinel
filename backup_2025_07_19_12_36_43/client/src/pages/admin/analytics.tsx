import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Users, MessageSquare, Clock, Shield } from "lucide-react";

export default function AdminAnalytics() {
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
      <AdminLayout title="Usage Analytics" subtitle="Monitor system usage and performance metrics">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sentinel-blue"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const metrics = [
    {
      title: "Total Conversations",
      value: "15,847",
      change: "+12.5%",
      trend: "up",
      icon: MessageSquare,
      color: "text-blue-600"
    },
    {
      title: "Active Users",
      value: "1,234",
      change: "+8.2%",
      trend: "up",
      icon: Users,
      color: "text-green-600"
    },
    {
      title: "Security Blocks",
      value: "89",
      change: "-15.3%",
      trend: "down",
      icon: Shield,
      color: "text-red-600"
    },
    {
      title: "Avg Response Time",
      value: "2.3s",
      change: "-5.1%",
      trend: "down",
      icon: Clock,
      color: "text-purple-600"
    }
  ];

  const topModels = [
    { name: "Claude 3", usage: 45, color: "bg-blue-500" },
    { name: "GPT-4", usage: 35, color: "bg-green-500" },
    { name: "Claude 2", usage: 20, color: "bg-purple-500" }
  ];

  const topActivities = [
    { name: "Code Review", count: 234, percentage: 35 },
    { name: "Document Analysis", count: 189, percentage: 28 },
    { name: "Brainstorming", count: 156, percentage: 23 },
    { name: "Research", count: 94, percentage: 14 }
  ];

  return (
    <AdminLayout title="Usage Analytics" subtitle="Monitor system usage and performance metrics">
      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {metric.title}
                </CardTitle>
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{metric.value}</div>
                <div className="flex items-center text-xs text-slate-500">
                  <TrendingUp className={`w-3 h-3 mr-1 ${
                    metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
                  }`} />
                  <span className={
                    metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }>
                    {metric.change}
                  </span>
                  <span className="ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* AI Model Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                AI Model Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topModels.map((model) => (
                <div key={model.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${model.color}`} />
                    <span className="text-sm font-medium text-slate-700">{model.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${model.color}`} 
                        style={{ width: `${model.usage}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-600">{model.usage}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Activity Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Top Activity Types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topActivities.map((activity) => (
                <div key={activity.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-slate-700">{activity.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {activity.count} uses
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-slate-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-sentinel-blue" 
                        style={{ width: `${activity.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-600">{activity.percentage}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Usage Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Usage Trends (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                <p>Analytics chart would be displayed here</p>
                <p className="text-sm">Integration with charting library required</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">99.9%</div>
                <div className="text-sm text-slate-600">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">2.1s</div>
                <div className="text-sm text-slate-600">Avg Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">94%</div>
                <div className="text-sm text-slate-600">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}