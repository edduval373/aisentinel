import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card-standard";
import { Badge } from "@/components/ui/badge-standard";
import { hasAccessLevel, canViewAdminPage, ACCESS_REQUIREMENTS } from "@/utils/roleBasedAccess";
import { isDemoModeActive, isReadOnlyMode, getDemoModeMessage } from "@/utils/demoMode";
import { BarChart3, TrendingUp, Users, MessageSquare, Clock, Shield, Eye } from "lucide-react";

export default function AdminAnalytics() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Check if user has administrator level access (98 or above) OR is in demo mode
  const hasAdminAccess = canViewAdminPage(user?.roleLevel, ACCESS_REQUIREMENTS.MONITORING_REPORTS);
  
  // Check if we're in demo mode
  const isDemoMode = isDemoModeActive(user);
  const isReadOnly = isReadOnlyMode(user);

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

  if (isLoading) {
    return (
      <AdminLayout title="Usage Analytics" subtitle="Monitor system usage and performance metrics">
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
            Loading analytics...
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

  // Return access denied if not authenticated or lacks access
  if (!isAuthenticated || !hasAdminAccess) {
    return (
      <AdminLayout title="Usage Analytics" subtitle="Monitor system usage and performance metrics">
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
              Administrator access required (level 98+)
            </p>
          </div>
        </div>
      </AdminLayout>
    );
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Demo Mode Indicator */}
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
            {getDemoModeMessage()} - You can view all analytics data but cannot make changes
          </div>
        )}
        
        {/* Key Metrics */}
        <div style={{ 
          display: 'grid', 
          gap: '24px', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' 
        }}>
          {metrics.map((metric) => (
            <Card key={metric.title}>
              <CardHeader style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                paddingBottom: '8px'
              }}>
                <CardTitle style={{ fontSize: '14px', fontWeight: '500', color: '#64748b' }}>
                  {metric.title}
                </CardTitle>
                <metric.icon style={{ 
                  width: '16px', 
                  height: '16px', 
                  color: metric.color === 'text-blue-600' ? '#2563eb' :
                         metric.color === 'text-green-600' ? '#059669' :
                         metric.color === 'text-red-600' ? '#dc2626' :
                         metric.color === 'text-purple-600' ? '#9333ea' : '#64748b'
                }} />
              </CardHeader>
              <CardContent>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{metric.value}</div>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
                  <TrendingUp style={{ 
                    width: '12px', 
                    height: '12px', 
                    marginRight: '4px',
                    color: metric.trend === 'up' ? '#10b981' : '#ef4444'
                  }} />
                  <span style={{ 
                    color: metric.trend === 'up' ? '#059669' : '#dc2626' 
                  }}>
                    {metric.change}
                  </span>
                  <span style={{ marginLeft: '4px' }}>from last month</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div style={{ 
          display: 'grid', 
          gap: '24px', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' 
        }}>
          {/* AI Model Usage */}
          <Card>
            <CardHeader>
              <CardTitle style={{ display: 'flex', alignItems: 'center' }}>
                <BarChart3 style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                AI Model Usage
              </CardTitle>
            </CardHeader>
            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {topModels.map((model) => (
                <div key={model.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%',
                      backgroundColor: model.color === 'bg-blue-500' ? '#3b82f6' :
                                       model.color === 'bg-green-500' ? '#10b981' :
                                       model.color === 'bg-purple-500' ? '#8b5cf6' : '#64748b'
                    }} />
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>{model.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '96px', 
                      height: '8px', 
                      backgroundColor: '#e2e8f0', 
                      borderRadius: '4px' 
                    }}>
                      <div style={{ 
                        height: '8px', 
                        borderRadius: '4px',
                        width: `${model.usage}%`,
                        backgroundColor: model.color === 'bg-blue-500' ? '#3b82f6' :
                                        model.color === 'bg-green-500' ? '#10b981' :
                                        model.color === 'bg-purple-500' ? '#8b5cf6' : '#64748b'
                      }} />
                    </div>
                    <span style={{ fontSize: '14px', color: '#64748b' }}>{model.usage}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Activity Types */}
          <Card>
            <CardHeader>
              <CardTitle style={{ display: 'flex', alignItems: 'center' }}>
                <Users style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                Top Activity Types
              </CardTitle>
            </CardHeader>
            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {topActivities.map((activity) => (
                <div key={activity.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>{activity.name}</span>
                    <Badge variant="secondary" style={{ fontSize: '12px' }}>
                      {activity.count} uses
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '80px', 
                      height: '8px', 
                      backgroundColor: '#e2e8f0', 
                      borderRadius: '4px' 
                    }}>
                      <div style={{ 
                        height: '8px', 
                        borderRadius: '4px',
                        width: `${activity.percentage}%`,
                        backgroundColor: '#3b82f6'
                      }} />
                    </div>
                    <span style={{ fontSize: '14px', color: '#64748b' }}>{activity.percentage}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Usage Trends */}
        <Card>
          <CardHeader>
            <CardTitle style={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUp style={{ width: '20px', height: '20px', marginRight: '8px' }} />
              Usage Trends (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ 
              height: '256px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#64748b' 
            }}>
              <div style={{ textAlign: 'center' }}>
                <BarChart3 style={{ 
                  width: '48px', 
                  height: '48px', 
                  margin: '0 auto 8px', 
                  color: '#94a3b8' 
                }} />
                <p style={{ margin: '0 0 4px 0' }}>Analytics chart would be displayed here</p>
                <p style={{ fontSize: '14px', margin: 0 }}>Integration with charting library required</p>
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
            <div style={{ 
              display: 'grid', 
              gap: '16px', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' 
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669' }}>99.9%</div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>Uptime</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>2.1s</div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>Avg Response Time</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#9333ea' }}>94%</div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}