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

  console.log("[LANDING DEBUG] About to return JSX");
  
  // Check for verification success and redirect authenticated users
  React.useEffect(() => {
    console.log("[LANDING DEBUG] Landing component mounted successfully");
    document.title = "AI Sentinel - Landing Page (React Working)";
    
    // Check if user just verified email and redirect to chat
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
      console.log("[LANDING DEBUG] Email verification detected, checking authentication...");
      
      // Check authentication status after short delay to allow session to be set
      setTimeout(async () => {
        try {
          const response = await fetch('/api/auth/me', { credentials: 'include' });
          const authData = await response.json();
          console.log("[LANDING DEBUG] Post-verification auth check:", authData);
          
          if (authData.authenticated) {
            console.log("[LANDING DEBUG] User is authenticated, redirecting to chat...");
            window.location.href = '/chat';
          } else {
            console.log("[LANDING DEBUG] User not authenticated yet, staying on landing page");
          }
        } catch (error) {
          console.error("[LANDING DEBUG] Auth check failed:", error);
        }
      }, 1000);
    }
  }, []);
  
  return (
    <div className="ai-sentinel-page" style={{ margin: 0, padding: 0, minHeight: '100vh' }}>
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
      <section className="ai-sentinel-hero" style={{ paddingTop: '2rem' }}>
        <div className="ai-sentinel-hero-container">
          <h2 className="ai-sentinel-hero-title">
            Enterprise AI
            <span style={{color: 'hsl(221, 83%, 53%)'}}> Governance</span>
          </h2>
          <p className="ai-sentinel-hero-subtitle">
            Secure, compliant, and monitored AI interactions for your organization. 
            Control AI usage while maintaining productivity and security.
          </p>
          <div className="ai-sentinel-button-container">
            <button
              onClick={handleLogin}
              className="ai-sentinel-button-primary"
            >
              Start 30-Day Free Trial
              <CheckCircle className="ml-2 w-5 h-5" style={{marginLeft: '8px', color: 'white', width: '20px', height: '20px'}} />
            </button>
            <button
              onClick={() => window.location.href = "/pricing"}
              className="ai-sentinel-button-secondary"
            >
              View Pricing Plans
              <BarChart3 className="ml-2 w-5 h-5" style={{marginLeft: '8px', color: 'hsl(221, 83%, 53%)', width: '20px', height: '20px'}} />
            </button>
          </div>
          
          {/* Development authentication shortcut */}
          <div style={{ 
            marginTop: '20px', 
            padding: '16px', 
            backgroundColor: '#fef3c7', 
            border: '1px solid #f59e0b', 
            borderRadius: '8px',
            maxWidth: '500px',
            margin: '20px auto 0'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#92400e', marginBottom: '8px' }}>
              Development Environment
            </h3>
            <p style={{ fontSize: '14px', color: '#92400e', marginBottom: '12px' }}>
              Since email verification was successful on production, click below to authenticate in this development environment:
            </p>
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/auth/dev-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email: 'ed.duval15@gmail.com' })
                  });
                  const data = await response.json();
                  if (data.success) {
                    window.location.href = '/chat';
                  } else {
                    alert('Authentication failed: ' + data.message);
                  }
                } catch (error) {
                  alert('Authentication error: ' + error.message);
                }
              }}
              style={{
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Authenticate for Development
            </button>
          </div>
          
          <div className="ai-sentinel-credit-notice">
            <div className="ai-sentinel-credit-header">
              <Lock className="w-4 h-4" style={{color: '#1d4ed8'}} />
              <span className="ai-sentinel-credit-title">
                Secure Trial Requires Credit Card
              </span>
            </div>
            <p className="ai-sentinel-credit-text">
              No charges during 30-day trial. Card required to prevent abuse and ensure service quality.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="ai-sentinel-features" style={{ marginTop: '-72px' }}>
        <div className="ai-sentinel-features-container">
          <div className="ai-sentinel-features-header">
            <h3 className="ai-sentinel-features-title">
              Complete AI Governance Solution
            </h3>
            <p className="ai-sentinel-features-subtitle">
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
            Start Now
          </button>
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
