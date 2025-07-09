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
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Settings, Zap, Shield, AlertCircle, Thermometer } from "lucide-react";

export default function AdminModelSettings() {
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
      <AdminLayout title="Model Settings" subtitle="Configure AI model parameters and behavior">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sentinel-blue"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout title="Model Settings" subtitle="Configure AI model parameters and behavior">
      <div className="p-6 space-y-6">
        {/* OpenAI GPT-4 Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bot className="w-5 h-5 mr-2" />
              OpenAI GPT-4 Configuration
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="default">Active</Badge>
              <span className="text-sm text-slate-600">Currently enabled for all users</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="gpt4-temperature">Temperature</Label>
                <div className="mt-2 space-y-2">
                  <Slider
                    id="gpt4-temperature"
                    defaultValue={[0.7]}
                    max={2}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Conservative (0.0)</span>
                    <span>Balanced (0.7)</span>
                    <span>Creative (2.0)</span>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="gpt4-max-tokens">Max Tokens</Label>
                <Input
                  id="gpt4-max-tokens"
                  type="number"
                  defaultValue="2048"
                  className="mt-2"
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="gpt4-top-p">Top P (Nucleus Sampling)</Label>
                <div className="mt-2 space-y-2">
                  <Slider
                    id="gpt4-top-p"
                    defaultValue={[1]}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Focused (0.0)</span>
                    <span>Balanced (1.0)</span>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="gpt4-frequency-penalty">Frequency Penalty</Label>
                <div className="mt-2 space-y-2">
                  <Slider
                    id="gpt4-frequency-penalty"
                    defaultValue={[0]}
                    max={2}
                    min={-2}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Repetitive (-2.0)</span>
                    <span>Varied (2.0)</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="gpt4-stream">Enable streaming responses</Label>
                  <p className="text-sm text-slate-600">Stream responses for better user experience</p>
                </div>
                <Switch id="gpt4-stream" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="gpt4-function-calling">Enable function calling</Label>
                  <p className="text-sm text-slate-600">Allow model to call predefined functions</p>
                </div>
                <Switch id="gpt4-function-calling" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Claude 3 Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bot className="w-5 h-5 mr-2" />
              Anthropic Claude 3 Configuration
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="default">Active</Badge>
              <span className="text-sm text-slate-600">Currently enabled for all users</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="claude3-temperature">Temperature</Label>
                <div className="mt-2 space-y-2">
                  <Slider
                    id="claude3-temperature"
                    defaultValue={[1]}
                    max={2}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Conservative (0.0)</span>
                    <span>Balanced (1.0)</span>
                    <span>Creative (2.0)</span>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="claude3-max-tokens">Max Tokens</Label>
                <Input
                  id="claude3-max-tokens"
                  type="number"
                  defaultValue="4096"
                  className="mt-2"
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="claude3-top-p">Top P</Label>
                <div className="mt-2 space-y-2">
                  <Slider
                    id="claude3-top-p"
                    defaultValue={[1]}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="claude3-top-k">Top K</Label>
                <Input
                  id="claude3-top-k"
                  type="number"
                  defaultValue="40"
                  className="mt-2"
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="claude3-stream">Enable streaming responses</Label>
                  <p className="text-sm text-slate-600">Stream responses for better user experience</p>
                </div>
                <Switch id="claude3-stream" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="claude3-vision">Enable vision capabilities</Label>
                  <p className="text-sm text-slate-600">Allow image analysis and processing</p>
                </div>
                <Switch id="claude3-vision" defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Global Model Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Global Model Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="default-model">Default Model</Label>
                <Select defaultValue="claude-3">
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="claude-3">Claude 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fallback-model">Fallback Model</Label>
                <Select defaultValue="gpt-4">
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="claude-3">Claude 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="timeout">Response Timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  defaultValue="60"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="retry-attempts">Retry Attempts</Label>
                <Input
                  id="retry-attempts"
                  type="number"
                  defaultValue="3"
                  className="mt-2"
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-fallback">Auto-fallback on errors</Label>
                  <p className="text-sm text-slate-600">Automatically switch to fallback model on errors</p>
                </div>
                <Switch id="auto-fallback" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="load-balancing">Enable load balancing</Label>
                  <p className="text-sm text-slate-600">Distribute requests across available models</p>
                </div>
                <Switch id="load-balancing" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Safety & Content Filtering */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Safety & Content Filtering
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="content-filter-level">Content Filter Level</Label>
                <Select defaultValue="moderate">
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strict">Strict</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="lenient">Lenient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="safety-threshold">Safety Threshold</Label>
                <div className="mt-2 space-y-2">
                  <Slider
                    id="safety-threshold"
                    defaultValue={[0.8]}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Permissive (0.0)</span>
                    <span>Strict (1.0)</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="jailbreak-detection">Enable jailbreak detection</Label>
                  <p className="text-sm text-slate-600">Detect and block prompt injection attempts</p>
                </div>
                <Switch id="jailbreak-detection" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="harmful-content">Block harmful content</Label>
                  <p className="text-sm text-slate-600">Prevent generation of harmful or dangerous content</p>
                </div>
                <Switch id="harmful-content" defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Performance Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="cache-duration">Response Cache Duration (minutes)</Label>
                <Input
                  id="cache-duration"
                  type="number"
                  defaultValue="30"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="batch-size">Batch Processing Size</Label>
                <Input
                  id="batch-size"
                  type="number"
                  defaultValue="10"
                  className="mt-2"
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable-cache">Enable response caching</Label>
                  <p className="text-sm text-slate-600">Cache similar responses to improve performance</p>
                </div>
                <Switch id="enable-cache" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable-compression">Enable response compression</Label>
                  <p className="text-sm text-slate-600">Compress responses to reduce bandwidth</p>
                </div>
                <Switch id="enable-compression" defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings */}
        <div className="flex justify-end space-x-2">
          <Button variant="outline">Reset to Defaults</Button>
          <Button>Save Model Settings</Button>
        </div>
      </div>
    </AdminLayout>
  );
}