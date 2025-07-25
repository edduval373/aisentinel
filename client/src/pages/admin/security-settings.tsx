import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card-standard";
import { Button } from "@/components/ui/button-standard";
import { Badge } from "@/components/ui/badge-standard";
import { Input } from "@/components/ui/input-standard";
import { Label } from "@/components/ui/label-standard";
import { Switch } from "@/components/ui/switch-standard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-standard";
import { Separator } from "@/components/ui/separator-standard";
import { Shield, Lock, AlertTriangle, Eye, FileText, Users } from "lucide-react";

export default function AdminSecuritySettings() {
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
      <AdminLayout title="Security Settings" subtitle="Configure system security and monitoring">
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout title="Security Settings" subtitle="Configure system security and monitoring">
      <div className="p-6 space-y-6">
        {/* Content Filtering */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Content Filtering
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="pii-detection">PII Detection Level</Label>
                <Select defaultValue="strict">
                  <SelectTrigger className="mt-1">
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
                <Label htmlFor="content-sensitivity">Content Sensitivity</Label>
                <Select defaultValue="high">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable-pii-filter">Enable PII filtering</Label>
                  <p className="text-sm text-slate-600">Automatically detect and block personally identifiable information</p>
                </div>
                <Switch id="enable-pii-filter" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable-financial-filter">Enable financial data filtering</Label>
                  <p className="text-sm text-slate-600">Block credit card numbers, bank accounts, and financial information</p>
                </div>
                <Switch id="enable-financial-filter" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable-code-filter">Enable code filtering</Label>
                  <p className="text-sm text-slate-600">Prevent sharing of sensitive code patterns and credentials</p>
                </div>
                <Switch id="enable-code-filter" defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="w-5 h-5 mr-2" />
              Access Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="session-timeout">Session timeout (minutes)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  value="60"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="max-sessions">Max concurrent sessions per user</Label>
                <Input
                  id="max-sessions"
                  type="number"
                  value="3"
                  className="mt-1"
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="require-mfa">Require multi-factor authentication</Label>
                  <p className="text-sm text-slate-600">Enforce MFA for all admin users</p>
                </div>
                <Switch id="require-mfa" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ip-whitelist">Enable IP whitelist</Label>
                  <p className="text-sm text-slate-600">Restrict access to approved IP addresses</p>
                </div>
                <Switch id="ip-whitelist" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="geo-blocking">Enable geo-blocking</Label>
                  <p className="text-sm text-slate-600">Block access from specific countries or regions</p>
                </div>
                <Switch id="geo-blocking" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monitoring & Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Monitoring & Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="failed-attempts">Failed login attempts threshold</Label>
                <Input
                  id="failed-attempts"
                  type="number"
                  value="5"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lockout-duration">Account lockout duration (minutes)</Label>
                <Input
                  id="lockout-duration"
                  type="number"
                  value="30"
                  className="mt-1"
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="real-time-monitoring">Real-time monitoring</Label>
                  <p className="text-sm text-slate-600">Monitor all user activities in real-time</p>
                </div>
                <Switch id="real-time-monitoring" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="security-alerts">Security alerts</Label>
                  <p className="text-sm text-slate-600">Send notifications for security events</p>
                </div>
                <Switch id="security-alerts" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="audit-logging">Audit logging</Label>
                  <p className="text-sm text-slate-600">Log all admin actions and changes</p>
                </div>
                <Switch id="audit-logging" defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Protection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Data Protection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="data-retention">Data retention period (days)</Label>
                <Input
                  id="data-retention"
                  type="number"
                  value="90"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="backup-frequency">Backup frequency</Label>
                <Select defaultValue="daily">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="encryption-at-rest">Encryption at rest</Label>
                  <p className="text-sm text-slate-600">Encrypt stored data and backups</p>
                </div>
                <Switch id="encryption-at-rest" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="encryption-in-transit">Encryption in transit</Label>
                  <p className="text-sm text-slate-600">Encrypt data transmission</p>
                </div>
                <Switch id="encryption-in-transit" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="gdpr-compliance">GDPR compliance mode</Label>
                  <p className="text-sm text-slate-600">Enable GDPR-compliant data handling</p>
                </div>
                <Switch id="gdpr-compliance" defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Security Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Security Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <Badge variant="default" className="mb-2">Active</Badge>
                <div className="text-sm text-slate-600">Content Filtering</div>
              </div>
              <div className="text-center">
                <Badge variant="default" className="mb-2">Enabled</Badge>
                <div className="text-sm text-slate-600">Real-time Monitoring</div>
              </div>
              <div className="text-center">
                <Badge variant="secondary" className="mb-2">Configured</Badge>
                <div className="text-sm text-slate-600">Alert System</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings */}
        <div className="flex justify-end space-x-2">
          <Button variant="outline">Reset to Defaults</Button>
          <Button>Save Security Settings</Button>
        </div>
      </div>
    </AdminLayout>
  );
}