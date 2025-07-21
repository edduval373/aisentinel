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
      console.log("Making request to:", "/api/auth/request-verification", "with email:", email);
      const response = await apiRequest("/api/auth/request-verification", "POST", { email });
      console.log("Response received:", response);
      
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
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
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
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/ai-sentinel-logo.png" 
                alt="AI Sentinel" 
                className="w-10 h-10 object-contain"
                style={{maxWidth: "40px", maxHeight: "40px"}}
              />
              <h1 className="text-xl font-semibold text-slate-800">AI Sentinel</h1>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.location.href = '/'}
              className="text-slate-600 hover:text-slate-900"
            >
              <X className="w-4 h-4 mr-2" />
              Continue to Chat
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md bg-white shadow-xl">
            <CardHeader className="space-y-6 text-center pt-8 pb-6">
              <div className="flex items-center justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-slate-900">Check Your Email</CardTitle>
                <CardDescription className="text-slate-600">
                  We've sent a verification link to your email address
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="text-center space-y-4 mb-6">
                <p className="text-slate-600">
                  A verification email has been sent to:
                </p>
                <p className="font-semibold text-slate-900 bg-slate-50 px-4 py-2 rounded-md">{email}</p>
                <p className="text-sm text-slate-500">
                  Click the link in the email to complete your login. The link will expire in 1 hour.
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-6 text-sm">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Button
                  onClick={handleResendEmail}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full h-12 border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-md"
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
                  className="w-full h-12 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium rounded-md"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/ai-sentinel-logo.png" 
              alt="AI Sentinel" 
              className="w-10 h-10 object-contain"
              style={{maxWidth: "40px", maxHeight: "40px"}}
            />
            <h1 className="text-xl font-semibold text-slate-800">AI Sentinel</h1>
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
      
      {/* Content */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md bg-white shadow-xl">
          <CardHeader className="space-y-6 text-center pt-8 pb-6">
            <div className="flex items-center justify-center">
              <img 
                src="/ai-sentinel-logo.png" 
                alt="AI Sentinel" 
                className="w-16 h-16 object-contain"
                style={{maxWidth: "64px", maxHeight: "64px"}}
              />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-slate-900">Welcome to AI Sentinel</CardTitle>
              <CardDescription className="text-slate-600">
                Enter your email address to get started
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-12 px-4 text-sm border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {error && (
                <Alert variant="destructive" className="text-sm">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
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
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="w-full h-12 border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-md"
                >
                  Continue to Chat (Demo Mode)
                </Button>
              </div>
            </form>

            <div className="mt-8 text-center space-y-3 text-sm text-slate-500">
              <p>
                We'll send you a secure link to verify your email address.
              </p>
              <p>
                If you're part of a company, you'll automatically get access to your company's AI tools.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}