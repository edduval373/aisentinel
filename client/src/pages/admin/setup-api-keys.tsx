import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button-standard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card-standard";
import { Input } from "@/components/ui/input-standard";
import { Label } from "@/components/ui/label-standard";
import { Badge } from "@/components/ui/badge-standard";
import { Key, Shield, Zap, Globe, Save, TestTube, AlertCircle, Check, X } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { hasAccessLevel, canViewAdminPage, ACCESS_REQUIREMENTS } from "@/utils/roleBasedAccess";
import { useAuth } from "@/hooks/useAuth";
import type { AiModel } from "@shared/schema";
import DemoBanner from "@/components/DemoBanner";

export default function SetupApiKeys() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Check if user has owner level access (99 or above)
  const hasOwnerAccess = canViewAdminPage(user?.roleLevel, ACCESS_REQUIREMENTS.SETUP_API_KEYS);
  const [isTestingConnection, setIsTestingConnection] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | null>>({});
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

  // Fetch AI models to get current API keys
  const { data: aiModels, isLoading: modelsLoading } = useQuery<AiModel[]>({
    queryKey: ['/api/ai-models'],
  });

  // Initialize API keys from models
  useEffect(() => {
    if (aiModels) {
      const keys: Record<string, string> = {};
      aiModels.forEach(model => {
        if (model.provider === 'openai' && !keys.openai) {
          keys.openai = model.apiKey || '';
        } else if (model.provider === 'anthropic' && !keys.anthropic) {
          keys.anthropic = model.apiKey || '';
        } else if (model.provider === 'perplexity' && !keys.perplexity) {
          keys.perplexity = model.apiKey || '';
        } else if (model.provider === 'google' && !keys.google) {
          keys.google = model.apiKey || '';
        } else if (model.provider === 'cohere' && !keys.cohere) {
          keys.cohere = model.apiKey || '';
        } else if (model.provider === 'mistral' && !keys.mistral) {
          keys.mistral = model.apiKey || '';
        }
      });
      setApiKeys(keys);
    }
  }, [aiModels]);

  // Update API key mutation
  const updateApiKeyMutation = useMutation({
    mutationFn: async ({ provider, apiKey }: { provider: string; apiKey: string }) => {
      return apiRequest(`/api/admin/update-api-key`, "POST", { provider, apiKey });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-models'] });
      toast({
        title: "Success",
        description: "API key updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update API key",
        variant: "destructive",
      });
    },
  });

  const apiProviders = [
    {
      id: "openai",
      name: "OpenAI",
      icon: Zap,
      description: "GPT models for text generation and conversation",
      keyPlaceholder: "sk-proj-...",
      models: aiModels?.filter(m => m.provider === 'openai') || [],
      instructions: "Get your API key from platform.openai.com/api-keys"
    },
    {
      id: "anthropic", 
      name: "Anthropic",
      icon: Shield,
      description: "Claude models for reasoning and analysis",
      keyPlaceholder: "sk-ant-...",
      models: aiModels?.filter(m => m.provider === 'anthropic') || [],
      instructions: "Get your API key from console.anthropic.com/keys"
    },
    {
      id: "perplexity",
      name: "Perplexity",
      icon: Globe,
      description: "Real-time search and information retrieval",
      keyPlaceholder: "pplx-...",
      models: aiModels?.filter(m => m.provider === 'perplexity') || [],
      instructions: "Get your API key from perplexity.ai/settings/api"
    },
    {
      id: "google",
      name: "Google",
      icon: Globe,
      description: "Gemini models for multimodal AI capabilities",
      keyPlaceholder: "AIza...",
      models: aiModels?.filter(m => m.provider === 'google') || [],
      instructions: "Get your API key from console.cloud.google.com"
    },
    {
      id: "cohere",
      name: "Cohere",
      icon: Zap,
      description: "Command models for enterprise applications",
      keyPlaceholder: "co-...",
      models: aiModels?.filter(m => m.provider === 'cohere') || [],
      instructions: "Get your API key from dashboard.cohere.ai"
    },
    {
      id: "mistral",
      name: "Mistral AI",
      icon: Zap,
      description: "Open-source and commercial language models",
      keyPlaceholder: "...",
      models: aiModels?.filter(m => m.provider === 'mistral') || [],
      instructions: "Get your API key from console.mistral.ai"
    }
  ];

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
    // Reset test result and error message when API key changes
    setTestResults(prev => ({ ...prev, [provider]: null }));
    setErrorMessages(prev => ({ ...prev, [provider]: '' }));
  };

  const handleSaveApiKey = (provider: string) => {
    const apiKey = apiKeys[provider];
    if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('placeholder-')) {
      toast({
        title: "Invalid API Key",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }
    updateApiKeyMutation.mutate({ provider, apiKey: apiKey.trim() });
  };

  const testConnection = async (provider: string) => {
    const apiKey = apiKeys[provider];
    console.log('testConnection called for provider:', provider, 'apiKey length:', apiKey?.length);
    
    if (!apiKey || apiKey.startsWith('placeholder-') || apiKey.includes('$')) {
      console.log('Invalid API key detected');
      setTestResults(prev => ({ ...prev, [provider]: 'error' }));
      setErrorMessages(prev => ({ ...prev, [provider]: "Please enter a real API key (not placeholder or environment variable)" }));
      return;
    }

    console.log('Setting testing state for provider:', provider);
    setIsTestingConnection(provider);
    
    try {
      console.log(`Testing ${provider} API key connection...`);
      const response = await apiRequest(`/api/admin/test-api-key`, "POST", { provider, apiKey });
      console.log('Test connection response:', response);
      
      setTestResults(prev => ({ ...prev, [provider]: 'success' }));
      setErrorMessages(prev => ({ ...prev, [provider]: `${provider.charAt(0).toUpperCase() + provider.slice(1)} API key format is valid` }));
    } catch (error: any) {
      console.error('Test connection error:', error);
      setTestResults(prev => ({ ...prev, [provider]: 'error' }));
      
      // More detailed error handling
      let errorMessage = "Connection test failed";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.status === 401) {
        errorMessage = "Authentication failed - insufficient permissions";
      } else if (error.status === 400) {
        errorMessage = "Invalid API key format";
      } else if (error.status === 403) {
        errorMessage = "Owner access required to test API keys";
      }
      
      setErrorMessages(prev => ({ ...prev, [provider]: errorMessage }));
    } finally {
      console.log('Clearing testing state for provider:', provider);
      setIsTestingConnection(null);
    }
  };

  const getConnectionStatus = (provider: any) => {
    const hasValidKey = apiKeys[provider.id] && !apiKeys[provider.id].startsWith('placeholder-');
    return hasValidKey ? "connected" : "needs-key";
  };

  // Check access control first
  if (!hasOwnerAccess) {
    return (
      <AdminLayout title="Setup API Keys" subtitle="Configure AI provider API keys">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '256px',
          gap: '16px'
        }}>
          <Shield style={{ width: '48px', height: '48px', color: '#ef4444' }} />
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>
              Access Denied
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              Owner access required (level 99+)
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (modelsLoading) {
    return (
      <AdminLayout title="Setup API Keys" subtitle="Configure AI provider API keys">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '256px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
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
          <p style={{ fontSize: '16px', color: '#64748b' }}>
            Loading API configuration...
          </p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Setup API Keys" 
      subtitle="Configure AI provider API keys"
      rightContent={<DemoBanner message="Demo Mode - Read Only View - API keys cannot be modified" />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Instructions */}
        <Card style={{ border: '1px solid #bfdbfe', backgroundColor: '#eff6ff' }}>
          <CardContent style={{ paddingTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <AlertCircle style={{ width: '20px', height: '20px', color: '#2563eb', marginTop: '2px' }} />
              <div>
                <h3 style={{ fontWeight: '500', color: '#1e3a8a', margin: '0 0 4px 0' }}>Company API Key Management</h3>
                <p style={{ fontSize: '14px', color: '#1d4ed8', margin: '0', lineHeight: '1.5' }}>
                  As a company owner, you can configure API keys for all AI providers. These keys will be used by your company for AI model functionality.
                  Make sure to use valid, working API keys to enable AI features for your organization.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Provider Cards - Grid Layout */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '24px',
          marginTop: '24px'
        }}>
          {apiProviders.map((provider) => {
            const status = getConnectionStatus(provider);
            const currentKey = apiKeys[provider.id] || '';
            const isPlaceholder = currentKey.startsWith('placeholder-') || currentKey === '';
            
            return (
              <Card 
                key={provider.name} 
                style={{ 
                  border: isPlaceholder ? '1px solid #fecaca' : '1px solid #bbf7d0',
                  backgroundColor: isPlaceholder ? '#fef2f2' : '#f0fdf4',
                  height: 'fit-content'
                }}
              >
                <CardHeader style={{ paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <provider.icon style={{ width: '24px', height: '24px', color: '#1e3a8a' }} />
                    <div>
                      <CardTitle style={{ fontSize: '18px', fontWeight: '600', margin: '0' }}>
                        {provider.name}
                      </CardTitle>
                      <CardDescription style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
                        {provider.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Badge 
                      style={{ 
                        backgroundColor: status === "connected" ? '#dcfce7' : '#fee2e2',
                        color: status === "connected" ? '#166534' : '#991b1b',
                        border: 'none',
                        fontSize: '12px',
                        padding: '4px 8px'
                      }}
                    >
                      {status === "connected" ? "API Key Set" : "Need API Key"}
                    </Badge>
                    <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '500' }}>
                      {provider.models.length} model{provider.models.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent style={{ paddingTop: '0' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <Label 
                      htmlFor={`${provider.id}-key`}
                      style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '8px' }}
                    >
                      API Key
                    </Label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <Input
                        id={`${provider.id}-key`}
                        type="password"
                        placeholder={provider.keyPlaceholder}
                        value={currentKey}
                        onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                        style={{ 
                          flex: '1',
                          border: isPlaceholder ? '1px solid #fca5a5' : '1px solid #86efac',
                          borderRadius: '6px',
                          padding: '8px 12px'
                        }}
                      />
                      <Button
                        onClick={() => handleSaveApiKey(provider.id)}
                        disabled={updateApiKeyMutation.isPending}
                        style={{
                          backgroundColor: isPlaceholder ? '#1e3a8a' : 'transparent',
                          color: isPlaceholder ? 'white' : '#1e3a8a',
                          border: isPlaceholder ? 'none' : '1px solid #1e3a8a',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        <Save style={{ width: '16px', height: '16px' }} />
                        Save
                      </Button>
                    </div>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>
                      {provider.instructions}
                    </p>
                    {isPlaceholder && (
                      <p style={{ fontSize: '13px', color: '#dc2626', margin: '8px 0 0 0' }}>
                        ⚠ Enter your real API key to enable {provider.name} models
                      </p>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ flex: '1' }}>
                      <Label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '8px' }}>
                        Available Models
                      </Label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {provider.models.map(model => (
                          <Badge 
                            key={model.id} 
                            style={{ 
                              backgroundColor: '#f3f4f6',
                              color: '#374151',
                              border: '1px solid #d1d5db',
                              fontSize: '11px',
                              padding: '2px 6px'
                            }}
                          >
                            {model.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Button clicked for provider:', provider.id);
                        testConnection(provider.id);
                      }}
                      disabled={isTestingConnection === provider.id || isPlaceholder}
                      style={{
                        backgroundColor: 'transparent',
                        color: testResults[provider.id] === 'success' ? '#16a34a' : testResults[provider.id] === 'error' ? '#dc2626' : '#1e3a8a',
                        border: `1px solid ${testResults[provider.id] === 'success' ? '#16a34a' : testResults[provider.id] === 'error' ? '#dc2626' : '#1e3a8a'}`,
                        borderRadius: '6px',
                        padding: '6px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        cursor: isPlaceholder ? 'not-allowed' : 'pointer',
                        opacity: isPlaceholder ? '0.5' : '1',
                        marginLeft: '16px',
                        marginTop: '24px'
                      }}
                    >
                      {isTestingConnection === provider.id ? (
                        <TestTube style={{ width: '14px', height: '14px' }} />
                      ) : testResults[provider.id] === 'success' ? (
                        <Check style={{ width: '14px', height: '14px' }} />
                      ) : testResults[provider.id] === 'error' ? (
                        <X style={{ width: '14px', height: '14px' }} />
                      ) : (
                        <TestTube style={{ width: '14px', height: '14px' }} />
                      )}
                      {isTestingConnection === provider.id ? "Testing..." : "Test Connection"}
                    </button>
                  </div>

                  {errorMessages[provider.id] && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '8px' }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: testResults[provider.id] === 'success' ? '#16a34a' : '#dc2626', 
                        fontStyle: 'italic' 
                      }}>
                        {errorMessages[provider.id]}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginTop: '16px' }}>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      Status: <span style={{ fontWeight: '500', color: isPlaceholder ? '#dc2626' : '#16a34a' }}>
                        {isPlaceholder ? "Not configured" : "Configured"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Security Notice */}
        <Card style={{ border: '1px solid #fde68a', backgroundColor: '#fffbeb' }}>
          <CardContent style={{ paddingTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Key style={{ width: '20px', height: '20px', color: '#d97706', marginTop: '2px' }} />
              <div>
                <h3 style={{ fontWeight: '500', color: '#92400e', margin: '0 0 4px 0' }}>Security Notice</h3>
                <p style={{ fontSize: '14px', color: '#b45309', margin: '0', lineHeight: '1.5' }}>
                  API keys are stored securely in the database and are only accessible to super-users. 
                  Make sure to use API keys from accounts you control and monitor usage regularly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}