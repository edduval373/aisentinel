import React, { useState, useEffect } from 'react';
import { X, Bug, CheckCircle, AlertCircle, XCircle, Copy } from 'lucide-react';

interface DebugInfo {
  // Environment
  environment: string;
  domain: string;
  protocol: string;
  
  // Authentication State
  isAuthenticated: boolean;
  authMethod: string;
  
  // User Information
  email: string | null;
  userId: string | null;
  firstName: string | null;
  lastName: string | null;
  
  // Role Information
  role: string | null;
  roleLevel: number | null;
  effectiveRoleLevel: number | null;
  isDeveloper: boolean;
  testRole: string | null;
  
  // Company Information
  companyId: number | null;
  companyName: string | null;
  companyDomain: string | null;
  
  // Session Information
  sessionToken: string | null;
  sessionExists: boolean;
  sessionValid: boolean;
  lastAccessed: string | null;
  
  // Cookies Information
  cookiesCount: number;
  criticalCookies: string[];
  
  // API Status
  apiHealth: boolean;
  databaseConnected: boolean;
  lastApiCall: string | null;
  
  // Browser Information
  userAgent: string;
  cookiesEnabled: boolean;
  localStorageEnabled: boolean;
  
  // Timestamp
  timestamp: string;
}

interface DebugStatusPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DebugStatusPanel({ isOpen, onClose }: DebugStatusPanelProps) {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const collectDebugInfo = async (): Promise<DebugInfo> => {
    const info: DebugInfo = {
      // Environment
      environment: import.meta.env.MODE || 'unknown',
      domain: window.location.hostname,
      protocol: window.location.protocol,
      
      // Initialize defaults
      isAuthenticated: false,
      authMethod: 'unknown',
      email: null,
      userId: null,
      firstName: null,
      lastName: null,
      role: null,
      roleLevel: null,
      effectiveRoleLevel: null,
      isDeveloper: false,
      testRole: null,
      companyId: null,
      companyName: null,
      companyDomain: null,
      sessionToken: null,
      sessionExists: false,
      sessionValid: false,
      lastAccessed: null,
      cookiesCount: 0,
      criticalCookies: [],
      apiHealth: false,
      databaseConnected: false,
      lastApiCall: null,
      userAgent: navigator.userAgent,
      cookiesEnabled: navigator.cookieEnabled,
      localStorageEnabled: typeof(Storage) !== "undefined",
      timestamp: new Date().toISOString()
    };

    // Collect cookie information
    const cookies = document.cookie.split(';').filter(c => c.trim().length > 0);
    info.cookiesCount = cookies.length;
    
    const criticalCookieNames = ['sessionToken', 'demoUser', 'authToken', 'replit-auth'];
    info.criticalCookies = cookies
      .map(c => c.trim().split('=')[0])
      .filter(name => criticalCookieNames.some(critical => name.includes(critical)));

    // Check for session token
    const sessionCookie = cookies.find(c => c.trim().startsWith('sessionToken='));
    if (sessionCookie) {
      info.sessionToken = sessionCookie.split('=')[1]?.substring(0, 20) + '...';
      info.sessionExists = true;
    }

    // Try to get authentication status from API
    try {
      const authResponse = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      info.lastApiCall = new Date().toISOString();
      
      if (authResponse.ok) {
        const authData = await authResponse.json();
        
        if (authData.authenticated && authData.user) {
          info.isAuthenticated = true;
          info.sessionValid = true;
          info.authMethod = 'API Session';
          
          // User information
          info.email = authData.user.email || null;
          info.userId = authData.user.id?.toString() || null;
          info.firstName = authData.user.firstName || null;
          info.lastName = authData.user.lastName || null;
          
          // Role information
          info.role = authData.user.role || null;
          info.roleLevel = authData.user.roleLevel || null;
          info.effectiveRoleLevel = authData.user.effectiveRoleLevel || authData.user.roleLevel || null;
          info.isDeveloper = authData.user.isDeveloper || false;
          info.testRole = authData.user.testRole || null;
          
          // Company information
          info.companyId = authData.user.companyId || null;
          info.companyName = authData.user.companyName || null;
          info.companyDomain = authData.user.companyDomain || null;
        }
      } else {
        info.authMethod = `API Error: ${authResponse.status}`;
      }
    } catch (error) {
      info.authMethod = `API Failed: ${error instanceof Error ? error.message : 'Unknown'}`;
    }

    // Test API health
    try {
      const healthResponse = await fetch('/api/health', {
        credentials: 'include'
      });
      info.apiHealth = healthResponse.ok;
    } catch {
      info.apiHealth = false;
    }

    // Test database connection (if available)
    try {
      const dbResponse = await fetch('/api/db-test', {
        credentials: 'include'
      });
      if (dbResponse.ok) {
        const dbData = await dbResponse.json();
        info.databaseConnected = dbData.databaseConfigured || false;
      }
    } catch {
      info.databaseConnected = false;
    }

    return info;
  };

  const refreshDebugInfo = async () => {
    setRefreshing(true);
    try {
      const info = await collectDebugInfo();
      setDebugInfo(info);
    } catch (error) {
      console.error('Failed to collect debug info:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshDebugInfo();
    }
  }, [isOpen]);

  const copyToClipboard = () => {
    if (debugInfo) {
      const debugText = JSON.stringify(debugInfo, null, 2);
      navigator.clipboard.writeText(debugText).then(() => {
        alert('Debug information copied to clipboard');
      });
    }
  };

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <AlertCircle style={{ color: '#f59e0b', width: '16px', height: '16px' }} />;
    if (status) return <CheckCircle style={{ color: '#10b981', width: '16px', height: '16px' }} />;
    return <XCircle style={{ color: '#ef4444', width: '16px', height: '16px' }} />;
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        maxWidth: '800px',
        maxHeight: '90vh',
        width: '90%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bug style={{ color: '#3b82f6', width: '20px', height: '20px' }} />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
              Debug Status Panel
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={refreshDebugInfo}
              disabled={refreshing}
              style={{
                padding: '8px 12px',
                backgroundColor: refreshing ? '#d1d5db' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button 
              onClick={copyToClipboard}
              style={{
                padding: '8px 12px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Copy style={{ width: '14px', height: '14px' }} />
              Copy
            </button>
            <button 
              onClick={onClose}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <X style={{ color: '#6b7280', width: '20px', height: '20px' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          overflow: 'auto',
          flex: 1
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '16px', color: '#6b7280' }}>Collecting debug information...</div>
            </div>
          ) : debugInfo ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
              
              {/* Environment Information */}
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '16px',
                backgroundColor: '#f9fafb'
              }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>
                  Environment
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                  <div><strong>Mode:</strong> {debugInfo.environment}</div>
                  <div><strong>Domain:</strong> {debugInfo.domain}</div>
                  <div><strong>Protocol:</strong> {debugInfo.protocol}</div>
                  <div><strong>Timestamp:</strong> {new Date(debugInfo.timestamp).toLocaleString()}</div>
                </div>
              </div>

              {/* Authentication Status */}
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '16px',
                backgroundColor: debugInfo.isAuthenticated ? '#f0f9ff' : '#fef2f2'
              }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>
                  Authentication Status
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getStatusIcon(debugInfo.isAuthenticated)}
                    <strong>Authenticated:</strong> {debugInfo.isAuthenticated ? 'Yes' : 'No'}
                  </div>
                  <div><strong>Method:</strong> {debugInfo.authMethod}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getStatusIcon(debugInfo.sessionValid)}
                    <strong>Session Valid:</strong> {debugInfo.sessionValid ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>

              {/* User Information */}
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '16px',
                backgroundColor: '#f9fafb'
              }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>
                  User Information
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                  <div><strong>Email:</strong> {debugInfo.email || 'N/A'}</div>
                  <div><strong>User ID:</strong> {debugInfo.userId || 'N/A'}</div>
                  <div><strong>Name:</strong> {debugInfo.firstName && debugInfo.lastName ? `${debugInfo.firstName} ${debugInfo.lastName}` : 'N/A'}</div>
                </div>
              </div>

              {/* Role Information */}
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '16px',
                backgroundColor: debugInfo.isDeveloper ? '#f0fdf4' : '#f9fafb'
              }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>
                  Role Information
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                  <div><strong>Role:</strong> {debugInfo.role || 'N/A'}</div>
                  <div><strong>Role Level:</strong> {debugInfo.roleLevel !== null ? debugInfo.roleLevel : 'N/A'}</div>
                  <div><strong>Effective Level:</strong> {debugInfo.effectiveRoleLevel !== null ? debugInfo.effectiveRoleLevel : 'N/A'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getStatusIcon(debugInfo.isDeveloper)}
                    <strong>Developer:</strong> {debugInfo.isDeveloper ? 'Yes' : 'No'}
                  </div>
                  {debugInfo.testRole && (
                    <div style={{ padding: '4px 8px', backgroundColor: '#fbbf24', color: '#92400e', borderRadius: '4px', fontSize: '12px' }}>
                      <strong>Test Role:</strong> {debugInfo.testRole}
                    </div>
                  )}
                </div>
              </div>

              {/* Company Information */}
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '16px',
                backgroundColor: '#f9fafb'
              }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>
                  Company Information
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                  <div><strong>Company ID:</strong> {debugInfo.companyId !== null ? debugInfo.companyId : 'N/A'}</div>
                  <div><strong>Company Name:</strong> {debugInfo.companyName || 'N/A'}</div>
                  <div><strong>Domain:</strong> {debugInfo.companyDomain || 'N/A'}</div>
                </div>
              </div>

              {/* Session Information */}
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '16px',
                backgroundColor: '#f9fafb'
              }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>
                  Session Information
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getStatusIcon(debugInfo.sessionExists)}
                    <strong>Session Exists:</strong> {debugInfo.sessionExists ? 'Yes' : 'No'}
                  </div>
                  <div><strong>Token Preview:</strong> {debugInfo.sessionToken || 'N/A'}</div>
                  <div><strong>Cookies Count:</strong> {debugInfo.cookiesCount}</div>
                  <div><strong>Critical Cookies:</strong> {debugInfo.criticalCookies.length > 0 ? debugInfo.criticalCookies.join(', ') : 'None'}</div>
                </div>
              </div>

              {/* System Status */}
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '16px',
                backgroundColor: '#f9fafb'
              }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>
                  System Status
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getStatusIcon(debugInfo.apiHealth)}
                    <strong>API Health:</strong> {debugInfo.apiHealth ? 'Online' : 'Offline'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getStatusIcon(debugInfo.databaseConnected)}
                    <strong>Database:</strong> {debugInfo.databaseConnected ? 'Connected' : 'Disconnected'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getStatusIcon(debugInfo.cookiesEnabled)}
                    <strong>Cookies:</strong> {debugInfo.cookiesEnabled ? 'Enabled' : 'Disabled'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getStatusIcon(debugInfo.localStorageEnabled)}
                    <strong>Local Storage:</strong> {debugInfo.localStorageEnabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              </div>

              {/* Browser Information */}
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '16px',
                backgroundColor: '#f9fafb',
                gridColumn: '1 / -1'
              }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>
                  Browser Information
                </h3>
                <div style={{ fontSize: '12px', color: '#6b7280', wordBreak: 'break-all' }}>
                  <strong>User Agent:</strong> {debugInfo.userAgent}
                </div>
              </div>

            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '16px', color: '#ef4444' }}>Failed to collect debug information</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}