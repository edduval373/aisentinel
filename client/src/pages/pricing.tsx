import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard, Shield, Users, BarChart3, Lock, Star, Zap } from "lucide-react";
import { Link } from "wouter";

export default function PricingPage() {
  const handleSignUp = (planName: string) => {
    // Redirect to login with plan parameter
    window.location.href = `/login?plan=${planName}`;
  };

  const plans = [
    {
      name: "trial",
      displayName: "30-Day Free Trial",
      price: "$0",
      billing: "/30 days",
      description: "Perfect for testing AI Sentinel with your team",
      maxUsers: "1 user",
      dailyLimit: "10 requests/day",
      monthlyLimit: "100 total requests",
      requiresCreditCard: true,
      popular: false,
      features: [
        "100 AI interactions during trial",
        "Basic chat interface",
        "All AI models (OpenAI, Anthropic, Perplexity)",
        "File upload support",
        "Email support",
        "No setup fees"
      ],
      restrictions: [
        "Credit card required (no charges during trial)",
        "Automatic upgrade prompt at trial end",
        "Single user access only"
      ]
    },
    {
      name: "personal",
      displayName: "Personal Plan",
      price: "$9.99",
      billing: "/month",
      description: "Ideal for individual professionals and consultants",
      maxUsers: "1 user",
      dailyLimit: "100 requests/day",
      monthlyLimit: "2,000 requests/month",
      requiresCreditCard: true,
      popular: true,
      features: [
        "2,000 AI interactions/month",
        "All AI models and features",
        "Advanced file processing",
        "Priority email support",
        "Usage analytics",
        "API access"
      ],
      restrictions: [
        "Single user only",
        "No admin dashboard",
        "Limited to personal use"
      ]
    },
    {
      name: "company",
      displayName: "Company Plan",
      price: "$50",
      billing: "/month",
      description: "Complete solution for teams and organizations",
      maxUsers: "Unlimited users",
      dailyLimit: "1,000 requests/day",
      monthlyLimit: "20,000 requests/month",
      requiresCreditCard: true,
      popular: false,
      features: [
        "20,000 AI interactions/month",
        "Unlimited team members",
        "Company branding and logo",
        "Role-based access control",
        "API key management",
        "Admin dashboard and monitoring",
        "Content filtering and security",
        "Priority support with SLA",
        "Usage analytics and reporting",
        "Custom activity types",
        "Model fusion capabilities"
      ],
      restrictions: [
        "Requires company domain verification",
        "Minimum 5 users for optimization"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <div className="w-8 h-8 bg-sentinel-blue rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold text-slate-800">AI Sentinel</h1>
              </div>
            </Link>
            <Button 
              onClick={() => window.location.href = "/login"} 
              className="bg-sentinel-blue hover:bg-blue-600"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            Choose Your AI Governance Plan
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Secure, compliant AI access with transparent pricing. All plans include credit card validation for security.
          </p>
          
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-8">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              All plans require credit card validation to prevent abuse
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card 
                key={plan.name} 
                className={`relative border-2 hover:shadow-lg transition-all duration-200 ${
                  plan.popular ? 'border-blue-500 shadow-lg' : 'border-slate-200'
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center mb-4">
                    {plan.name === 'trial' && <Zap className="w-8 h-8 text-blue-500" />}
                    {plan.name === 'personal' && <Users className="w-8 h-8 text-blue-500" />}
                    {plan.name === 'company' && <BarChart3 className="w-8 h-8 text-blue-500" />}
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.displayName}</CardTitle>
                  <CardDescription className="text-slate-600">{plan.description}</CardDescription>
                  
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-slate-800">{plan.price}</span>
                    <span className="text-slate-600">{plan.billing}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-slate-800">{plan.maxUsers}</div>
                      <div className="text-slate-600">Users</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-slate-800">{plan.monthlyLimit}</div>
                      <div className="text-slate-600">Monthly</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <Button 
                    className={`w-full mb-6 ${
                      plan.popular 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                    onClick={() => handleSignUp(plan.name)}
                  >
                    {plan.name === 'trial' ? 'Start Free Trial' : 'Get Started'}
                    {plan.requiresCreditCard && <Lock className="ml-2 w-4 h-4" />}
                  </Button>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-800 border-b pb-2">Features Included:</h4>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{feature}</span>
                      </div>
                    ))}
                    
                    {plan.restrictions.length > 0 && (
                      <>
                        <h4 className="font-semibold text-slate-800 border-b pb-2 mt-6">Important Notes:</h4>
                        {plan.restrictions.map((restriction, idx) => (
                          <div key={idx} className="flex items-start space-x-2">
                            <CreditCard className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-slate-600">{restriction}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Notice */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
            <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              Why We Require Credit Card Validation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Prevent Abuse</h4>
                <p className="text-slate-600 text-sm">
                  Credit card validation prevents automated abuse and ensures fair usage for all users.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Service Quality</h4>
                <p className="text-slate-600 text-sm">
                  Verified users help us maintain high-quality AI service and prevent system overload.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Security Standards</h4>
                <p className="text-slate-600 text-sm">
                  Enterprise-grade security requires identity verification for compliance and audit trails.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">No Hidden Charges</h4>
                <p className="text-slate-600 text-sm">
                  We never charge during trials. Cards are validated only and charged according to plan terms.
                </p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-white border border-blue-200 rounded-lg">
              <p className="text-sm text-slate-700">
                <strong>🔒 Secure:</strong> All payment information is processed through Stripe. 
                We never store your credit card details on our servers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 AI Sentinel. All rights reserved.</p>
          <p className="text-slate-400 text-sm mt-2">
            Enterprise AI governance with security and compliance built-in.
          </p>
        </div>
      </footer>
    </div>
  );
}