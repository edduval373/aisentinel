import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminSecurity() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (!user?.role?.includes('admin') && !user?.email?.includes('admin') && !user?.email?.includes('ed.duval15@gmail.com')))) {
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

  const securityAlerts = [
    {
      id: 1,
      type: "high",
      title: "Multiple Failed Authentication Attempts",
      description: "User john.doe@company.com has 5 failed login attempts in the last hour",
      timestamp: "2025-01-09 13:15:00",
      status: "active"
    },
    {
      id: 2,
      type: "medium",
      title: "PII Detection Spike",
      description: "15% increase in PII detection events compared to yesterday",
      timestamp: "2025-01-09 13:10:00",
      status: "acknowledged"
    },
    {
      id: 3,
      type: "low",
      title: "API Rate Limit Reached",
      description: "OpenAI API rate limit reached for user sarah.j@company.com",
      timestamp: "2025-01-09 13:05:00",
      status: "resolved"
    }
  ];

  const getAlertColor = (type: string) => {
    switch (type) {
      case "high": return "border-red-200 bg-red-50";
      case "medium": return "border-yellow-200 bg-yellow-50";
      case "low": return "border-blue-200 bg-blue-50";
      default: return "border-gray-200 bg-gray-50";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-red-100 text-red-800";
      case "acknowledged": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <AlertTriangle className="w-4 h-4" />;
      case "acknowledged": return <RefreshCw className="w-4 h-4" />;
      case "resolved": return <CheckCircle className="w-4 h-4" />;
      default: return <XCircle className="w-4 h-4" />;
    }
  };

  return (
    <AdminLayout title="Security Reports" subtitle="Monitor security events and threats">
      <div className="p-6 space-y-6">
        {/* Security Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">98.7%</p>
                  <p className="text-sm text-slate-600">Security Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">3</p>
                  <p className="text-sm text-slate-600">Active Threats</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">47</p>
                  <p className="text-sm text-slate-600">Blocked Attempts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">24h</p>
                  <p className="text-sm text-slate-600">Last Incident</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Security Alerts</CardTitle>
                <CardDescription>Recent security events requiring attention</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {securityAlerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(alert.status)}
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">{alert.title}</h4>
                        <p className="text-sm text-slate-600 mt-1">{alert.description}</p>
                        <p className="text-xs text-slate-500 mt-2">{alert.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={`${alert.type === 'high' ? 'border-red-300 text-red-700' : alert.type === 'medium' ? 'border-yellow-300 text-yellow-700' : 'border-blue-300 text-blue-700'}`}>
                        {alert.type}
                      </Badge>
                      <Badge className={getStatusColor(alert.status)}>
                        {alert.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <Button variant="outline" size="sm">
                      Investigate
                    </Button>
                    <Button variant="outline" size="sm">
                      Acknowledge
                    </Button>
                    <Button variant="outline" size="sm">
                      Resolve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Threat Detection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Threat Detection</CardTitle>
              <CardDescription>Real-time security monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">PII Detection</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Malware Scanner</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Anomaly Detection</span>
                  <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Rate Limiting</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Blocks</CardTitle>
              <CardDescription>Last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>PII Detection</span>
                  <span className="font-medium">23 blocks</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Sensitive Keywords</span>
                  <span className="font-medium">12 blocks</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Malicious URLs</span>
                  <span className="font-medium">8 blocks</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Code Injection</span>
                  <span className="font-medium">4 blocks</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}