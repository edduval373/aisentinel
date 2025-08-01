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
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f1f5f9 0%, #dbeafe 50%, #e2e8f0 100%)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          padding: '24px' 
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px' 
            }}>
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
                fontWeight: '600', 
                color: '#1e293b',
                margin: 0
              }}>
                AI Sentinel
              </h1>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.color = '#1e293b';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#64748b';
              }}
            >
              <X style={{ width: '16px', height: '16px' }} />
              Return to Home
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh', 
          padding: '16px' 
        }}>
          <div style={{
            width: '100%',
            maxWidth: '448px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Header Section */}
            <div style={{ 
              padding: '32px 32px 24px 32px', 
              textAlign: 'center' 
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '24px'
              }}>
                <CheckCircle2 style={{ 
                  width: '64px', 
                  height: '64px', 
                  color: '#10b981' 
                }} />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <h2 style={{ 
                  fontSize: '28px', 
                  fontWeight: '700', 
                  color: '#1e293b',
                  margin: 0,
                  marginBottom: '8px'
                }}>
                  Check Your Email
                </h2>
                <p style={{ 
                  color: '#64748b',
                  fontSize: '16px',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  We've sent a verification link to your email address
                </p>
              </div>
            </div>
            
            {/* Content Section */}
            <div style={{ padding: '0 32px 32px 32px' }}>
              <div style={{ 
                textAlign: 'center', 
                marginBottom: '24px' 
              }}>
                <p style={{ 
                  color: '#64748b',
                  fontSize: '15px',
                  margin: '0 0 16px 0',
                  lineHeight: '1.5'
                }}>
                  A verification email has been sent to:
                </p>
                <div style={{ 
                  fontWeight: '600', 
                  color: '#1e293b', 
                  background: '#f8fafc', 
                  padding: '12px 16px', 
                  borderRadius: '8px',
                  fontSize: '15px',
                  border: '1px solid #e2e8f0',
                  wordBreak: 'break-all'
                }}>
                  {email}
                </div>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#64748b',
                  margin: '16px 0 0 0',
                  lineHeight: '1.4'
                }}>
                  Click the link in the email to complete your login. The link will expire in 1 hour.
                </p>
              </div>

              {error && (
                <div style={{ 
                  background: '#fef2f2', 
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '24px',
                  color: '#dc2626',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={handleResendEmail}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: isLoading ? '#f8fafc' : 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    color: isLoading ? '#9ca3af' : '#374151',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '15px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.borderColor = '#9ca3af';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                >
                  {isLoading ? (
                    <>
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        animation: 'spin 1s linear infinite' 
                      }}>
                        <img 
                          src="/ai-sentinel-logo.png" 
                          alt="Loading" 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'contain',
                            filter: 'brightness(1.1) saturate(1.3) contrast(1.2)'
                          }} 
                        />
                      </div>
                      Resending...
                      <style>{`
                        @keyframes spin {
                          0% { transform: rotate(0deg); }
                          100% { transform: rotate(360deg); }
                        }
                      `}</style>
                    </>
                  ) : (
                    <>
                      <Mail style={{ width: '16px', height: '16px' }} />
                      Resend Verification Email
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail("");
                    setError("");
                  }}
                  style={{
                    width: '100%',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.color = '#1e293b';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#64748b';
                  }}
                >
                  <ArrowLeft style={{ width: '16px', height: '16px' }} />
                  Use Different Email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f1f5f9 0%, #e0f2fe 50%, #e2e8f0 100%)' 
    }}>
      {/* Header */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        padding: '24px' 
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
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
            }}>AI Sentinel</h1>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.location.href = '/'}
            style={{ 
              color: '#64748b', 
              padding: '8px 12px', 
              border: 'none', 
              background: 'transparent' 
            }}
          >
            <X style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            Back to Home
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        padding: '16px' 
      }}>
        <Card style={{ 
          width: '100%', 
          maxWidth: '448px', 
          backgroundColor: 'white', 
          boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', 
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <CardHeader style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '24px', 
            textAlign: 'center', 
            paddingTop: '32px', 
            paddingBottom: '24px',
            paddingLeft: '32px',
            paddingRight: '32px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src="/ai-sentinel-logo.png" 
                alt="AI Sentinel" 
                style={{ 
                  width: '64px', 
                  height: '64px', 
                  objectFit: 'contain',
                  flexShrink: 0
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <CardTitle style={{ 
                fontSize: '24px', 
                fontWeight: 700, 
                color: '#0f172a' 
              }}>Welcome to AI Sentinel</CardTitle>
              <CardDescription style={{ color: '#64748b' }}>
                Enter your email address to get started
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent style={{ 
            paddingLeft: '32px', 
            paddingRight: '32px', 
            paddingBottom: '32px' 
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Label htmlFor="email" style={{ 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: '#374151' 
                }}>Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    height: '48px',
                    padding: '0 16px',
                    fontSize: '14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    backgroundColor: 'white'
                  }}
                />
              </div>

              {error && (
                <Alert variant="destructive" style={{ fontSize: '14px' }}>
                  <AlertDescription style={{ color: '#dc2626' }}>{error}</AlertDescription>
                </Alert>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    height: '48px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    fontWeight: 500,
                    borderRadius: '6px',
                    border: 'none',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isLoading ? (
                    <>
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        animation: 'spin 1s linear infinite' 
                      }}>
                        <img 
                          src="/ai-sentinel-logo.png" 
                          alt="Loading" 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'contain',
                            filter: 'brightness(1.1) saturate(1.3) contrast(1.2)'
                          }} 
                        />
                      </div>
                      Sending Verification...
                      <style>{`
                        @keyframes spin {
                          0% { transform: rotate(0deg); }
                          100% { transform: rotate(360deg); }
                        }
                      `}</style>
                    </>
                  ) : (
                    <>
                      <Mail style={{ width: '16px', height: '16px' }} />
                      Send Verification Email
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    console.log("[LOGIN DEBUG] Demo button clicked");
                    window.location.href = '/demo';
                  }}
                  style={{
                    width: '100%',
                    height: '48px',
                    border: '1px solid #d1d5db',
                    color: '#374151',
                    backgroundColor: 'white',
                    fontWeight: 500,
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Continue to Chat (Demo Mode)
                </Button>
              </div>
            </form>

            <div style={{ 
              marginTop: '32px', 
              textAlign: 'center', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px', 
              fontSize: '14px', 
              color: '#64748b' 
            }}>
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