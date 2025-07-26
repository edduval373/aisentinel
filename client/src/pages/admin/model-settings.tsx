import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import AdminLayout from "@/components/layout/AdminLayout";
import { Bot, Zap } from "lucide-react";
import type { AiModel } from "@shared/schema";
import DemoBanner from "@/components/DemoBanner";

export default function AdminModelSettings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Fetch AI models from database (using authentication bypass)
  const { data: aiModels, isLoading: modelsLoading } = useQuery<AiModel[]>({
    queryKey: ['/api/ai-models'],
    enabled: !isLoading,
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  const getProviderIcon = (provider: string) => {
    const iconStyle = { 
      width: '20px', 
      height: '20px', 
      marginRight: '8px',
      color: '#3b82f6'
    };
    
    switch (provider) {
      case 'anthropic':
        return <Bot style={iconStyle} />;
      case 'openai':
        return <Bot style={iconStyle} />;
      case 'perplexity':
        return <Zap style={iconStyle} />;
      default:
        return <Bot style={iconStyle} />;
    }
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'anthropic':
        return 'Anthropic';
      case 'openai':
        return 'OpenAI';
      case 'perplexity':
        return 'Perplexity';
      default:
        return provider;
    }
  };

  const getModelDescription = (provider: string) => {
    switch (provider) {
      case 'anthropic':
        return 'Advanced reasoning and analysis with constitutional AI training';
      case 'openai':
        return 'Latest multimodal model with vision and advanced reasoning capabilities';
      case 'perplexity':
        return 'Real-time web search and information retrieval with citations';
      default:
        return 'AI language model for text generation and analysis';
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || modelsLoading) {
    return (
      <AdminLayout title="Model Settings" subtitle="Configure AI model parameters and behavior">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            animation: 'spin 2s linear infinite'
          }}>
            <img 
              src="/ai-sentinel-logo.png" 
              alt="Loading..." 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                filter: 'brightness(1.2) saturate(1.4) contrast(1.1)'
              }} 
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 8px 0'
            }}>
              Loading Model Settings
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#64748b',
              margin: 0
            }}>
              Preparing your AI model configuration...
            </p>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout 
      title="Model Settings" 
      subtitle="Configure AI model parameters and behavior"
      rightContent={<DemoBanner message="Demo Mode - Read Only View - Model settings cannot be changed" />}
    >
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Dynamic AI Model Settings */}
        {aiModels?.map((model) => (
          <div key={model.id} style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '24px 24px 16px 24px',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                {getProviderIcon(model.provider)}
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: 0
                }}>
                  {model.name} Configuration
                </h3>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{
                  backgroundColor: model.isEnabled ? '#3b82f6' : '#64748b',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {model.isEnabled ? "Active" : "Disabled"}
                </span>
                <span style={{
                  fontSize: '14px',
                  color: '#64748b'
                }}>
                  {getModelDescription(model.provider)}
                </span>
              </div>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '16px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Temperature
                  </label>
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      defaultValue={model.provider === 'perplexity' ? '0.2' : '0.7'}
                      style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: '3px',
                        background: '#e2e8f0',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: '#64748b'
                    }}>
                      <span>Conservative (0.0)</span>
                      <span>Balanced ({model.provider === 'perplexity' ? '0.2' : '0.7'})</span>
                      <span>Creative (2.0)</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    defaultValue="4096"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      marginTop: '8px'
                    }}
                  />
                </div>
              </div>
            
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '16px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Top P (Nucleus Sampling)
                  </label>
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      defaultValue={model.provider === 'perplexity' ? '0.9' : '1'}
                      style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: '3px',
                        background: '#e2e8f0',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: '#64748b'
                    }}>
                      <span>Focused (0.0)</span>
                      <span>Balanced (1.0)</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    {model.provider === 'anthropic' ? 'Top K' : 'Frequency Penalty'}
                  </label>
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {model.provider === 'anthropic' ? (
                      <input
                        type="number"
                        defaultValue="40"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          backgroundColor: 'white'
                        }}
                      />
                    ) : (
                      <>
                        <input
                          type="range"
                          min="-2"
                          max="2"
                          step="0.1"
                          defaultValue="0"
                          style={{
                            width: '100%',
                            height: '6px',
                            borderRadius: '3px',
                            background: '#e2e8f0',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        />
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                          color: '#64748b'
                        }}>
                          <span>Repetitive (-2.0)</span>
                          <span>Varied (2.0)</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div style={{
                height: '1px',
                backgroundColor: '#e2e8f0',
                margin: '20px 0'
              }}></div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px'
                    }}>
                      Enable streaming responses
                    </label>
                    <p style={{
                      fontSize: '14px',
                      color: '#64748b',
                      margin: 0
                    }}>
                      Stream responses for better user experience
                    </p>
                  </div>
                  <label style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '44px',
                    height: '24px'
                  }}>
                    <input
                      type="checkbox"
                      defaultChecked={model.provider !== 'perplexity'}
                      style={{
                        opacity: 0,
                        width: 0,
                        height: 0
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: model.provider !== 'perplexity' ? '#3b82f6' : '#94a3b8',
                      borderRadius: '24px',
                      transition: '0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '',
                        height: '18px',
                        width: '18px',
                        left: model.provider !== 'perplexity' ? '23px' : '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: '0.3s'
                      }}></span>
                    </span>
                  </label>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px'
                    }}>
                      {model.provider === 'anthropic' ? 'Enable vision capabilities' : 
                       model.provider === 'perplexity' ? 'Enable web search' : 'Enable function calling'}
                    </label>
                    <p style={{
                      fontSize: '14px',
                      color: '#64748b',
                      margin: 0
                    }}>
                      {model.provider === 'anthropic' ? 'Allow image analysis and processing' : 
                       model.provider === 'perplexity' ? 'Access real-time web information' : 'Allow model to call predefined functions'}
                    </p>
                  </div>
                  <label style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '44px',
                    height: '24px'
                  }}>
                    <input
                      type="checkbox"
                      defaultChecked={model.provider === 'perplexity'}
                      style={{
                        opacity: 0,
                        width: 0,
                        height: 0
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: model.provider === 'perplexity' ? '#3b82f6' : '#94a3b8',
                      borderRadius: '24px',
                      transition: '0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '',
                        height: '18px',
                        width: '18px',
                        left: model.provider === 'perplexity' ? '23px' : '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: '0.3s'
                      }}></span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* No models message */}
        {!aiModels || aiModels.length === 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            padding: '48px 24px',
            textAlign: 'center'
          }}>
            <Bot style={{ 
              width: '48px', 
              height: '48px', 
              color: '#94a3b8', 
              margin: '0 auto 16px auto' 
            }} />
            <p style={{
              fontSize: '16px',
              color: '#64748b',
              margin: '0 0 8px 0'
            }}>
              No AI models configured yet.
            </p>
            <p style={{
              fontSize: '14px',
              color: '#94a3b8',
              margin: 0
            }}>
              Add models from the AI Models page to configure their settings.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}