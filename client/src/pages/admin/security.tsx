import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { hasAccessLevel, canViewAdminPage, ACCESS_REQUIREMENTS } from "@/utils/roleBasedAccess";
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminSecurity() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Check if user has admin level access (2 or above)
  const hasAdminAccess = canViewAdminPage(user?.roleLevel, ACCESS_REQUIREMENTS.SECURITY_REPORTS);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !hasAdminAccess)) {
      toast({
        title: "Access Denied",
        description: "Admin access required (level 2+)",
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
      <AdminLayout title="Security Reports" subtitle="Monitor security events and threats">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '256px',
          gap: '16px'
        }}>
          <img 
            src="/ai-sentinel-logo.png" 
            alt="AI Sentinel" 
            style={{ 
              width: '64px', 
              height: '64px',
              animation: 'spin 2s linear infinite',
              filter: 'brightness(1.1) saturate(1.3) contrast(1.2)'
            }} 
          />
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading security reports...</p>
        </div>
      </AdminLayout>
    );
  }

  // Return access denied if not authenticated or lacks access
  if (!isAuthenticated || !hasAdminAccess) {
    return (
      <AdminLayout title="Security Reports" subtitle="Monitor security events and threats">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '256px',
          gap: '16px'
        }}>
          <Shield style={{ width: '48px', height: '48px', color: '#ef4444' }} />
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>
              Access Denied
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              Admin access required (level 2+)
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const securityAlerts = [
    {
      id: 1,
      type: "high",
      title: "Multiple Failed Authentication Attempts",
      description: "User john.doe@duvalsolutions.net has 5 failed login attempts in the last hour",
      timestamp: "2025-01-25 13:15:00",
      status: "active"
    },
    {
      id: 2,
      type: "medium",
      title: "PII Detection Spike",
      description: "15% increase in PII detection events compared to yesterday",
      timestamp: "2025-01-25 13:10:00",
      status: "acknowledged"
    },
    {
      id: 3,
      type: "low",
      title: "API Rate Limit Reached",
      description: "OpenAI API rate limit reached for user sarah.j@duvalsolutions.net",
      timestamp: "2025-01-25 13:05:00",
      status: "resolved"
    }
  ];

  const getAlertBackground = (type: string) => {
    switch (type) {
      case "high": return { backgroundColor: '#fef2f2', borderColor: '#fecaca' };
      case "medium": return { backgroundColor: '#fffbeb', borderColor: '#fed7aa' };
      case "low": return { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' };
      default: return { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <AlertTriangle size={16} style={{ color: '#ef4444' }} />;
      case "acknowledged": return <RefreshCw size={16} style={{ color: '#f59e0b' }} />;
      case "resolved": return <CheckCircle size={16} style={{ color: '#10b981' }} />;
      default: return <XCircle size={16} style={{ color: '#6b7280' }} />;
    }
  };

  return (
    <AdminLayout title="Security Reports" subtitle="Monitor security events and threats">
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Security Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Shield size={20} style={{ color: '#10b981' }} />
              <div>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', margin: 0 }}>98.7%</p>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>Security Score</p>
              </div>
            </div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle size={20} style={{ color: '#ef4444' }} />
              <div>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', margin: 0 }}>3</p>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>Active Threats</p>
              </div>
            </div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <XCircle size={20} style={{ color: '#ef4444' }} />
              <div>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', margin: 0 }}>47</p>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>Blocked Attempts</p>
              </div>
            </div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={20} style={{ color: '#10b981' }} />
              <div>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', margin: 0 }}>24h</p>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>Last Incident</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Alerts */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            padding: '20px', 
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <Shield size={20} style={{ color: '#ef4444' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>Security Alerts</h3>
              </div>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Recent security events requiring attention</p>
            </div>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s, border-color 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#9ca3af';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
          
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {securityAlerts.map((alert) => {
                const alertStyle = getAlertBackground(alert.type);
                return (
                  <div key={alert.id} style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: `1px solid ${alertStyle.borderColor}`,
                    backgroundColor: alertStyle.backgroundColor,
                    transition: 'box-shadow 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px 0 rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: '1' }}>
                        {getStatusIcon(alert.status)}
                        <div style={{ flex: '1' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '500', color: '#1f2937', margin: 0 }}>{alert.title}</h4>
                          <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>{alert.description}</p>
                          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '8px 0 0 0' }}>{alert.timestamp}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '500',
                          textTransform: 'capitalize',
                          border: `1px solid ${alert.type === 'high' ? '#f87171' : alert.type === 'medium' ? '#fbbf24' : '#60a5fa'}`,
                          color: alert.type === 'high' ? '#dc2626' : alert.type === 'medium' ? '#d97706' : '#2563eb',
                          backgroundColor: 'rgba(255, 255, 255, 0.8)'
                        }}>
                          {alert.type}
                        </div>
                        <div style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '500',
                          textTransform: 'capitalize',
                          backgroundColor: alert.status === 'active' ? '#fecaca' : 
                                         alert.status === 'acknowledged' ? '#fde68a' : '#bbf7d0',
                          color: alert.status === 'active' ? '#dc2626' :
                                 alert.status === 'acknowledged' ? '#d97706' : '#166534'
                        }}>
                          {alert.status}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                      <button style={{
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                        Investigate
                      </button>
                      <button style={{
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                        Acknowledge
                      </button>
                      <button style={{
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                        Resolve
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Threat Detection */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <AlertTriangle size={20} style={{ color: '#3b82f6' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>Threat Detection</h3>
              </div>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Real-time security monitoring</p>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>PII Detection</span>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: '#dcfce7',
                    color: '#166534'
                  }}>
                    Active
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Malware Scanner</span>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: '#dcfce7',
                    color: '#166534'
                  }}>
                    Active
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Anomaly Detection</span>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: '#fef3c7',
                    color: '#d97706'
                  }}>
                    Warning
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Rate Limiting</span>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: '#dcfce7',
                    color: '#166534'
                  }}>
                    Active
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <XCircle size={20} style={{ color: '#ef4444' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>Recent Blocks</h3>
              </div>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Last 24 hours</p>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#374151' }}>PII Detection</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>23 blocks</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#374151' }}>Sensitive Keywords</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>12 blocks</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#374151' }}>Malicious URLs</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>8 blocks</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#374151' }}>Code Injection</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>4 blocks</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}