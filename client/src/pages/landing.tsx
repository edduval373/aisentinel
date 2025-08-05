// PROTECTED SECTION START - Landing Page Authentication Flow - July 30, 2025
// Changes require explicit developer permission
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, BarChart3, Lock, CheckCircle, AlertTriangle, Settings, Tag, Bug } from "lucide-react";
import VersionDisplay from "@/components/VersionDisplay";
import SessionDebugModal from "@/components/SessionDebugModal";


export default function Landing() {
  console.log("[LANDING DEBUG] Landing component rendering...");
  
  const [currentVersion, setCurrentVersion] = useState<any>(null);

  // Fetch current version on component mount
  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch('/api/version/current');
        if (response.ok) {
          const versionData = await response.json();
          console.log("[LANDING DEBUG] Version data fetched:", versionData);
          setCurrentVersion(versionData);
        }
      } catch (error) {
        console.log("Failed to fetch version info:", error);
      }
    };
    
    fetchVersion();
  }, []);
  
  const handleLogin = () => {
    console.log("[LANDING DEBUG] Login button clicked");
    window.location.href = "/login";
  };

  const handleDemoMode = () => {
    console.log("[LANDING DEBUG] Demo mode button clicked");
    window.location.href = "/demo-signup";
  };

  const handleDevAuthentication = async () => {
    console.log("[LANDING DEBUG] Production session creation starting...");
    console.log("[LANDING DEBUG] Using header-based authentication strategy");
    
    try {
      // Check if user already has a valid session token
      const existingToken = localStorage.getItem('sessionToken');
      if (!existingToken) {
        console.log('[LANDING DEBUG] No session token found - redirecting to login');
        window.location.href = "/login";
        return;
      }
      
      console.log('[LANDING DEBUG] Using existing session token for authentication');
      localStorage.setItem('authToken', existingToken);
      
      // Store user account data using the AccountManager format
      const accountData = {
        email: 'ed.duval15@gmail.com',
        sessionToken: existingToken,
        role: 'super-user',
        roleLevel: 1000,
        companyName: 'Duval Solutions',
        companyId: 1
      };
      
      // Use AccountManager format and storage key
      const savedAccountsArray = [{
        ...accountData,
        lastUsed: new Date().toISOString()
      }];
      
      localStorage.setItem('aisentinel_saved_accounts', JSON.stringify(savedAccountsArray));
      localStorage.setItem('currentAccount', JSON.stringify(accountData));
      console.log('[LANDING DEBUG] Account data stored with correct AccountManager format:', accountData);
      
      // Verify storage immediately
      const verification = localStorage.getItem('aisentinel_saved_accounts');
      console.log('[LANDING DEBUG] Storage verification:', verification ? 'SUCCESS' : 'FAILED');
      if (verification) {
        const parsed = JSON.parse(verification);
        console.log('[LANDING DEBUG] Stored accounts count:', parsed.length);
        console.log('[LANDING DEBUG] First account:', parsed[0]);
      }
      
      // Test authentication immediately with header-based strategy
      const authTest = await fetch('/api/auth/secure-me', {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${existingToken}`,
          'X-Session-Token': existingToken
        }
      });
      const authResult = await authTest.json();
      console.log('[LANDING DEBUG] Header auth test result:', authResult);
      
      if (authResult.authenticated) {
        console.log('[LANDING DEBUG] ✅ Header authentication successful! Redirecting to chat...');
        
        // Show success message briefly before redirect
        alert('✅ Production session created successfully! Redirecting to chat interface...');
        
        // Redirect to chat
        setTimeout(() => {
          window.location.href = '/chat';
        }, 1000);
      } else {
        console.log('[LANDING DEBUG] Header auth failed, trying main auth endpoint...');
        
        // Fallback to main auth endpoint with headers
        const mainAuthTest = await fetch('/api/auth/me', {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
            'X-Session-Token': sessionToken
          }
        });
        const mainAuthResult = await mainAuthTest.json();
        console.log('[LANDING DEBUG] Main header auth test result:', mainAuthResult);
        
        if (mainAuthResult.authenticated) {
          console.log('[LANDING DEBUG] ✅ Main header auth successful! Redirecting to chat...');
          
          // Show success message briefly before redirect
          alert('✅ Production session created successfully! Redirecting to chat interface...');
          
          // Redirect to chat
          setTimeout(() => {
            window.location.href = '/chat';
          }, 1000);
        } else {
          throw new Error('Header authentication failed on both endpoints');
        }
      }
      
    } catch (error) {
      console.error('[LANDING DEBUG] Production session error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert('Production session error: ' + errorMessage);
    }
  };

  // Helper function to get cookie value
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };



  console.log("[LANDING DEBUG] About to return JSX");
  
  // Check for verification success and redirect authenticated users
  React.useEffect(() => {
    console.log("[LANDING DEBUG] Landing component mounted successfully");
    document.title = "AI Sentinel - Landing Page (React Working)";
    
    const demoUserEmail = getCookie('demoUser');
    const sessionToken = getCookie('sessionToken');

    // Check if user is already authenticated - immediate redirect for valid cookies
    if (sessionToken && sessionToken.length > 10) {
      console.log("[LANDING DEBUG] Session token detected, checking authentication...");
      
      fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      .then(response => response.json())
      .then(authData => {
        console.log("[LANDING DEBUG] Auth response:", authData);
        if (authData.authenticated && authData.user) {
          console.log("[LANDING DEBUG] Authenticated user detected, redirecting to main app");
          window.location.href = '/';
          return;
        }
      })
      .catch(error => {
        console.log("[LANDING DEBUG] Auth check failed:", error);
      });
    }
    
    if (demoUserEmail && sessionToken && sessionToken.startsWith('demo-session-')) {
      console.log("[LANDING DEBUG] Returning demo user detected:", demoUserEmail);
      console.log("[LANDING DEBUG] Redirecting to demo chat...");
      window.location.href = '/demo';
      return;
    }
    
    // Check if user just verified email and immediately check authentication
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
      const verifiedEmail = urlParams.get('email');
      console.log("[LANDING DEBUG] Email verification detected for:", verifiedEmail);
      
      // Clear URL parameters immediately
      window.history.replaceState({}, document.title, '/');
      
      // Check authentication immediately after verification
      console.log("[LANDING DEBUG] Checking authentication after email verification...");
      fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      .then(response => response.json())
      .then(authData => {
        console.log("[LANDING DEBUG] Post-verification auth response:", authData);
        if (authData.authenticated && authData.user) {
          console.log("[LANDING DEBUG] Authentication confirmed after verification, redirecting to main app");
          window.location.href = '/';
          return;
        } else {
          console.log("[LANDING DEBUG] Not authenticated after verification, staying on landing page");
        }
      })
      .catch(error => {
        console.log("[LANDING DEBUG] Post-verification auth check failed:", error);
      });
      
      // Show verification success notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 1000;
        font-family: system-ui, -apple-system, sans-serif;
        font-weight: 500;
      `;
      notification.textContent = `✅ Email verified successfully! Redirecting to chat...`;
      document.body.appendChild(notification);
      
      // Remove notification after redirect
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 2000);
      
      return; // Exit useEffect early since we're handling verification
    }
  }, []);
  
  return (
    <div style={{ 
      margin: 0, 
      padding: 0, 
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: '1.6',
      color: '#1e293b'
    }}>

      {/* Header */}
      <header style={{ 
        position: 'relative', 
        width: '100%',
        backgroundColor: 'white', 
        borderBottom: '1px solid #e2e8f0', 
        padding: '20px 1rem',
        margin: 0,
        boxSizing: 'border-box'
      }}>
        <div style={{ 
          maxWidth: '80rem', 
          margin: '0 auto', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          height: '48px',
          width: '100%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src="/ai-sentinel-logo.png" 
              alt="AI Sentinel" 
              style={{ 
                width: '40px', 
                height: '40px', 
                objectFit: 'contain',
                flexShrink: 0
              }}
            />
            <h1 style={{ 
              fontSize: '20px', 
              fontWeight: 600, 
              color: '#1e293b' 
            }}>
              AI Sentinel
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button 
              onClick={handleLogin} 
              className="ai-sentinel-sign-in"
            >
              Sign In
            </Button>

          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ 
        paddingTop: '2rem',
        paddingBottom: '4rem',
        backgroundColor: '#f8fafc',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '0 1rem'
        }}>
          <h2 style={{
            fontSize: '3.5rem',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            color: '#1e293b'
          }}>
            Enterprise AI
            <span style={{color: 'hsl(221, 83%, 53%)'}}> Governance</span>
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: '#64748b',
            marginBottom: '3rem',
            maxWidth: '48rem',
            margin: '0 auto 3rem auto'
          }}>
            Secure, compliant, and monitored AI interactions for your organization. 
            Control AI usage while maintaining productivity and security.
          </p>
          {/* Optimized side-by-side button layout */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <button
              onClick={handleLogin}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 20px',
                backgroundColor: '#1e40af',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                minWidth: '250px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                flex: '1',
                maxWidth: '280px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 12px -1px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#1e40af';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              Start 30-Day Free Trial
              <CheckCircle style={{marginLeft: '8px', color: 'white', width: '18px', height: '18px'}} />
            </button>
            <button
              onClick={handleDevAuthentication}
              className="ai-sentinel-button-dev-auth"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 20px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                minWidth: '250px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                flex: '1',
                maxWidth: '280px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#b91c1c';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 12px -1px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#dc2626';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              Create Production Session
              <Shield style={{marginLeft: '8px', color: 'white', width: '18px', height: '18px'}} />
            </button>
            <button
              onClick={handleDemoMode}
              className="ai-sentinel-button-demo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 20px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                minWidth: '250px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                flex: '1',
                maxWidth: '280px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#15803d';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 12px -1px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#16a34a';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              Try Demo Mode (3 Free)
              <Shield style={{marginLeft: '8px', color: 'white', width: '18px', height: '18px'}} />
            </button>
            <button
              onClick={() => window.location.href = "/pricing"}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 20px',
                backgroundColor: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                minWidth: '250px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                flex: '1',
                maxWidth: '280px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#6d28d9';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 12px -1px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#7c3aed';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              View Pricing Plans
              <BarChart3 style={{marginLeft: '8px', color: 'white', width: '18px', height: '18px'}} />
            </button>

            
            {/* Debug Session Modal - Development Tool */}
            <SessionDebugModal 
              trigger={
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 20px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    minWidth: '250px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    flex: '1',
                    maxWidth: '280px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#d97706';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 12px -1px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#f59e0b';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  Debug Session Elements
                  <Bug style={{marginLeft: '8px', color: 'white', width: '18px', height: '18px'}} />
                </button>
              }
            />
          </div>
          

          
          {/* Centered Security & Version Information Section */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: '32px',
            gap: '16px'
          }}>
            {/* Version Display - Prominent */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              padding: '16px 32px',
              fontWeight: '700',
              fontSize: '18px',
              color: '#1e40af',
              boxShadow: '0 4px 12px rgba(30, 64, 175, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Shield style={{width: '20px', height: '20px', color: '#1e40af'}} />
              <span>AI Sentinel {currentVersion?.version ? `v${currentVersion.version}` : 'v1.0.2'}</span>
            </div>
            
            {/* Credit Card Security Notice */}
            <div style={{
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px',
              maxWidth: '500px',
              textAlign: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <Lock style={{width: '16px', height: '16px', color: '#1d4ed8'}} />
                <span style={{
                  fontWeight: '600',
                  color: '#1e293b',
                  fontSize: '14px'
                }}>
                  Secure Trial Requires Credit Card
                </span>
              </div>
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                margin: 0,
                lineHeight: '1.5'
              }}>
                No charges during 30-day trial. Card required to prevent abuse and ensure service quality.
              </p>
            </div>
          </div>


        </div>
      </section>

      {/* Features Section */}
      <section style={{ 
        marginTop: '4rem',
        paddingTop: '4rem',
        paddingBottom: '4rem',
        backgroundColor: 'white'
      }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '0 1rem'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            <h3 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '1rem'
            }}>
              Complete AI Governance Solution
            </h3>
            <p style={{
              fontSize: '1.125rem',
              color: '#64748b',
              maxWidth: '48rem',
              margin: '0 auto'
            }}>
              Comprehensive tools to manage, monitor, and secure your organization's AI interactions
            </p>
          </div>
          
          <div style={{
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '2rem',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div style={{
                  width: '48px', 
                  height: '48px', 
                  backgroundColor: '#eff6ff', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: '16px'
                }}>
                  <Shield style={{ width: '24px', height: '24px', color: '#2563eb' }} />
                </div>
                <CardTitle className="text-slate-800">Security & Compliance</CardTitle>
                <CardDescription>
                  Automatic PII detection, data leakage prevention, and policy enforcement
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div style={{
                  width: '48px', 
                  height: '48px', 
                  backgroundColor: '#f0fdf4', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: '16px'
                }}>
                  <Users style={{ width: '24px', height: '24px', color: '#16a34a' }} />
                </div>
                <CardTitle className="text-slate-800">User Management</CardTitle>
                <CardDescription>
                  Role-based access control and comprehensive user activity tracking
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div style={{
                  width: '48px', 
                  height: '48px', 
                  backgroundColor: '#fefce8', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: '16px'
                }}>
                  <BarChart3 style={{ width: '24px', height: '24px', color: '#ca8a04' }} />
                </div>
                <CardTitle className="text-slate-800">Analytics & Reporting</CardTitle>
                <CardDescription>
                  Real-time monitoring, detailed analytics, and compliance reporting
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section style={{ padding: '5rem 1rem', backgroundColor: '#f8fafc' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '3rem', 
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{ fontSize: '30px', fontWeight: 700, color: '#1e293b', marginBottom: '24px' }}>
                Advanced Security Features
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                  <CheckCircle style={{ width: '20px', height: '20px', color: '#16a34a', marginTop: '4px', flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>PII Detection</h4>
                    <p style={{ color: '#64748b' }}>Automatically detects and blocks personally identifiable information</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                  <CheckCircle style={{ width: '20px', height: '20px', color: '#16a34a', marginTop: '4px', flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>Financial Data Protection</h4>
                    <p style={{ color: '#64748b' }}>Prevents sharing of sensitive financial information</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                  <CheckCircle style={{ width: '20px', height: '20px', color: '#16a34a', marginTop: '4px', flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>Real-time Monitoring</h4>
                    <p style={{ color: '#64748b' }}>Continuous monitoring of all AI interactions</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                  <CheckCircle style={{ width: '20px', height: '20px', color: '#16a34a', marginTop: '4px', flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>Configurable Policies</h4>
                    <p style={{ color: '#64748b' }}>Customizable governance policies for your organization</p>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ 
              backgroundColor: 'white', 
              padding: '2rem', 
              borderRadius: '12px', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>Security Alert</h4>
                <AlertTriangle style={{ width: '20px', height: '20px', color: '#d97706' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ 
                  backgroundColor: '#fffbeb', 
                  border: '1px solid #fed7aa', 
                  borderRadius: '8px', 
                  padding: '16px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <AlertTriangle style={{ width: '16px', height: '16px', color: '#d97706', marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#b45309', marginBottom: '4px' }}>Financial Data Detected</p>
                      <p style={{ fontSize: '14px', color: '#64748b' }}>Message contains references to company financial data</p>
                    </div>
                  </div>
                </div>
                <div style={{ 
                  backgroundColor: '#fef2f2', 
                  border: '1px solid #fecaca', 
                  borderRadius: '8px', 
                  padding: '16px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <Lock style={{ width: '16px', height: '16px', color: '#dc2626', marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#b91c1c', marginBottom: '4px' }}>PII Blocked</p>
                      <p style={{ fontSize: '14px', color: '#64748b' }}>Personal information automatically filtered</p>
                    </div>
                  </div>
                </div>
                <div style={{ 
                  backgroundColor: '#f0fdf4', 
                  border: '1px solid #bbf7d0', 
                  borderRadius: '8px', 
                  padding: '16px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <CheckCircle style={{ width: '16px', height: '16px', color: '#16a34a', marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#15803d', marginBottom: '4px' }}>Message Approved</p>
                      <p style={{ fontSize: '14px', color: '#64748b' }}>Content meets security requirements</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ 
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)', 
        padding: '5rem 1rem', 
        textAlign: 'center' 
      }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <h3 style={{ 
            fontSize: '30px', 
            fontWeight: 700, 
            color: 'white', 
            marginBottom: '24px' 
          }}>
            Ready to Secure Your AI Usage?
          </h3>
          <p style={{ 
            fontSize: '20px', 
            color: '#bfdbfe', 
            marginBottom: '32px' 
          }}>
            Join organizations that trust AI Sentinel for secure, compliant AI interactions.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleLogin}
              style={{
                backgroundColor: 'white',
                color: '#1e40af',
                padding: '12px 32px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '18px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              Start Free Trial
            </button>
            <button
              onClick={handleDemoMode}
              style={{
                backgroundColor: 'transparent',
                color: 'white',
                padding: '12px 32px',
                borderRadius: '8px',
                border: '2px solid white',
                fontSize: '18px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Try Demo Mode
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: '#1e293b', color: 'white', padding: '3rem 1rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ 
              width: '24px', 
              height: '24px', 
              backgroundColor: '#2563eb', 
              borderRadius: '6px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Shield style={{ width: '12px', height: '12px', color: 'white' }} />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 600 }}>AI Sentinel</span>
          </div>
          <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
            Enterprise AI Governance Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
// PROTECTED SECTION END - Landing Page Authentication Flow
