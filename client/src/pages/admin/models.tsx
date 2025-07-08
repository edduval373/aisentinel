import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Bot, Settings, Plus } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminModels() {
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

  return (
    <AdminLayout title="AI Models" subtitle="Manage AI model configurations and availability">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Model
          </Button>
        </div>

      <div className="grid gap-6">
        {/* Claude Models */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-sentinel-green" />
                <CardTitle>Claude 3 Sonnet</CardTitle>
                <Badge variant="secondary">Anthropic</Badge>
              </div>
              <Switch defaultChecked />
            </div>
            <CardDescription>
              Advanced reasoning and analysis capabilities with enhanced safety
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium text-slate-900">Provider</p>
                <p className="text-slate-600">Anthropic</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Model ID</p>
                <p className="text-slate-600">claude-3-sonnet</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Max Tokens</p>
                <p className="text-slate-600">4,096</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Cost/1K tokens</p>
                <p className="text-slate-600">$0.003</p>
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
              <Button variant="outline" size="sm">
                Test Connection
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* GPT Models */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-blue-600" />
                <CardTitle>GPT-4o</CardTitle>
                <Badge variant="secondary">OpenAI</Badge>
              </div>
              <Switch />
            </div>
            <CardDescription>
              Latest multimodal model with vision and advanced reasoning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium text-slate-900">Provider</p>
                <p className="text-slate-600">OpenAI</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Model ID</p>
                <p className="text-slate-600">gpt-4o</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Max Tokens</p>
                <p className="text-slate-600">4,096</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Cost/1K tokens</p>
                <p className="text-slate-600">$0.005</p>
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
              <Button variant="outline" size="sm">
                Test Connection
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Model Performance Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Model Performance</CardTitle>
            <CardDescription>Usage statistics and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">1,247</p>
                <p className="text-sm text-slate-600">Total Requests Today</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">1.2s</p>
                <p className="text-sm text-slate-600">Avg Response Time</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">99.9%</p>
                <p className="text-sm text-slate-600">Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </AdminLayout>
  );
}