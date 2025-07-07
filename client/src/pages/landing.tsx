import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, BarChart3, Lock, CheckCircle, AlertTriangle } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-sentinel-blue rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">AI Sentinel</h1>
            </div>
            <Button onClick={handleLogin} className="bg-sentinel-blue hover:bg-blue-600">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-slate-800 mb-6">
            Enterprise AI
            <span className="text-sentinel-blue"> Governance</span>
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Secure, compliant, and monitored AI interactions for your organization. 
            Control AI usage while maintaining productivity and security.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleLogin}
              size="lg"
              className="bg-sentinel-blue hover:bg-blue-600 text-lg px-8 py-3"
            >
              Get Started
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-3 border-sentinel-blue text-sentinel-blue hover:bg-sentinel-blue hover:text-white"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-slate-800 mb-4">
              Complete AI Governance Solution
            </h3>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
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
