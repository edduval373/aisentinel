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
      <section className="ai-sentinel-features">
        <div className="ai-sentinel-features-container">
          <div className="ai-sentinel-features-header">
            <h3 className="ai-sentinel-features-title">
              Complete AI Governance Solution
            </h3>
            <p className="ai-sentinel-features-subtitle">
              Comprehensive tools to manage, monitor, and secure your organization's AI interactions
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-slate-800">Security & Compliance</CardTitle>
                <CardDescription>
                  Automatic PII detection, data leakage prevention, and policy enforcement
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-slate-800">User Management</CardTitle>
                <CardDescription>
                  Role-based access control and comprehensive user activity tracking
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-yellow-600" />
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
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-800">PII Detection</h4>
                    <p className="text-slate-600">Automatically detects and blocks personally identifiable information</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-800">Financial Data Protection</h4>
                    <p className="text-slate-600">Prevents sharing of sensitive financial information</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-800">Real-time Monitoring</h4>
                    <p className="text-slate-600">Continuous monitoring of all AI interactions</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
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
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-700">Financial Data Detected</p>
                      <p className="text-sm text-slate-600">Message contains references to company financial data</p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Lock className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-700">PII Blocked</p>
                      <p className="text-sm text-slate-600">Personal information automatically filtered</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-700">Message Approved</p>
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
