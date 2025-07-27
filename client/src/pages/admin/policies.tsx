import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useToast } from "@/hooks/use-toast";
import { Shield, AlertTriangle, Save, Plus, Edit, Eye, Settings } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import DemoBanner from "@/components/DemoBanner";
import { hasAccessLevel, canViewAdminPage, ACCESS_REQUIREMENTS } from "@/utils/roleBasedAccess";
import { isDemoModeActive, isReadOnlyMode } from "@/utils/demoMode";
import { useDemoDialog } from "@/hooks/useDemoDialog";
import DemoInfoDialog from "@/components/demo/DemoInfoDialog";

export default function AdminPolicies() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const [activeTab, setActiveTab] = useState("content-filters");

  // Demo mode functionality
  const isDemoMode = isDemoModeActive(user);
  const isReadOnly = isReadOnlyMode(user);
  const { showDialog, closeDialog, DialogComponent, isOpen } = useDemoDialog();

  // Check access level - allow demo users (0) read-only access and administrators (2+) full access
  const hasReadOnlyAccess = user && (user.roleLevel === 0); // Demo users
  const hasFullAccess = user && user.roleLevel !== undefined && canViewAdminPage(user, ACCESS_REQUIREMENTS.CONTENT_POLICIES); // Admin+
  
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (!hasReadOnlyAccess && !hasFullAccess))) {
      toast({
        title: "Access Denied",
        description: `Content Policies requires Admin level (2+) access. Your current level: ${user?.roleLevel || 0}`,
        variant: "destructive",
      });
      window.location.href = "/";
      return;
    }
  }, [isAuthenticated, isLoading, user, toast, hasReadOnlyAccess, hasFullAccess]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            animation: 'spin 2s linear infinite',
            margin: '0 auto 1rem',
            filter: 'brightness(1.1) saturate(1.3) contrast(1.2)'
          }}>
            <img 
              src="/ai-sentinel-logo.png" 
              alt="AI Sentinel" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <p style={{ color: '#64748b', fontSize: '16px' }}>Loading Content Policies...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Company-specific content filters 
  const [contentFilters] = useState([
    {
      id: `${currentCompanyId}-pii`,
      name: "PII Detection",
      description: "Detects and blocks personally identifiable information",
      enabled: true,
      severity: "high",
      blockedCount: 147,
      companyId: currentCompanyId
    },
    {
      id: `${currentCompanyId}-financial`,
      name: "Financial Data Protection", 
      description: "Prevents sharing of financial information and credentials",
      enabled: true,
      severity: "high",
      blockedCount: 89,
      companyId: currentCompanyId
    },
    {
      id: `${currentCompanyId}-code`,
      name: "Code Security Scanner",
      description: "Identifies potentially malicious code patterns",
      enabled: true,
      severity: "medium", 
      blockedCount: 34,
      companyId: currentCompanyId
    },
    {
      id: `${currentCompanyId}-url`,
      name: "URL Filtering",
      description: "Blocks suspicious or unauthorized URLs",
      enabled: true,
      severity: "medium",
      blockedCount: 23,
      companyId: currentCompanyId
    }
  ]);

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "high": 
        return {
          backgroundColor: '#fef2f2',
          color: '#991b1b',
          border: '1px solid #fecaca'
        };
      case "medium": 
        return {
          backgroundColor: '#fffbeb',
          color: '#92400e',
          border: '1px solid #fde68a'
        };
      case "low": 
        return {
          backgroundColor: '#f0fdf4',
          color: '#166534',
          border: '1px solid #bbf7d0'
        };
      default: 
        return {
          backgroundColor: '#f9fafb',
          color: '#374151',
          border: '1px solid #d1d5db'
        };
    }
  };

  return (
    <AdminLayout 
      title="Content Policies" 
      subtitle={`Manage security policies and content filtering rules for ${user?.companyName || 'Company'}`}
      rightContent={hasReadOnlyAccess ? <DemoBanner message="Demo Mode - Read Only View - Content policies cannot be modified" /> : undefined}
    >
      <div style={{ padding: '24px' }}>
        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '4px',
          backgroundColor: '#f1f5f9',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => setActiveTab("content-filters")}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: activeTab === "content-filters" ? '#ffffff' : 'transparent',
              color: activeTab === "content-filters" ? '#1e293b' : '#64748b',
              boxShadow: activeTab === "content-filters" ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "content-filters") {
                e.currentTarget.style.color = '#1e293b';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "content-filters") {
                e.currentTarget.style.color = '#64748b';
              }
            }}
          >
            Content Filters
          </button>
          <button
            onClick={() => setActiveTab("security-rules")}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: activeTab === "security-rules" ? '#ffffff' : 'transparent',
              color: activeTab === "security-rules" ? '#1e293b' : '#64748b',
              boxShadow: activeTab === "security-rules" ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "security-rules") {
                e.currentTarget.style.color = '#1e293b';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "security-rules") {
                e.currentTarget.style.color = '#64748b';
              }
            }}
          >
            Security Rules
          </button>
          <button
            onClick={() => setActiveTab("compliance")}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: activeTab === "compliance" ? '#ffffff' : 'transparent',
              color: activeTab === "compliance" ? '#1e293b' : '#64748b',
              boxShadow: activeTab === "compliance" ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "compliance") {
                e.currentTarget.style.color = '#1e293b';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "compliance") {
                e.currentTarget.style.color = '#64748b';
              }
            }}
          >
            Compliance
          </button>
        </div>

        {/* Content Filters Tab */}
        {activeTab === "content-filters" && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1e293b',
                margin: 0
              }}>
                Content Filtering Rules
              </h2>
              {hasFullAccess && (
                <button 
                onClick={() => isDemoMode ? showDialog({
                  title: 'Content Filter Creation',
                  description: 'Create custom content filters to automatically detect and block inappropriate content, PII, or policy violations in AI interactions.',
                  features: [
                    'Custom rule creation with regex pattern support',
                    'Severity level configuration (High, Medium, Low)',
                    'Real-time content scanning and blocking',
                    'Detailed violation reporting and analytics',
                    'Integration with compliance frameworks'
                  ]
                }) : null}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}>
                  <Plus size={16} />
                  Add Filter
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {contentFilters.map((filter) => (
                <div key={filter.id} style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  {/* Card Header */}
                  <div style={{ padding: '20px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Shield size={20} style={{ color: '#3b82f6' }} />
                        <div>
                          <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#1e293b',
                            margin: '0 0 4px 0'
                          }}>
                            {filter.name}
                          </h3>
                          <p style={{
                            fontSize: '14px',
                            color: '#64748b',
                            margin: 0
                          }}>
                            {filter.description}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          ...getSeverityStyle(filter.severity),
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {filter.severity} priority
                        </span>
                        <label style={{
                          position: 'relative',
                          display: 'inline-block',
                          width: '48px',
                          height: '24px'
                        }}>
                          <input
                            type="checkbox"
                            defaultChecked={filter.enabled}
                            disabled={!!hasReadOnlyAccess}
                            style={{ display: 'none' }}
                          />
                          <span style={{
                            position: 'absolute',
                            cursor: hasReadOnlyAccess ? 'not-allowed' : 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: filter.enabled ? '#22c55e' : '#cbd5e1',
                            borderRadius: '24px',
                            transition: 'all 0.3s ease',
                            opacity: hasReadOnlyAccess ? 0.6 : 1
                          }}>
                            <span style={{
                              position: 'absolute',
                              content: '',
                              height: '18px',
                              width: '18px',
                              left: filter.enabled ? '27px' : '3px',
                              bottom: '3px',
                              backgroundColor: 'white',
                              borderRadius: '50%',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                            }} />
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div style={{ padding: '0 20px 20px 20px' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '16px',
                      marginBottom: '16px'
                    }}>
                      <div>
                        <p style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#1e293b',
                          margin: '0 0 4px 0'
                        }}>
                          Blocked Today
                        </p>
                        <p style={{
                          fontSize: '14px',
                          color: '#64748b',
                          margin: 0
                        }}>
                          {filter.blockedCount} attempts
                        </p>
                      </div>
                      <div>
                        <p style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#1e293b',
                          margin: '0 0 4px 0'
                        }}>
                          Status
                        </p>
                        <p style={{
                          fontSize: '14px',
                          color: filter.enabled ? '#16a34a' : '#dc2626',
                          margin: 0,
                          fontWeight: '500'
                        }}>
                          {filter.enabled ? "Active" : "Disabled"}
                        </p>
                      </div>
                      <div>
                        <p style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#1e293b',
                          margin: '0 0 4px 0'
                        }}>
                          Severity
                        </p>
                        <p style={{
                          fontSize: '14px',
                          color: '#64748b',
                          margin: 0,
                          textTransform: 'capitalize'
                        }}>
                          {filter.severity}
                        </p>
                      </div>
                    </div>
                    
                    {hasFullAccess && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                        onClick={() => isDemoMode ? showDialog({
                          title: 'Content Filter Configuration',
                          description: 'Configure advanced settings for this content filter including detection patterns, severity thresholds, and response actions.',
                          features: [
                            'Customize detection patterns and keywords',
                            'Adjust sensitivity and threshold settings',
                            'Configure automated response actions',
                            'Set up violation notification preferences',
                            'Test filter effectiveness with sample content'
                          ]
                        }) : null}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          backgroundColor: 'white',
                          color: '#374151',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                          e.currentTarget.style.borderColor = '#9ca3af';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.borderColor = '#d1d5db';
                        }}>
                          <Settings size={14} />
                          Configure
                        </button>
                        <button 
                        onClick={() => isDemoMode ? showDialog({
                          title: 'Content Filter Activity Logs',
                          description: 'View detailed logs of content filter activities including blocked content, violation patterns, and filtering statistics.',
                          features: [
                            'Real-time activity logs with timestamps',
                            'Detailed violation reports and patterns',
                            'Filter performance statistics and metrics',
                            'Export logs for compliance reporting',
                            'Search and filter log entries by criteria'
                          ]
                        }) : null}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          backgroundColor: 'white',
                          color: '#374151',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                          e.currentTarget.style.borderColor = '#9ca3af';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.borderColor = '#d1d5db';
                        }}>
                          <Eye size={14} />
                          View Logs
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Rules Tab */}
        {activeTab === "security-rules" && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1e293b',
                margin: 0
              }}>
                Security Configuration
              </h2>
              {hasFullAccess && (
                <button 
                onClick={() => isDemoMode ? showDialog({
                  title: 'Security Rules Configuration',
                  description: 'Save changes to security rules including PII detection patterns, blocked keywords, and automated response settings.',
                  features: [
                    'PII detection pattern customization',
                    'Blocked keywords and phrase management', 
                    'Automated response configuration',
                    'Security violation threshold settings',
                    'Integration with external security systems'
                  ]
                }) : null}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#10b981';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}>
                  <Save size={16} />
                  Save Changes
                </button>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '24px',
              marginBottom: '24px'
            }}>
              {/* PII Detection Patterns Card */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '20px',
                  borderBottom: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: '0 0 6px 0'
                  }}>
                    PII Detection Patterns
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    margin: 0
                  }}>
                    Regular expressions for detecting personal information
                  </p>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      Email Pattern
                    </label>
                    <input
                      type="text"
                      defaultValue="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                      readOnly={!!hasReadOnlyAccess}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '13px',
                        fontFamily: 'Monaco, "Lucida Console", monospace',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: hasReadOnlyAccess ? '#f3f4f6' : '#f9fafb',
                        color: '#1f2937',
                        cursor: hasReadOnlyAccess ? 'not-allowed' : 'text'
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      Phone Pattern
                    </label>
                    <input
                      type="text"
                      defaultValue="\b\d{3}-\d{3}-\d{4}\b"
                      readOnly={!!hasReadOnlyAccess}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '13px',
                        fontFamily: 'Monaco, "Lucida Console", monospace',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: hasReadOnlyAccess ? '#f3f4f6' : '#f9fafb',
                        color: '#1f2937',
                        cursor: hasReadOnlyAccess ? 'not-allowed' : 'text'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      SSN Pattern
                    </label>
                    <input
                      type="text"
                      defaultValue="\b\d{3}-\d{2}-\d{4}\b"
                      readOnly={!!hasReadOnlyAccess}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '13px',
                        fontFamily: 'Monaco, "Lucida Console", monospace',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: hasReadOnlyAccess ? '#f3f4f6' : '#f9fafb',
                        color: '#1f2937',
                        cursor: hasReadOnlyAccess ? 'not-allowed' : 'text'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Blocked Keywords Card */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '20px',
                  borderBottom: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: '0 0 6px 0'
                  }}>
                    Blocked Keywords
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    margin: 0
                  }}>
                    Keywords that trigger security warnings
                  </p>
                </div>
                <div style={{ padding: '20px' }}>
                  <textarea
                    placeholder="Enter blocked keywords, one per line..."
                    rows={8}
                    defaultValue={`password
secret_key
api_key
credit_card
social_security
bank_account`}
                    readOnly={!!hasReadOnlyAccess}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '13px',
                      fontFamily: 'Monaco, "Lucida Console", monospace',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: hasReadOnlyAccess ? '#f3f4f6' : '#f9fafb',
                      color: '#1f2937',
                      resize: 'vertical',
                      lineHeight: '1.5',
                      cursor: hasReadOnlyAccess ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Response Actions Card */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 6px 0'
                }}>
                  Response Actions
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  margin: 0
                }}>
                  Define what happens when security rules are triggered
                </p>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '48px',
                      height: '24px'
                    }}>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        disabled={!!hasReadOnlyAccess}
                        style={{ display: 'none' }}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: hasReadOnlyAccess ? 'not-allowed' : 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: hasReadOnlyAccess ? '#94a3b8' : '#22c55e',
                        borderRadius: '24px',
                        transition: 'all 0.3s ease'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '',
                          height: '18px',
                          width: '18px',
                          left: '27px',
                          bottom: '3px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                        }} />
                      </span>
                    </label>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      Block Message
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '48px',
                      height: '24px'
                    }}>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        disabled={!!hasReadOnlyAccess}
                        style={{ display: 'none' }}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: hasReadOnlyAccess ? 'not-allowed' : 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: hasReadOnlyAccess ? '#94a3b8' : '#22c55e',
                        borderRadius: '24px',
                        transition: 'all 0.3s ease'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '',
                          height: '18px',
                          width: '18px',
                          left: '27px',
                          bottom: '3px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                        }} />
                      </span>
                    </label>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      Log Activity
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '48px',
                      height: '24px'
                    }}>
                      <input
                        type="checkbox"
                        defaultChecked={false}
                        disabled={!!hasReadOnlyAccess}
                        style={{ display: 'none' }}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: hasReadOnlyAccess ? 'not-allowed' : 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: hasReadOnlyAccess ? '#94a3b8' : '#cbd5e1',
                        borderRadius: '24px',
                        transition: 'all 0.3s ease'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '',
                          height: '18px',
                          width: '18px',
                          left: '3px',
                          bottom: '3px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                        }} />
                      </span>
                    </label>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      Notify Admin
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === "compliance" && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1e293b',
                margin: 0
              }}>
                Compliance Settings
              </h2>
              {hasFullAccess && (
                <button 
                onClick={() => isDemoMode ? showDialog({
                  title: 'Compliance Settings Management',
                  description: 'Save compliance configuration including data retention policies, audit settings, and regulatory framework adherence.',
                  features: [
                    'GDPR, HIPAA, SOX, and PCI DSS compliance settings',
                    'Data retention policy configuration',
                    'Automated compliance reporting',
                    'Audit trail management and logging',
                    'External SIEM integration settings'
                  ]
                }) : null}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#10b981';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}>
                  <Save size={16} />
                  Save Settings
                </button>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '24px',
              marginBottom: '24px'
            }}>
              {/* Data Retention Card */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '20px',
                  borderBottom: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: '0 0 6px 0'
                  }}>
                    Data Retention
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    margin: 0
                  }}>
                    Configure how long data is stored
                  </p>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      Chat Messages
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        defaultValue="90"
                        readOnly={!!hasReadOnlyAccess}
                        style={{
                          width: '80px',
                          padding: '8px 10px',
                          fontSize: '14px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: hasReadOnlyAccess ? '#f3f4f6' : 'white',
                          color: '#1f2937',
                          cursor: hasReadOnlyAccess ? 'not-allowed' : 'text'
                        }}
                      />
                      <span style={{
                        fontSize: '14px',
                        color: '#64748b'
                      }}>
                        days
                      </span>
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      Security Logs
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        defaultValue="365"
                        readOnly={!!hasReadOnlyAccess}
                        style={{
                          width: '80px',
                          padding: '8px 10px',
                          fontSize: '14px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: hasReadOnlyAccess ? '#f3f4f6' : 'white',
                          color: '#1f2937',
                          cursor: hasReadOnlyAccess ? 'not-allowed' : 'text'
                        }}
                      />
                      <span style={{
                        fontSize: '14px',
                        color: '#64748b'
                      }}>
                        days
                      </span>
                    </div>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      User Activity
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        defaultValue="180"
                        readOnly={!!hasReadOnlyAccess}
                        style={{
                          width: '80px',
                          padding: '8px 10px',
                          fontSize: '14px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: hasReadOnlyAccess ? '#f3f4f6' : 'white',
                          color: '#1f2937',
                          cursor: hasReadOnlyAccess ? 'not-allowed' : 'text'
                        }}
                      />
                      <span style={{
                        fontSize: '14px',
                        color: '#64748b'
                      }}>
                        days
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance Standards Card */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '20px',
                  borderBottom: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: '0 0 6px 0'
                  }}>
                    Compliance Standards
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    margin: 0
                  }}>
                    Enable compliance with various standards
                  </p>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: '48px',
                        height: '24px'
                      }}>
                        <input
                          type="checkbox"
                          defaultChecked={true}
                          disabled={!!hasReadOnlyAccess}
                          style={{ display: 'none' }}
                        />
                        <span style={{
                          position: 'absolute',
                          cursor: hasReadOnlyAccess ? 'not-allowed' : 'pointer',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: hasReadOnlyAccess ? '#94a3b8' : '#22c55e',
                          borderRadius: '24px',
                          transition: 'all 0.3s ease'
                        }}>
                          <span style={{
                            position: 'absolute',
                            content: '',
                            height: '18px',
                            width: '18px',
                            left: '27px',
                            bottom: '3px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                          }} />
                        </span>
                      </label>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        GDPR Compliance
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: '48px',
                        height: '24px'
                      }}>
                        <input
                          type="checkbox"
                          defaultChecked={true}
                          disabled={!!hasReadOnlyAccess}
                          style={{ display: 'none' }}
                        />
                        <span style={{
                          position: 'absolute',
                          cursor: hasReadOnlyAccess ? 'not-allowed' : 'pointer',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: hasReadOnlyAccess ? '#94a3b8' : '#22c55e',
                          borderRadius: '24px',
                          transition: 'all 0.3s ease'
                        }}>
                          <span style={{
                            position: 'absolute',
                            content: '',
                            height: '18px',
                            width: '18px',
                            left: '27px',
                            bottom: '3px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                          }} />
                        </span>
                      </label>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        HIPAA Compliance
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: '48px',
                        height: '24px'
                      }}>
                        <input
                          type="checkbox"
                          defaultChecked={false}
                          disabled={!!hasReadOnlyAccess}
                          style={{ display: 'none' }}
                        />
                        <span style={{
                          position: 'absolute',
                          cursor: hasReadOnlyAccess ? 'not-allowed' : 'pointer',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: hasReadOnlyAccess ? '#94a3b8' : '#cbd5e1',
                          borderRadius: '24px',
                          transition: 'all 0.3s ease'
                        }}>
                          <span style={{
                            position: 'absolute',
                            content: '',
                            height: '18px',
                            width: '18px',
                            left: '3px',
                            bottom: '3px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                          }} />
                        </span>
                      </label>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        SOX Compliance
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: '48px',
                        height: '24px'
                      }}>
                        <input
                          type="checkbox"
                          defaultChecked={false}
                          disabled={!!hasReadOnlyAccess}
                          style={{ display: 'none' }}
                        />
                        <span style={{
                          position: 'absolute',
                          cursor: hasReadOnlyAccess ? 'not-allowed' : 'pointer',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: hasReadOnlyAccess ? '#94a3b8' : '#cbd5e1',
                          borderRadius: '24px',
                          transition: 'all 0.3s ease'
                        }}>
                          <span style={{
                            position: 'absolute',
                            content: '',
                            height: '18px',
                            width: '18px',
                            left: '3px',
                            bottom: '3px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                          }} />
                        </span>
                      </label>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        PCI DSS
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Settings Card */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 6px 0'
                }}>
                  Audit Settings
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  margin: 0
                }}>
                  Configure audit logging and reporting
                </p>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '48px',
                      height: '24px'
                    }}>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        style={{ display: 'none' }}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: '#22c55e',
                        borderRadius: '24px',
                        transition: 'all 0.3s ease'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '',
                          height: '18px',
                          width: '18px',
                          left: '27px',
                          bottom: '3px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                        }} />
                      </span>
                    </label>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      Enable Audit Logging
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '48px',
                      height: '24px'
                    }}>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        style={{ display: 'none' }}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: '#22c55e',
                        borderRadius: '24px',
                        transition: 'all 0.3s ease'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '',
                          height: '18px',
                          width: '18px',
                          left: '27px',
                          bottom: '3px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                        }} />
                      </span>
                    </label>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      Real-time Alerts
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '48px',
                      height: '24px'
                    }}>
                      <input
                        type="checkbox"
                        defaultChecked={false}
                        style={{ display: 'none' }}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: '#cbd5e1',
                        borderRadius: '24px',
                        transition: 'all 0.3s ease'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '',
                          height: '18px',
                          width: '18px',
                          left: '3px',
                          bottom: '3px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                        }} />
                      </span>
                    </label>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      Weekly Reports
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '48px',
                      height: '24px'
                    }}>
                      <input
                        type="checkbox"
                        defaultChecked={false}
                        style={{ display: 'none' }}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: '#cbd5e1',
                        borderRadius: '24px',
                        transition: 'all 0.3s ease'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '',
                          height: '18px',
                          width: '18px',
                          left: '3px',
                          bottom: '3px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                        }} />
                      </span>
                    </label>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      External SIEM Integration
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Demo Dialog Component */}
      <DialogComponent />
    </AdminLayout>
  );
}