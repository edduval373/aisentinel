import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Key, Globe, Shield, AlertCircle, Check } from "lucide-react";

export default function AdminApiConfig() {
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
      <AdminLayout title="API Configuration" subtitle="Manage API settings and integrations">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sentinel-blue"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const apiProviders = [
    {
      name: "OpenAI",
      status: "connected",
      model: "GPT-4",
      lastChecked: "2 minutes ago",
      rateLimitUsed: 45,
      rateLimitTotal: 100
    },
    {
      name: "Anthropic",
      status: "connected",
      model: "Claude 3",
      lastChecked: "1 minute ago",
      rateLimitUsed: 23,
      rateLimitTotal: 100
    },
    {
      name: "Cohere",
      status: "disabled",
      model: "Command",
      lastChecked: "Never",
      rateLimitUsed: 0,
      rateLimitTotal: 50
    }
  ];

  return (
    <AdminLayout title="API Configuration" subtitle="Manage API settings and integrations">
      <div className="p-6 space-y-6">
        {/* API Providers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              API Providers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {apiProviders.map((provider) => (
              <div key={provider.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      provider.status === 'connected' ? 'bg-green-500' : 'bg-slate-400'
                    }`} />
                    <span className="font-medium">{provider.name}</span>
                  </div>
                  <Badge variant={provider.status === 'connected' ? 'default' : 'secondary'}>
                    {provider.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-slate-600">
                    <div>Model: {provider.model}</div>
                    <div>Rate Limit: {provider.rateLimitUsed}/{provider.rateLimitTotal}</div>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* API Keys Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="w-5 h-5 mr-2" />
              API Keys
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <div className="flex space-x-2">
                  <Input
                    id="openai-key"
                    type="password"
                    placeholder="sk-..."
                    value="sk-...configured"
                    disabled
                  />
                  <Button variant="outline" size="sm">
                    <Check className="w-4 h-4 text-green-600" />
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                <div className="flex space-x-2">
                  <Input
                    id="anthropic-key"
                    type="password"
                    placeholder="sk-ant-..."
                    value="sk-ant-...configured"
                    disabled
                  />
                  <Button variant="outline" size="sm">
                    <Check className="w-4 h-4 text-green-600" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <AlertCircle className="w-4 h-4" />
              <span>API keys are stored securely and never displayed in full</span>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limiting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Rate Limiting & Quotas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="requests-per-minute">Requests per minute (per user)</Label>
                <Input
                  id="requests-per-minute"
                  type="number"
                  value="10"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="daily-quota">Daily quota (per user)</Label>
                <Input
                  id="daily-quota"
                  type="number"
                  value="100"
                  className="mt-1"
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-rate-limiting">Enable rate limiting</Label>
                <Switch id="enable-rate-limiting" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="quota-notifications">Quota notifications</Label>
                <Switch id="quota-notifications" defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              General API Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="timeout">Request timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value="30"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="max-tokens">Max tokens per request</Label>
                <Input
                  id="max-tokens"
                  type="number"
                  value="2048"
                  className="mt-1"
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-caching">Enable response caching</Label>
                <Switch id="enable-caching" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-logging">Enable API logging</Label>
                <Switch id="enable-logging" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-monitoring">Enable monitoring</Label>
                <Switch id="enable-monitoring" defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings */}
        <div className="flex justify-end space-x-2">
          <Button variant="outline">Reset to Defaults</Button>
          <Button>Save Configuration</Button>
        </div>
      </div>
    </AdminLayout>
  );
}