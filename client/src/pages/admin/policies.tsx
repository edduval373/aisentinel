import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Shield, AlertTriangle, Save, Plus, Edit, Trash2 } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminPolicies() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState("content-filters");

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

  const contentFilters = [
    {
      id: 1,
      name: "PII Detection",
      description: "Detects and blocks personally identifiable information",
      enabled: true,
      severity: "high",
      blockedCount: 147
    },
    {
      id: 2,
      name: "Financial Data Protection",
      description: "Prevents sharing of financial information and credentials",
      enabled: true,
      severity: "high",
      blockedCount: 89
    },
    {
      id: 3,
      name: "Code Security Scanner",
      description: "Identifies potentially malicious code patterns",
      enabled: true,
      severity: "medium",
      blockedCount: 34
    },
    {
      id: 4,
      name: "URL Filtering",
      description: "Blocks suspicious or unauthorized URLs",
      enabled: true,
      severity: "medium",
      blockedCount: 23
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AdminLayout title="Content Policies" subtitle="Manage security policies and content filtering rules">
      <div className="p-6 space-y-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("content-filters")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "content-filters"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Content Filters
          </button>
          <button
            onClick={() => setActiveTab("security-rules")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "security-rules"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Security Rules
          </button>
          <button
            onClick={() => setActiveTab("compliance")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "compliance"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Compliance
          </button>
        </div>

        {/* Content Filters Tab */}
        {activeTab === "content-filters" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Content Filtering Rules</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Filter
              </Button>
            </div>

            {contentFilters.map((filter) => (
              <Card key={filter.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-sentinel-blue" />
                      <div>
                        <CardTitle className="text-lg">{filter.name}</CardTitle>
                        <CardDescription>{filter.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getSeverityColor(filter.severity)}>
                        {filter.severity} priority
                      </Badge>
                      <Switch defaultChecked={filter.enabled} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">Blocked Today</p>
                      <p className="text-slate-600">{filter.blockedCount} attempts</p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Status</p>
                      <p className={filter.enabled ? "text-green-600" : "text-red-600"}>
                        {filter.enabled ? "Active" : "Disabled"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Severity</p>
                      <p className="text-slate-600 capitalize">{filter.severity}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                    <Button variant="outline" size="sm">
                      View Logs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Security Rules Tab */}
        {activeTab === "security-rules" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Security Configuration</h2>
              <Button>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>PII Detection Patterns</CardTitle>
                  <CardDescription>Regular expressions for detecting personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email-pattern">Email Pattern</Label>
                    <Input
                      id="email-pattern"
                      defaultValue="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone-pattern">Phone Pattern</Label>
                    <Input
                      id="phone-pattern"
                      defaultValue="\b\d{3}-\d{3}-\d{4}\b"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ssn-pattern">SSN Pattern</Label>
                    <Input
                      id="ssn-pattern"
                      defaultValue="\b\d{3}-\d{2}-\d{4}\b"
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Blocked Keywords</CardTitle>
                  <CardDescription>Keywords that trigger security warnings</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Enter blocked keywords, one per line..."
                    className="h-32 font-mono text-sm"
                    defaultValue={`password
secret_key
api_key
credit_card
social_security
bank_account`}
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Response Actions</CardTitle>
                <CardDescription>Define what happens when security rules are triggered</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label>Block Message</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label>Log Activity</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <Label>Notify Admin</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === "compliance" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Compliance Settings</h2>
              <Button>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Retention</CardTitle>
                  <CardDescription>Configure how long data is stored</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="chat-retention">Chat Messages</Label>
                    <Input
                      id="chat-retention"
                      defaultValue="90"
                      type="number"
                      className="w-20"
                    />
                    <span className="text-sm text-slate-600 ml-2">days</span>
                  </div>
                  <div>
                    <Label htmlFor="log-retention">Security Logs</Label>
                    <Input
                      id="log-retention"
                      defaultValue="365"
                      type="number"
                      className="w-20"
                    />
                    <span className="text-sm text-slate-600 ml-2">days</span>
                  </div>
                  <div>
                    <Label htmlFor="user-retention">User Activity</Label>
                    <Input
                      id="user-retention"
                      defaultValue="180"
                      type="number"
                      className="w-20"
                    />
                    <span className="text-sm text-slate-600 ml-2">days</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance Standards</CardTitle>
                  <CardDescription>Enable compliance with various standards</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label>GDPR Compliance</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label>HIPAA Compliance</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <Label>SOX Compliance</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <Label>PCI DSS</Label>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Audit Settings</CardTitle>
                <CardDescription>Configure audit logging and reporting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label>Enable Audit Logging</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label>Real-time Alerts</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <Label>Weekly Reports</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <Label>External SIEM Integration</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}