import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function VerificationSuccess() {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const verifyToken = async () => {
      // Get token from URL parameters
      const urlParams = new URLSearchParams(location.split('?')[1]);
      const token = urlParams.get('token');

      if (!token) {
        setError("No verification token found");
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiRequest(`/api/auth/verify?token=${token}`, "GET");
        
        if (response.success) {
          setIsSuccess(true);
          setUserInfo(response.user);
          
          // Redirect to main app after a short delay
          setTimeout(() => {
            setLocation("/");
          }, 2000);
        } else {
          setError(response.message || "Verification failed");
        }
      } catch (error: any) {
        console.error("Verification error:", error);
        setError(error.message || "An error occurred during verification");
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  animation: 'spin 2s linear infinite' 
                }}>
                  <img 
                    src="/ai-sentinel-logo.png" 
                    alt="AI Sentinel" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain',
                      filter: 'brightness(1.1) saturate(1.3) contrast(1.2)'
                    }} 
                  />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2">Verifying Your Email</h2>
              <p className="text-gray-600">Please wait while we verify your account...</p>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Verification Failed</CardTitle>
            <CardDescription>
              There was a problem verifying your email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button
                onClick={() => setLocation("/login")}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Email Verified!</CardTitle>
          <CardDescription>
            Your account has been successfully verified
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Welcome to AI Sentinel! You're all set to get started.
            </p>
            
            {userInfo && (
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700">
                  <strong>Email:</strong> {userInfo.email}
                </p>
                {userInfo.companyId && (
                  <p className="text-sm text-gray-700">
                    <strong>Company:</strong> {userInfo.companyName || `Company ${userInfo.companyId}`}
                  </p>
                )}
                <p className="text-sm text-gray-700">
                  <strong>Access Level:</strong> {userInfo.role || 'User'}
                </p>
              </div>
            )}

            <p className="text-sm text-gray-500 mb-6">
              You'll be automatically redirected to the main application in a few seconds.
            </p>
          </div>

          <Button
            onClick={() => setLocation("/")}
            className="w-full"
          >
            Continue to AI Sentinel
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}