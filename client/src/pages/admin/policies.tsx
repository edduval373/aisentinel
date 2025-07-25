import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useToast } from "@/hooks/use-toast";
import { Shield, AlertTriangle, Save, Plus, Edit, Eye, Settings } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { hasAccessLevel, ACCESS_REQUIREMENTS } from "@/utils/roleBasedAccess";

export default function AdminPolicies() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const [activeTab, setActiveTab] = useState("content-filters");

  // Check access level
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !hasAccessLevel(user?.roleLevel, ACCESS_REQUIREMENTS.CONTENT_POLICIES))) {
      toast({
        title: "Access Denied",
        description: `Content Policies requires Admin level (2+) access. Your current level: ${user?.roleLevel || 0}`,
        variant: "destructive",
      });
      window.location.href = "/";
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

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
    <AdminLayout title="Content Policies" subtitle={`Manage security policies and content filtering rules for ${user?.companyName || 'Company'}`}>
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
              <button style={{
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
                            style={{ display: 'none' }}
                          />
                          <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: filter.enabled ? '#22c55e' : '#cbd5e1',
                            borderRadius: '24px',
                            transition: 'all 0.3s ease'
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
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{
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
                      <button style={{
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
              <button style={{
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
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '13px',
                        fontFamily: 'Monaco, "Lucida Console", monospace',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: '#f9fafb',
                        color: '#1f2937'
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
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '13px',
                        fontFamily: 'Monaco, "Lucida Console", monospace',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: '#f9fafb',
                        color: '#1f2937'
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
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '13px',
                        fontFamily: 'Monaco, "Lucida Console", monospace',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: '#f9fafb',
                        color: '#1f2937'
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
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '13px',
                      fontFamily: 'Monaco, "Lucida Console", monospace',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: '#f9fafb',
                      color: '#1f2937',
                      resize: 'vertical',
                      lineHeight: '1.5'
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
              <button style={{
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
                        style={{
                          width: '80px',
                          padding: '8px 10px',
                          fontSize: '14px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          color: '#1f2937'
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
                        style={{
                          width: '80px',
                          padding: '8px 10px',
                          fontSize: '14px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          color: '#1f2937'
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
                        style={{
                          width: '80px',
                          padding: '8px 10px',
                          fontSize: '14px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          color: '#1f2937'
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
    </AdminLayout>
  );
}