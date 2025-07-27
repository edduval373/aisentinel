import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, BarChart3, Lock, CheckCircle, AlertTriangle } from "lucide-react";

export default function Landing() {
  console.log("[LANDING DEBUG] Landing component rendering...");
  
  const handleLogin = () => {
    console.log("[LANDING DEBUG] Login button clicked");
    window.location.href = "/login";
  };

  const handleDemoMode = () => {
    console.log("[LANDING DEBUG] Demo mode button clicked");
    window.location.href = "/demo-signup";
  };

  console.log("[LANDING DEBUG] About to return JSX");
  
  // Check for verification success and redirect authenticated users
  React.useEffect(() => {
    console.log("[LANDING DEBUG] Landing component mounted successfully");
    document.title = "AI Sentinel - Landing Page (React Working)";
    
    // Check for returning demo user
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const demoUserEmail = getCookie('demoUser');
    const sessionToken = getCookie('sessionToken');
    
    if (demoUserEmail && sessionToken && sessionToken.startsWith('demo-session-')) {
      console.log("[LANDING DEBUG] Returning demo user detected:", demoUserEmail);
      console.log("[LANDING DEBUG] Redirecting to demo chat...");
      window.location.href = '/demo';
      return;
    }
    
    // Check if user just verified email and show success message
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
      const verifiedEmail = urlParams.get('email');
      console.log("[LANDING DEBUG] Email verification detected for:", verifiedEmail);
      
      // Show success message and clear URL parameters
      setTimeout(() => {
        // Clear URL parameters 
        window.history.replaceState({}, document.title, '/');
        // Force page refresh to check authentication
        window.location.reload();
      }, 2000);
      
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
      notification.textContent = `✅ Email verified successfully! Welcome to AI Sentinel.`;
      document.body.appendChild(notification);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
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
          <Button 
            onClick={handleLogin} 
            className="ai-sentinel-sign-in"
          >
            Sign In
          </Button>
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
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <button
              onClick={handleLogin}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 24px',
                backgroundColor: '#1e40af',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                minWidth: '200px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                margin: '8px'
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
              <CheckCircle style={{marginLeft: '8px', color: 'white', width: '20px', height: '20px'}} />
            </button>
            <button
              onClick={handleDemoMode}
              className="ai-sentinel-button-demo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 24px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                minWidth: '200px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                margin: '8px'
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
              Try Demo Mode (3 Free Questions)
              <Shield style={{marginLeft: '8px', color: 'white', width: '20px', height: '20px'}} />
            </button>
            <button
              onClick={() => window.location.href = "/pricing"}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 24px',
                backgroundColor: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                minWidth: '200px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                margin: '8px'
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
              <BarChart3 style={{marginLeft: '8px', color: 'white', width: '20px', height: '20px'}} />
            </button>
          </div>
          

          
          <div style={{
            backgroundColor: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '24px',
            maxWidth: '500px',
            margin: '24px auto 0 auto'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
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

          {/* Development Testing Section */}
          <div style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '24px',
            maxWidth: '600px',
            margin: '24px auto 0 auto'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <Settings style={{width: '16px', height: '16px', color: '#f59e0b'}} />
              <span style={{
                fontWeight: '600',
                color: '#92400e',
                fontSize: '14px'
              }}>
                Development Testing Accounts
              </span>
            </div>
            <p style={{
              fontSize: '14px',
              color: '#92400e',
              margin: '0 0 12px 0',
              lineHeight: '1.5'
            }}>
              Quick login for testing role management functionality:
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={async () => {
                  const response = await fetch('/api/auth/dev-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email: 'ed.duval15@gmail.com' })
                  });
                  if (response.ok) window.location.href = '/chat';
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Super-User (100)
              </button>
              <button
                onClick={async () => {
                  const response = await fetch('/api/auth/dev-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email: 'ed.duval+test2@gmail.com' })
                  });
                  if (response.ok) window.location.href = '/chat';
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Admin (2)
              </button>
              <button
                onClick={async () => {
                  const response = await fetch('/api/auth/dev-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email: 'ed.duval+test1@gmail.com' })
                  });
                  if (response.ok) window.location.href = '/chat';
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                User (1)
              </button>
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
          <p style={{ color: '#94a3b8' }}>
            Enterprise AI Governance Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
