import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useToast } from "@/hooks/use-toast";
import { useDemoDialog } from "@/hooks/useDemoDialog";
import { hasAccessLevel, canViewAdminPage, ACCESS_REQUIREMENTS } from "@/utils/roleBasedAccess";
import { isDemoModeActive, isReadOnlyMode } from "@/utils/demoMode";
import { BarChart3, Download, Filter, Search, AlertTriangle, Shield, User, Eye } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import DemoBanner from "@/components/DemoBanner";

export default function AdminLogs() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  // Demo mode functionality
  const isDemoMode = isDemoModeActive(user);
  const isReadOnly = isReadOnlyMode(user);
  const { showDialog, closeDialog, DialogComponent } = useDemoDialog();
  
  // Check access level - allow demo users (0) read-only access and administrators (2+) full access
  const hasReadOnlyAccess = user && (user.roleLevel === 0); // Demo users
  const hasFullAccess = user && user.roleLevel !== undefined && hasAccessLevel(user.roleLevel, ACCESS_REQUIREMENTS.ACTIVITY_LOGS);
  const hasAdminAccess = hasReadOnlyAccess || hasFullAccess;

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (!hasReadOnlyAccess && !hasFullAccess))) {
      toast({
        title: "Access Denied",
        description: `Activity Logs requires Admin level (2+) access. Your current level: ${user?.roleLevel || 0}`,
        variant: "destructive",
      });
      window.location.href = "/";
      return;
    }
  }, [isAuthenticated, isLoading, user, toast, hasReadOnlyAccess, hasFullAccess]);

  if (isLoading) {
    return (
      <AdminLayout title="Activity Logs" subtitle="Monitor system activity and security events">
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
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading activity logs...</p>
        </div>
      </AdminLayout>
    );
  }
  
  // Return access denied if not authenticated or lacks access
  if (!isAuthenticated || !hasAdminAccess) {
    return (
      <AdminLayout title="Activity Logs" subtitle="Monitor system activity and security events">
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
              Admin access required (level 2+)
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const activityLogs = [
    {
      id: 1,
      timestamp: "2025-01-09 13:15:32",
      user: "ed.duval15@gmail.com",
      action: "Message Sent",
      details: "AI chat interaction with Claude 3",
      status: "approved",
      type: "chat"
    },
    {
      id: 2,
      timestamp: "2025-01-09 13:12:45",
      user: "sarah.j@company.com",
      action: "Security Block",
      details: "PII detected in message content",
      status: "blocked",
      type: "security"
    },
    {
      id: 3,
      timestamp: "2025-01-09 13:10:18",
      user: "mike.chen@company.com",
      action: "Login",
      details: "User authenticated successfully",
      status: "success",
      type: "auth"
    },
    {
      id: 4,
      timestamp: "2025-01-09 13:08:22",
      user: "lisa.r@company.com",
      action: "Message Sent",
      details: "Data analysis request processed",
      status: "approved",
      type: "chat"
    },
    {
      id: 5,
      timestamp: "2025-01-09 13:05:15",
      user: "john.doe@company.com",
      action: "Security Block",
      details: "Suspicious URL detected",
      status: "blocked",
      type: "security"
    }
  ];



  const getTypeIcon = (type: string) => {
    switch (type) {
      case "chat": return <BarChart3 size={16} style={{ color: '#3b82f6' }} />;
      case "security": return <Shield size={16} style={{ color: '#ef4444' }} />;
      case "auth": return <User size={16} style={{ color: '#10b981' }} />;
      default: return <AlertTriangle size={16} style={{ color: '#f59e0b' }} />;
    }
  };

  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || log.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <AdminLayout 
      title="Activity Logs" 
      subtitle={`Monitor system activity and security events for ${user?.companyName || 'Company'}`}
      rightContent={hasReadOnlyAccess ? <DemoBanner message="Demo Mode - Read Only View" /> : undefined}
    >
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        

        
        {/* Stats Cards */}
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
              <BarChart3 size={20} style={{ color: '#3b82f6' }} />
              <div>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>1,247</p>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>Total Events Today</p>
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
              <Shield size={20} style={{ color: '#ef4444' }} />
              <div>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>23</p>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>Security Blocks</p>
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
              <User size={20} style={{ color: '#10b981' }} />
              <div>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>89</p>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>Active Users</p>
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
              <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
              <div>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>7</p>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>Warnings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Logs */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <BarChart3 size={20} style={{ color: '#3b82f6' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>Activity Logs</h3>
            </div>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Search and filter system activity</p>
          </div>
          
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ position: 'relative', flex: '1' }}>
                  <Search size={16} style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '12px', 
                    color: '#9ca3af' 
                  }} />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 40px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    style={{
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      outline: 'none',
                      cursor: 'pointer',
                      minWidth: '200px',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <option value="all">All Types</option>
                    <option value="chat">Chat</option>
                    <option value="security">Security</option>
                    <option value="auth">Authentication</option>
                  </select>
                  
                  <button
                    onClick={() => {
                      if (isDemoMode) {
                        showDialog({
                          title: 'Activity Log Export',
                          description: `Export comprehensive activity logs and security events for ${user?.companyName || 'your company'} including user interactions, security alerts, and system events.`,
                          features: [
                            'Complete audit trail of all user activities and AI interactions',
                            'Security events, alerts, and threat detection records',
                            'System access logs with timestamps and user identification',
                            'Compliance reporting data for regulatory requirements',
                            'Multiple export formats (CSV, JSON, PDF) with custom filtering'
                          ]
                        });
                      }
                    }}
                    title={hasReadOnlyAccess ? "Demo mode - export disabled" : "Export logs"}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: hasReadOnlyAccess ? '#f9fafb' : 'white',
                      color: hasReadOnlyAccess ? '#9ca3af' : '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      padding: '12px 20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: hasReadOnlyAccess ? 'not-allowed' : 'pointer',
                      opacity: hasReadOnlyAccess ? 0.6 : 1,
                      transition: 'background-color 0.2s, border-color 0.2s'
                    }}
                    onMouseOver={(e) => {
                      if (!hasReadOnlyAccess) {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                        e.currentTarget.style.borderColor = '#9ca3af';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!hasReadOnlyAccess) {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }
                    }}
                  >
                    <Download size={16} />
                    Export
                  </button>
                </div>
              </div>

              {/* Logs List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredLogs.map((log) => (
                  <div key={log.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa',
                    transition: 'background-color 0.2s, border-color 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#fafafa';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '50%'
                      }}>
                        {getTypeIcon(log.type)}
                      </div>
                      <div>
                        <p style={{ fontSize: '15px', fontWeight: '500', color: '#1f2937', margin: 0 }}>{log.action}</p>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: '2px 0 0 0' }}>{log.details}</p>
                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>{log.user} • {log.timestamp}</p>
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500',
                      textTransform: 'capitalize',
                      backgroundColor: log.status === 'approved' ? '#dcfce7' : 
                                     log.status === 'blocked' ? '#fecaca' :
                                     log.status === 'success' ? '#dbeafe' : '#fef3c7',
                      color: log.status === 'approved' ? '#166534' :
                             log.status === 'blocked' ? '#dc2626' :
                             log.status === 'success' ? '#1d4ed8' : '#d97706'
                    }}>
                      {log.status}
                    </div>
                  </div>
                ))}
              </div>

              {filteredLogs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px' }}>
                  <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>No logs found matching your search criteria.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <DialogComponent />
    </AdminLayout>
  );
}