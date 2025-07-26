import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import DemoBanner from "@/components/DemoBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card-standard";
import { Button } from "@/components/ui/button-standard";
import { Badge } from "@/components/ui/badge-standard";
import { Input } from "@/components/ui/input-standard";
import { Label } from "@/components/ui/label-standard";
import { Switch } from "@/components/ui/switch-standard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-standard";
import { Separator } from "@/components/ui/separator-standard";
import { Shield, Lock, AlertTriangle, Eye, FileText, Users } from "lucide-react";
import { isDemoModeActive, getDemoModeMessage } from "@/utils/demoMode";

export default function AdminSecuritySettings() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [securitySettings, setSecuritySettings] = useState({
    filterLevel: 'strict',
    contentSensitivity: 'high',
    piiFilter: true,
    financialFilter: true,
    codeFilter: true,
    sessionTimeout: 60,
    maxSessions: 3,
    require2FA: false,
    ipWhitelist: false,
    deviceTracking: false,
    alertThreshold: 'medium',
    emailAlerts: true,
    slackAlerts: true,
    smsAlerts: false
  });
  
  // Check if user has administrator level access (98 or above) or is demo user
  const hasAdminAccess = user && ((user.roleLevel ?? 0) >= 98 || (user.roleLevel ?? 0) === 0);
  const isDemoMode = isDemoModeActive(user);
  const hasReadOnlyAccess = isDemoMode;

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

  const handleSettingChange = (key: string, value: any) => {
    if (hasReadOnlyAccess) return;
    setSecuritySettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    if (hasReadOnlyAccess) return;
    
    try {
      // In a real implementation, this would call an API
      toast({
        title: "Settings Saved",
        description: "Security settings have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save security settings",
        variant: "destructive",
      });
    }
  };

  const handleGenerateReport = async () => {
    if (hasReadOnlyAccess) return;
    
    try {
      // In a real implementation, this would generate and download a report
      toast({
        title: "Report Generated",
        description: "Security report has been generated and will be downloaded shortly",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate security report",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Security Settings" subtitle="Configure system security and monitoring">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '256px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            animation: 'spin 2s linear infinite'
          }}>
            <img 
              src="/ai-sentinel-logo.png" 
              alt="Loading..." 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                filter: 'brightness(1.2) saturate(1.4) contrast(1.1)'
              }} 
            />
          </div>
          <p style={{ fontSize: '16px', color: '#64748b' }}>
            Loading security settings...
          </p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Security Settings" 
      subtitle="Configure system security and monitoring"
      rightContent={isDemoMode && <DemoBanner message={getDemoModeMessage()} />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div style={{
            backgroundColor: '#1e3a8a',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <Eye size={16} />
            {getDemoModeMessage()} - Security settings are view-only
          </div>
        )}
        {/* Content Filtering */}
        <Card>
          <CardHeader>
            <CardTitle style={{ display: 'flex', alignItems: 'center' }}>
              <Shield style={{ width: '20px', height: '20px', marginRight: '8px' }} />
              Content Filtering
            </CardTitle>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              <div>
                <Label htmlFor="filter-level">Filter Level</Label>
                <Select 
                  value={securitySettings.filterLevel} 
                  onValueChange={(value) => handleSettingChange('filterLevel', value)}
                  disabled={hasReadOnlyAccess}
                >
                  <SelectTrigger style={{ 
                    marginTop: '4px',
                    opacity: hasReadOnlyAccess ? 0.6 : 1,
                    cursor: hasReadOnlyAccess ? 'not-allowed' : 'pointer'
                  }}>
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
                <Select 
                  value={securitySettings.contentSensitivity} 
                  onValueChange={(value) => handleSettingChange('contentSensitivity', value)}
                  disabled={hasReadOnlyAccess}
                >
                  <SelectTrigger style={{ 
                    marginTop: '4px',
                    opacity: hasReadOnlyAccess ? 0.6 : 1,
                    cursor: hasReadOnlyAccess ? 'not-allowed' : 'pointer'
                  }}>
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Label htmlFor="enable-pii-filter">Enable PII filtering</Label>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                    Automatically detect and block personally identifiable information
                  </p>
                </div>
                <Switch 
                  id="enable-pii-filter" 
                  checked={securitySettings.piiFilter}
                  onCheckedChange={(checked) => handleSettingChange('piiFilter', checked)}
                  disabled={hasReadOnlyAccess}
                  style={{ opacity: hasReadOnlyAccess ? 0.6 : 1 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Label htmlFor="enable-financial-filter">Enable financial data filtering</Label>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                    Block credit card numbers, bank accounts, and financial information
                  </p>
                </div>
                <Switch 
                  id="enable-financial-filter" 
                  checked={securitySettings.financialFilter}
                  onCheckedChange={(checked) => handleSettingChange('financialFilter', checked)}
                  disabled={hasReadOnlyAccess}
                  style={{ opacity: hasReadOnlyAccess ? 0.6 : 1 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Label htmlFor="enable-code-filter">Enable code filtering</Label>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                    Prevent sharing of sensitive code patterns and credentials
                  </p>
                </div>
                <Switch 
                  id="enable-code-filter" 
                  checked={securitySettings.codeFilter}
                  onCheckedChange={(checked) => handleSettingChange('codeFilter', checked)}
                  disabled={hasReadOnlyAccess}
                  style={{ opacity: hasReadOnlyAccess ? 0.6 : 1 }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access Control */}
        <Card>
          <CardHeader>
            <CardTitle style={{ display: 'flex', alignItems: 'center' }}>
              <Lock style={{ width: '20px', height: '20px', marginRight: '8px' }} />
              Access Control
            </CardTitle>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              <div>
                <Label htmlFor="session-timeout">Session timeout (minutes)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                  disabled={hasReadOnlyAccess}
                  style={{ 
                    marginTop: '4px',
                    opacity: hasReadOnlyAccess ? 0.6 : 1,
                    cursor: hasReadOnlyAccess ? 'not-allowed' : 'text'
                  }}
                />
              </div>
              <div>
                <Label htmlFor="max-sessions">Max concurrent sessions per user</Label>
                <Input
                  id="max-sessions"
                  type="number"
                  value={securitySettings.maxSessions}
                  onChange={(e) => handleSettingChange('maxSessions', parseInt(e.target.value))}
                  disabled={hasReadOnlyAccess}
                  style={{ 
                    marginTop: '4px',
                    opacity: hasReadOnlyAccess ? 0.6 : 1,
                    cursor: hasReadOnlyAccess ? 'not-allowed' : 'text'
                  }}
                />
              </div>
            </div>
            
            <Separator />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Label htmlFor="require-2fa">Require two-factor authentication</Label>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                    Enforce 2FA for all user accounts
                  </p>
                </div>
                <Switch 
                  id="require-2fa" 
                  checked={securitySettings.require2FA}
                  onCheckedChange={(checked) => handleSettingChange('require2FA', checked)}
                  disabled={hasReadOnlyAccess}
                  style={{ opacity: hasReadOnlyAccess ? 0.6 : 1 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Label htmlFor="ip-whitelist">Enable IP address whitelist</Label>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                    Restrict access to specific IP addresses
                  </p>
                </div>
                <Switch 
                  id="ip-whitelist" 
                  checked={securitySettings.ipWhitelist}
                  onCheckedChange={(checked) => handleSettingChange('ipWhitelist', checked)}
                  disabled={hasReadOnlyAccess}
                  style={{ opacity: hasReadOnlyAccess ? 0.6 : 1 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Label htmlFor="device-tracking">Enable device tracking</Label>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                    Track and manage user devices
                  </p>
                </div>
                <Switch 
                  id="device-tracking" 
                  checked={securitySettings.deviceTracking}
                  onCheckedChange={(checked) => handleSettingChange('deviceTracking', checked)}
                  disabled={hasReadOnlyAccess}
                  style={{ opacity: hasReadOnlyAccess ? 0.6 : 1 }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monitoring & Alerts */} 
        <Card>
          <CardHeader>
            <CardTitle style={{ display: 'flex', alignItems: 'center' }}>
              <Eye style={{ width: '20px', height: '20px', marginRight: '8px' }} />
              Monitoring & Alerts
            </CardTitle>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#fef3c7', 
                border: '1px solid #f59e0b', 
                borderRadius: '8px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <AlertTriangle style={{ width: '16px', height: '16px', color: '#d97706', marginRight: '8px' }} />
                  <h4 style={{ fontWeight: '500', color: '#92400e', margin: 0 }}>High-Risk Activities</h4>
                </div>
                <p style={{ fontSize: '14px', color: '#a16207', margin: '0 0 8px 0' }}>
                  Activities that require immediate attention
                </p>
                <Badge variant="outline" style={{ backgroundColor: '#fef3c7', color: '#a16207' }}>
                  3 alerts this week
                </Badge>
              </div>
              
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#fee2e2', 
                border: '1px solid #ef4444', 
                borderRadius: '8px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <Shield style={{ width: '16px', height: '16px', color: '#dc2626', marginRight: '8px' }} />
                  <h4 style={{ fontWeight: '500', color: '#991b1b', margin: 0 }}>Security Violations</h4>
                </div>
                <p style={{ fontSize: '14px', color: '#b91c1c', margin: '0 0 8px 0' }}>
                  Content policy violations detected
                </p>
                <Badge variant="outline" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                  1 violation today
                </Badge>
              </div>
            </div>
            
            <div>
              <Label htmlFor="alert-threshold">Alert threshold</Label>
              <Select 
                value={securitySettings.alertThreshold} 
                onValueChange={(value) => handleSettingChange('alertThreshold', value)}
                disabled={hasReadOnlyAccess}
              >
                <SelectTrigger style={{ 
                  marginTop: '4px',
                  opacity: hasReadOnlyAccess ? 0.6 : 1,
                  cursor: hasReadOnlyAccess ? 'not-allowed' : 'pointer'
                }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High - Only critical alerts</SelectItem>
                  <SelectItem value="medium">Medium - Important alerts</SelectItem>
                  <SelectItem value="low">Low - All alerts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Label htmlFor="email-alerts">Email notifications</Label>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                    Send security alerts via email
                  </p>
                </div>
                <Switch 
                  id="email-alerts" 
                  checked={securitySettings.emailAlerts}
                  onCheckedChange={(checked) => handleSettingChange('emailAlerts', checked)}
                  disabled={hasReadOnlyAccess}
                  style={{ opacity: hasReadOnlyAccess ? 0.6 : 1 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Label htmlFor="slack-alerts">Slack notifications</Label>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                    Send alerts to Slack channels
                  </p>
                </div>
                <Switch 
                  id="slack-alerts" 
                  checked={securitySettings.slackAlerts}
                  onCheckedChange={(checked) => handleSettingChange('slackAlerts', checked)}
                  disabled={hasReadOnlyAccess}
                  style={{ opacity: hasReadOnlyAccess ? 0.6 : 1 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Label htmlFor="sms-alerts">SMS notifications</Label>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                    Send critical alerts via SMS
                  </p>
                </div>
                <Switch 
                  id="sms-alerts" 
                  checked={securitySettings.smsAlerts}
                  onCheckedChange={(checked) => handleSettingChange('smsAlerts', checked)}
                  disabled={hasReadOnlyAccess}
                  style={{ opacity: hasReadOnlyAccess ? 0.6 : 1 }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance & Reporting */}
        <Card>
          <CardHeader>
            <CardTitle style={{ display: 'flex', alignItems: 'center' }}>
              <FileText style={{ width: '20px', height: '20px', marginRight: '8px' }} />
              Compliance & Reporting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Badge style={{ backgroundColor: '#dcfce7', color: '#166534' }}>SOC 2 Compliant</Badge>
                <Badge style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>GDPR Ready</Badge>
                <Badge variant="secondary">HIPAA Compatible</Badge>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Button 
                  onClick={handleGenerateReport}
                  disabled={hasReadOnlyAccess}
                  style={{ 
                    flex: '1', 
                    minWidth: '200px',
                    opacity: hasReadOnlyAccess ? 0.6 : 1,
                    cursor: hasReadOnlyAccess ? 'not-allowed' : 'pointer'
                  }}
                >
                  Generate Security Report
                </Button>
                <Button 
                  variant="outline" 
                  disabled={hasReadOnlyAccess}
                  style={{ 
                    flex: '1', 
                    minWidth: '200px',
                    opacity: hasReadOnlyAccess ? 0.6 : 1,
                    cursor: hasReadOnlyAccess ? 'not-allowed' : 'pointer'
                  }}
                >
                  Export Audit Logs
                </Button>
                <Button 
                  variant="outline" 
                  disabled={hasReadOnlyAccess}
                  style={{ 
                    flex: '1', 
                    minWidth: '200px',
                    opacity: hasReadOnlyAccess ? 0.6 : 1,
                    cursor: hasReadOnlyAccess ? 'not-allowed' : 'pointer'
                  }}
                >
                  Download Compliance Certificate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px' }}>
          <Button 
            onClick={handleSaveSettings}
            disabled={hasReadOnlyAccess}
            style={{ 
              minWidth: '150px',
              opacity: hasReadOnlyAccess ? 0.6 : 1,
              cursor: hasReadOnlyAccess ? 'not-allowed' : 'pointer'
            }}
          >
            Save Security Settings
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}