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
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
      }}
    >
      {/* Header */}
      <header 
        className="bg-white shadow-sm border-b"
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div 
                className="w-8 h-8 bg-sentinel-blue rounded-lg flex items-center justify-center"
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: 'hsl(221, 83%, 53%)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Shield className="w-4 h-4 text-white" style={{color: 'white'}} />
              </div>
              <h1 
                className="text-xl font-bold text-slate-800"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#1e293b'
                }}
              >
                AI Sentinel
              </h1>
            </div>
            <Button 
              onClick={handleLogin} 
              className="bg-sentinel-blue hover:bg-blue-600"
              style={{
                backgroundColor: 'hsl(221, 83%, 53%)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="py-20 px-4 sm:px-6 lg:px-8"
        style={{
          padding: '6rem 1rem',
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div 
          className="max-w-7xl mx-auto text-center"
          style={{
            maxWidth: '72rem',
            margin: '0 auto',
            textAlign: 'center',
            width: '100%'
          }}
        >
          <h2 
            className="text-4xl md:text-6xl font-bold text-slate-800 mb-6"
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '1.5rem',
              lineHeight: '1.1'
            }}
          >
            Enterprise AI
            <span 
              className="text-sentinel-blue" 
              style={{color: 'hsl(221, 83%, 53%)'}}
            > 
              Governance
            </span>
          </h2>
          <p 
            className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto"
            style={{
              fontSize: '1.25rem',
              color: '#475569',
              marginBottom: '2rem',
              maxWidth: '48rem',
              margin: '0 auto 2rem auto',
              lineHeight: '1.7'
            }}
          >
            Secure, compliant, and monitored AI interactions for your organization. 
            Control AI usage while maintaining productivity and security.
          </p>
          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '1rem',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '2rem'
            }}
          >
            <Button
              onClick={handleLogin}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200"
              style={{
                background: 'hsl(221, 83%, 53%)',
                color: 'white',
                padding: '12px 24px',
                fontSize: '1rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '500',
                minWidth: '180px',
                height: '48px'
              }}
            >
              Start 30-Day Free Trial
              <CheckCircle className="ml-2 w-5 h-5" style={{marginLeft: '8px', color: 'white', width: '20px', height: '20px'}} />
            </Button>
            <Button
              onClick={() => window.location.href = "/pricing"}
              variant="outline"
              size="lg"
              className="border-2 border-blue-200 text-blue-700 hover:bg-blue-50 shadow-lg transform hover:scale-105 transition-all duration-200"
              style={{
                backgroundColor: 'white',
                color: 'hsl(221, 83%, 53%)',
                border: '1px solid #d1d5db',
                padding: '12px 24px',
                fontSize: '1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '500',
                minWidth: '180px',
                height: '48px'
              }}
            >
              View Pricing Plans
              <BarChart3 className="ml-2 w-5 h-5" style={{marginLeft: '8px', color: 'hsl(221, 83%, 53%)', width: '20px', height: '20px'}} />
            </Button>
          </div>
          
          <div 
            className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto"
            style={{
              marginTop: '0',
              padding: '16px 20px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              maxWidth: '28rem',
              margin: '0 auto'
            }}
          >
            <div 
              className="flex items-center space-x-2 text-blue-700"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#1d4ed8'
              }}
            >
              <Lock className="w-4 h-4" style={{color: '#1d4ed8'}} />
              <span 
                className="text-sm font-medium"
                style={{
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Secure Trial Requires Credit Card
              </span>
            </div>
            <p 
              className="text-xs text-blue-600 mt-1"
              style={{
                fontSize: '0.75rem',
                color: '#2563eb',
                marginTop: '4px'
              }}
            >
              No charges during 30-day trial. Card required to prevent abuse and ensure service quality.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white"
        style={{
          padding: '5rem 1rem',
          backgroundColor: 'white'
        }}
      >
        <div 
          className="max-w-7xl mx-auto"
          style={{
            maxWidth: '80rem',
            margin: '0 auto'
          }}
        >
          <div 
            className="text-center mb-16"
            style={{
              textAlign: 'center',
              marginBottom: '4rem'
            }}
          >
            <h3 
              className="text-3xl font-bold text-slate-800 mb-4"
              style={{
                fontSize: '1.875rem',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '1rem'
              }}
            >
              Complete AI Governance Solution
            </h3>
            <p 
              className="text-xl text-slate-600 max-w-2xl mx-auto"
              style={{
                fontSize: '1.25rem',
                color: '#475569',
                maxWidth: '42rem',
                margin: '0 auto'
              }}
            >
              Comprehensive tools to manage, monitor, and secure your organization's AI interactions
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-sentinel-blue/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-sentinel-blue" />
                </div>
                <CardTitle className="text-slate-800">Security & Compliance</CardTitle>
                <CardDescription>
                  Automatic PII detection, data leakage prevention, and policy enforcement
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-sentinel-green/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-sentinel-green" />
                </div>
                <CardTitle className="text-slate-800">User Management</CardTitle>
                <CardDescription>
                  Role-based access control and comprehensive user activity tracking
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-sentinel-amber/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-sentinel-amber" />
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-slate-800 mb-6">
                Advanced Security Features
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-sentinel-green mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-800">PII Detection</h4>
                    <p className="text-slate-600">Automatically detects and blocks personally identifiable information</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-sentinel-green mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-800">Financial Data Protection</h4>
                    <p className="text-slate-600">Prevents sharing of sensitive financial information</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-sentinel-green mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-800">Real-time Monitoring</h4>
                    <p className="text-slate-600">Continuous monitoring of all AI interactions</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-sentinel-green mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-800">Configurable Policies</h4>
                    <p className="text-slate-600">Customizable governance policies for your organization</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-semibold text-slate-800">Security Alert</h4>
                <AlertTriangle className="w-5 h-5 text-sentinel-amber" />
              </div>
              <div className="space-y-4">
                <div className="bg-sentinel-amber/10 border border-sentinel-amber/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-4 h-4 text-sentinel-amber mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-sentinel-amber">Financial Data Detected</p>
                      <p className="text-sm text-slate-600">Message contains references to company financial data</p>
                    </div>
                  </div>
                </div>
                <div className="bg-sentinel-red/10 border border-sentinel-red/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Lock className="w-4 h-4 text-sentinel-red mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-sentinel-red">PII Blocked</p>
                      <p className="text-sm text-slate-600">Personal information automatically filtered</p>
                    </div>
                  </div>
                </div>
                <div className="bg-sentinel-green/10 border border-sentinel-green/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-sentinel-green mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-sentinel-green">Message Approved</p>
                      <p className="text-sm text-slate-600">Content meets security requirements</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-sentinel-blue">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-white mb-6">
            Ready to Secure Your AI Usage?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Join organizations that trust AI Sentinel for secure, compliant AI interactions.
          </p>
          <Button
            onClick={handleLogin}
            size="lg"
            variant="secondary"
            className="bg-white text-sentinel-blue hover:bg-slate-50 text-lg px-8 py-3"
          >
            Start Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-6 h-6 bg-sentinel-blue rounded-md flex items-center justify-center">
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
