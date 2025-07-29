import { CheckCircle, CreditCard, Shield, Users, BarChart3, Lock, Star, Zap, AlertCircle } from "lucide-react";
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
      name: "company",
      displayName: "Company Plan",
      price: "$50",
      billing: "/month",
      description: "Complete solution for teams up to 50 employees",
      maxUsers: "Up to 50 employees",
      dailyLimit: "Unlimited requests/day",
      monthlyLimit: "Unlimited requests/month",
      requiresCreditCard: true,
      popular: true,
      features: [
        "Unlimited AI interactions (your API keys)",
        "Up to 50 team members included",
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
        "Requires company-provided API keys",
        "Domain verification required"
      ]
    },
    {
      name: "enterprise",
      displayName: "Enterprise Plan",
      price: "$100",
      billing: "/month",
      description: "Scalable solution for large organizations",
      maxUsers: "51+ employees",
      dailyLimit: "Unlimited requests/day",
      monthlyLimit: "Unlimited requests/month",
      requiresCreditCard: true,
      popular: false,
      features: [
        "Unlimited AI interactions (your API keys)",
        "Unlimited team members",
        "Company branding and logo",
        "Advanced role-based access control",
        "API key management",
        "Admin dashboard and monitoring",
        "Advanced content filtering and security",
        "Priority support with SLA",
        "Advanced usage analytics and reporting",
        "Custom activity types",
        "Model fusion capabilities",
        "Custom integrations",
        "Dedicated account manager"
      ],
      restrictions: [
        "Requires company-provided API keys",
        "Domain verification required"
      ]
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px'
          }}>
            <Link href="/">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: 'hsl(221, 83%, 53%)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Shield style={{ width: '16px', height: '16px', color: 'white' }} />
                </div>
                <h1 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: 0
                }}>AI Sentinel</h1>
              </div>
            </Link>
            <button 
              onClick={() => window.location.href = "/login"}
              style={{
                backgroundColor: 'hsl(221, 83%, 53%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                fontFamily: 'inherit'
              }}
              onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'hsl(221, 83%, 53%)'}
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '32px 16px',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto'
        }}>
          <h2 style={{
            fontSize: '40px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '12px',
            lineHeight: '1.1'
          }}>
            Choose Your AI Governance Plan
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#475569',
            marginBottom: '20px',
            maxWidth: '768px',
            margin: '0 auto 20px auto',
            lineHeight: '1.5'
          }}>
            Secure, compliant AI access with transparent pricing. All plans include credit card validation for security.
          </p>
          
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px'
          }}>
            <CreditCard style={{ width: '16px', height: '16px', color: '#2563eb' }} />
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#1d4ed8'
            }}>
              All plans require credit card validation to prevent abuse
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section style={{
        padding: '24px 16px'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
            minHeight: '550px'
          }}>
            {plans.map((plan) => (
              <div 
                key={plan.name} 
                style={{
                  position: 'relative',
                  backgroundColor: 'white',
                  border: plan.popular ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: plan.popular ? '0 10px 25px rgba(59, 130, 246, 0.1)' : '0 4px 12px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = plan.popular ? '0 10px 25px rgba(59, 130, 246, 0.1)' : '0 4px 12px rgba(0,0,0,0.05)';
                }}
              >
                {plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Star style={{ width: '12px', height: '12px' }} />
                    Most Popular
                  </div>
                )}
                
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '12px'
                  }}>
                    {plan.name === 'trial' && <Zap style={{ width: '32px', height: '32px', color: '#3b82f6' }} />}
                    {plan.name === 'company' && <Users style={{ width: '32px', height: '32px', color: '#3b82f6' }} />}
                    {plan.name === 'enterprise' && <BarChart3 style={{ width: '32px', height: '32px', color: '#3b82f6' }} />}
                  </div>
                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: '700',
                    color: '#1e293b',
                    marginBottom: '6px'
                  }}>{plan.displayName}</h3>
                  <p style={{
                    color: '#64748b',
                    fontSize: '14px',
                    lineHeight: '1.4',
                    marginBottom: '12px'
                  }}>{plan.description}</p>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{
                      fontSize: '32px',
                      fontWeight: '700',
                      color: '#1e293b'
                    }}>{plan.price}</span>
                    <span style={{
                      color: '#64748b',
                      fontSize: '16px'
                    }}>{plan.billing}</span>
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    fontSize: '14px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontWeight: '600',
                        color: '#1e293b',
                        marginBottom: '2px'
                      }}>{plan.maxUsers}</div>
                      <div style={{ color: '#64748b' }}>Users</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontWeight: '600',
                        color: '#1e293b',
                        marginBottom: '2px'
                      }}>{plan.monthlyLimit}</div>
                      <div style={{ color: '#64748b' }}>Monthly</div>
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  marginTop: plan.name === 'trial' ? '40px' : (plan.popular ? '12px' : 'auto') 
                }}>
                  <button 
                    style={{
                      width: '100%',
                      backgroundColor: plan.name === 'trial' ? '#3b82f6' : (plan.popular ? '#3b82f6' : '#f1f5f9'),
                      color: plan.name === 'trial' ? 'white' : (plan.popular ? 'white' : '#1e293b'),
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontFamily: 'inherit'
                    }}
                    onClick={() => handleSignUp(plan.name)}
                    onMouseOver={(e) => {
                      const target = e.target as HTMLButtonElement;
                      if (plan.name === 'trial' || plan.popular) {
                        target.style.backgroundColor = '#2563eb';
                      } else {
                        target.style.backgroundColor = '#e2e8f0';
                      }
                    }}
                    onMouseOut={(e) => {
                      const target = e.target as HTMLButtonElement;
                      if (plan.name === 'trial' || plan.popular) {
                        target.style.backgroundColor = '#3b82f6';
                      } else {
                        target.style.backgroundColor = '#f1f5f9';
                      }
                    }}
                  >
                    {plan.name === 'trial' ? 'Start Free Trial' : 'Get Started'}
                    {plan.requiresCreditCard && <Lock style={{ width: '16px', height: '16px' }} />}
                  </button>
                  
                  <div>
                    <h4 style={{
                      fontWeight: '600',
                      color: '#1e293b',
                      borderBottom: '1px solid #e2e8f0',
                      paddingBottom: '6px',
                      marginBottom: '12px',
                      fontSize: '14px'
                    }}>Features Included:</h4>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        marginBottom: '6px'
                      }}>
                        <CheckCircle style={{
                          width: '16px',
                          height: '16px',
                          color: '#10b981',
                          marginTop: '2px',
                          flexShrink: 0
                        }} />
                        <span style={{
                          fontSize: '14px',
                          color: '#1e293b',
                          lineHeight: '1.4'
                        }}>{feature}</span>
                      </div>
                    ))}
                    
                    {plan.restrictions.length > 0 && (
                      <>
                        <h4 style={{
                          fontWeight: '600',
                          color: '#1e293b',
                          borderBottom: '1px solid #e2e8f0',
                          paddingBottom: '6px',
                          marginBottom: '12px',
                          marginTop: '16px',
                          fontSize: '14px'
                        }}>Important Notes:</h4>
                        {plan.restrictions.map((restriction, idx) => (
                          <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            marginBottom: '6px'
                          }}>
                            <AlertCircle style={{
                              width: '16px',
                              height: '16px',
                              color: '#f59e0b',
                              marginTop: '2px',
                              flexShrink: 0
                            }} />
                            <span style={{
                              fontSize: '14px',
                              color: '#64748b',
                              lineHeight: '1.4'
                            }}>{restriction}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                  
                  <div>
                    <h4 style={{
                      fontWeight: '600',
                      color: '#1e293b',
                      borderBottom: '1px solid #e2e8f0',
                      paddingBottom: '6px',
                      marginBottom: '12px',
                      fontSize: '14px'
                    }}>Features Included:</h4>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        marginBottom: '6px'
                      }}>
                        <CheckCircle style={{
                          width: '16px',
                          height: '16px',
                          color: '#22c55e',
                          marginTop: '2px',
                          flexShrink: 0
                        }} />
                        <span style={{
                          fontSize: '14px',
                          color: '#374151',
                          lineHeight: '1.4'
                        }}>{feature}</span>
                      </div>
                    ))}
                    
                    {plan.restrictions.length > 0 && (
                      <>
                        <h4 style={{
                          fontWeight: '600',
                          color: '#1e293b',
                          borderBottom: '1px solid #e2e8f0',
                          paddingBottom: '6px',
                          marginBottom: '12px',
                          marginTop: '16px',
                          fontSize: '14px'
                        }}>Important Notes:</h4>
                        {plan.restrictions.map((restriction, idx) => (
                          <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            marginBottom: '6px'
                          }}>
                            <CreditCard style={{
                              width: '16px',
                              height: '16px',
                              color: '#3b82f6',
                              marginTop: '2px',
                              flexShrink: 0
                            }} />
                            <span style={{
                              fontSize: '14px',
                              color: '#64748b',
                              lineHeight: '1.4'
                            }}>{restriction}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Notice */}
      <section style={{
        padding: '32px 16px',
        backgroundColor: 'white'
      }}>
        <div style={{
          maxWidth: '1024px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <Shield style={{
              width: '48px',
              height: '48px',
              color: '#2563eb',
              margin: '0 auto 16px auto'
            }} />
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '12px'
            }}>
              Why We Require Credit Card Validation
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px',
              textAlign: 'left',
              marginBottom: '16px'
            }}>
              <div>
                <h4 style={{
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '8px',
                  fontSize: '16px'
                }}>Prevent Abuse</h4>
                <p style={{
                  color: '#64748b',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  Credit card validation prevents automated abuse and ensures fair usage for all users.
                </p>
              </div>
              <div>
                <h4 style={{
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '8px',
                  fontSize: '16px'
                }}>Service Quality</h4>
                <p style={{
                  color: '#64748b',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  Verified users help us maintain high-quality AI service and prevent system overload.
                </p>
              </div>
              <div>
                <h4 style={{
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '8px',
                  fontSize: '16px'
                }}>Security Standards</h4>
                <p style={{
                  color: '#64748b',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  Enterprise-grade security requires identity verification for compliance and audit trails.
                </p>
              </div>
              <div>
                <h4 style={{
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '8px',
                  fontSize: '16px'
                }}>No Hidden Charges</h4>
                <p style={{
                  color: '#64748b',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  We never charge during trials. Cards are validated only and charged according to plan terms.
                </p>
              </div>
            </div>
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #bfdbfe',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <p style={{
                fontSize: '14px',
                color: '#374151',
                margin: 0,
                lineHeight: '1.5'
              }}>
                <strong>🔒 Secure:</strong> All payment information is processed through Stripe. 
                We never store your credit card details on our servers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#1e293b',
        color: 'white',
        padding: '24px 16px',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto'
        }}>
          <p style={{
            margin: '0 0 8px 0',
            fontSize: '16px'
          }}>&copy; 2025 AI Sentinel. All rights reserved.</p>
          <p style={{
            color: '#94a3b8',
            fontSize: '14px',
            margin: 0
          }}>
            Enterprise AI governance with security and compliance built-in.
          </p>
        </div>
      </footer>
    </div>
  );
}