import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle2, Loader2, X, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import iconPath from "@assets/icononly_nobuffer_1752067577689.png";

// AI Sentinel Logo Component
const AISentinelIcon = ({ className = "w-16 h-16" }) => (
  <img 
    src={iconPath} 
    alt="AI Sentinel" 
    className={className}
  />
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest("/api/auth/request-verification", "POST", { email });
      
      if (response.success) {
        setEmailSent(true);
        toast({
          title: "Verification Email Sent",
          description: "Please check your email and click the verification link to continue.",
        });
      } else {
        setError(response.message || "Failed to send verification email");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await apiRequest("/api/auth/request-verification", "POST", { email });
      
      if (response.success) {
        toast({
          title: "Verification Email Resent",
          description: "Please check your email for the new verification link.",
        });
      } else {
        setError(response.message || "Failed to resend verification email");
      }
    } catch (error: any) {
      console.error("Resend error:", error);
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <AISentinelIcon className="w-10 h-10" />
                <h1 className="text-xl font-bold text-slate-800">AI Sentinel</h1>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.close()}
                className="text-slate-600 hover:text-slate-900"
              >
                <X className="w-4 h-4 mr-2" />
                Exit
              </Button>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex items-center justify-center p-4 pt-20">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <div className="flex items-center justify-center mb-4">
                <AISentinelIcon className="w-16 h-16" />
              </div>
              <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
              <CardDescription>
                We've sent a verification link to your email address
              </CardDescription>
            </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <p className="text-gray-600 mb-2">
                A verification email has been sent to:
              </p>
              <p className="font-semibold text-gray-800 mb-4">{email}</p>
              <p className="text-sm text-gray-500 mb-6">
                Click the link in the email to complete your login. The link will expire in 1 hour.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleResendEmail}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                  setError("");
                }}
                variant="ghost"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Use Different Email
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <AISentinelIcon className="w-10 h-10" />
              <h1 className="text-xl font-bold text-slate-800">AI Sentinel</h1>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.close()}
              className="text-slate-600 hover:text-slate-900"
            >
              <X className="w-4 h-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex items-center justify-center p-4 pt-20">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center mb-4">
              <AISentinelIcon className="w-16 h-16" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome to AI Sentinel</CardTitle>
            <CardDescription>
              Enter your email address to get started
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Verification...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Verification Email
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              We'll send you a secure link to verify your email address.
            </p>
            <p className="mt-2">
              If you're part of a company, you'll automatically get access to your company's AI tools.
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}