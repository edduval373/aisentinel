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
  
  // Add a simple test element to verify React is working
  React.useEffect(() => {
    console.log("[LANDING DEBUG] Landing component mounted successfully");
    document.title = "AI Sentinel - Landing Page (React Working)";
  }, []);
  
  return (
    <div className="ai-sentinel-page">
      {/* Header */}
      <header className="ai-sentinel-header">
        <div className="ai-sentinel-header-container">
          <div className="ai-sentinel-header-content">
            <div className="ai-sentinel-logo-container">
              <div className="ai-sentinel-logo">
                <Shield className="w-4 h-4 text-white" style={{color: 'white'}} />
              </div>
              <h1 className="ai-sentinel-title">
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
        </div>
      </header>

      {/* Hero Section */}
      <section className="ai-sentinel-hero">
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-white mb-6">
            Ready to Secure Your AI Usage?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Join organizations that trust AI Sentinel for secure, compliant AI interactions.
          </p>
          <button
            onClick={handleLogin}
            className="bg-white text-blue-600 hover:bg-slate-50 text-lg px-8 py-3 rounded-lg font-semibold inline-flex items-center justify-center transition-colors"
          >
            Start Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
              <Shield className="w-3 h-3 text-white" />
            </div>
            <span className="text-lg font-semibold">AI Sentinel</span>
          </div>
          <p className="text-center text-slate-400 mt-4">
            Enterprise AI Governance Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
