import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button-standard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card-standard";
import { Input } from "@/components/ui/input-standard";
import { Label } from "@/components/ui/label-standard";
import { Badge } from "@/components/ui/badge-standard";
import { Key, Shield, Zap, Globe, Save, TestTube, AlertCircle, Check, X, Loader2 } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { hasAccessLevel, canViewAdminPage, ACCESS_REQUIREMENTS } from "@/utils/roleBasedAccess";
import { useAuth } from "@/hooks/useAuth";
import type { AiModel } from "@shared/schema";
import DemoBanner from "@/components/DemoBanner";
import { isDemoModeActive } from "@/utils/demoMode";
import { useDemoDialog } from "@/hooks/useDemoDialog";

export default function SetupApiKeys() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Demo mode detection
  const isDemoMode = isDemoModeActive(user);
  const { showDialog, closeDialog, DialogComponent } = useDemoDialog();

  const openDialog = (type: string) => {
    const dialogConfig = {
      title: "API Configuration",
      description: "Secure API key management for multiple AI providers with comprehensive testing and validation features.",
      features: [
        "Secure encrypted storage of API keys for OpenAI, Anthropic, Google, Cohere, Mistral AI",
        "Real-time API key validation and connection testing",
        "Provider-specific rate limiting and timeout configuration",
        "Connection status monitoring with detailed error reporting",
        "Automatic API key rotation and expiration tracking",
        "Advanced security features including key masking and audit logging"
      ]
    };
    closeDialog();
    setTimeout(() => {
      showDialog(dialogConfig);
    }, 10);
  };
  
  // Check if user has owner level access (99 or above)
  const hasOwnerAccess = canViewAdminPage(user, ACCESS_REQUIREMENTS.SETUP_API_KEYS);
  const [isTestingConnection, setIsTestingConnection] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | null>>({});
  const [modelTestResults, setModelTestResults] = useState<Record<string, 'success' | 'error' | null>>({});
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

  // Fetch AI models to get current API keys
  const { data: aiModels, isLoading: modelsLoading, error: modelsError } = useQuery<AiModel[]>({
    queryKey: ['/api/ai-models'],
  });

  // Fetch API key configuration status from environment
  const { data: apiKeyConfig, isLoading: apiKeyLoading, error: apiKeyError } = useQuery({
    queryKey: ['/api/admin/api-keys'],
  });

  console.log('SetupApiKeys: Query state:', { 
    isLoading: modelsLoading, 
    hasData: !!aiModels, 
    dataLength: aiModels?.length,
    error: modelsError,
    apiKeyConfig,
    apiKeyLoading,
    apiKeyError,
    userAuth: { isAuthenticated: !!user, roleLevel: user?.roleLevel, companyId: user?.companyId }
  });

  // Initialize API keys from models and environment configuration
  useEffect(() => {
    if (apiKeyConfig && aiModels) {
      console.log('SetupApiKeys: Loading API key config:', apiKeyConfig);
      console.log('SetupApiKeys: Loading AI models:', aiModels.length, 'models');
      
      const keys: Record<string, string> = {};
      
      // First, extract actual API keys from database models for input fields
      aiModels.forEach(model => {
        const provider = model.provider.toLowerCase();
        if (model.apiKey && !model.apiKey.startsWith('placeholder-') && !keys[provider]) {
          keys[provider] = model.apiKey;
          console.log(`SetupApiKeys: Found database API key for ${provider}:`, model.apiKey.substring(0, 15) + '...');
        }
      });
      
      // Then check configuration status for display
      Object.entries(apiKeyConfig).forEach(([provider, config]: [string, any]) => {
        if (!keys[provider]) {
          // If configured via environment, show masked placeholder
          if (config.configured && config.source === 'environment') {
            keys[provider] = `••••••••••••••••(configured via environment)`;
          } else {
            // If no database key, use empty string for input field
            keys[provider] = '';
          }
        }
        console.log(`SetupApiKeys: Provider ${provider} - configured: ${config.configured}, source: ${config.source || 'none'}`);
      });
      
      console.log('SetupApiKeys: Final API keys state:', 
        Object.keys(keys).map(k => ({ provider: k, hasKey: !!keys[k], keyLength: keys[k]?.length })));
      setApiKeys(keys);
    }
  }, [apiKeyConfig, aiModels]);

  // Update API key mutation
  const updateApiKeyMutation = useMutation({
    mutationFn: async ({ provider, apiKey }: { provider: string; apiKey: string }) => {
      return apiRequest(`/api/admin/update-api-key`, "POST", { provider, apiKey });
    },
    onSuccess: (data, variables) => {
      // Force refresh of AI models and API key configuration
      queryClient.invalidateQueries({ queryKey: ['/api/ai-models'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/api-keys'] });
      
      // Show success toast
      toast({
        title: "Success",
        description: `${variables.provider} API key updated successfully`,
      });
      
      // Update local state immediately to show configured status
      setApiKeys(prev => ({ ...prev, [variables.provider]: `${variables.provider.toUpperCase()}_API_KEY_CONFIGURED` }));
    },
    onError: (error: any, variables) => {
      toast({
        title: "Error",
        description: error.message || `Failed to update ${variables.provider} API key`,
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
    
    // Clear individual model test results for this provider
    const providerModels = aiModels?.filter(m => m.provider === provider) || [];
    const newModelResults = { ...modelTestResults };
    providerModels.forEach(model => {
      delete newModelResults[model.id.toString()];
    });
    setModelTestResults(newModelResults);
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
    setTestResults(prev => ({ ...prev, [provider]: null }));
    setErrorMessages(prev => ({ ...prev, [provider]: '' }));
    
    // Get all models for this provider
    const providerModels = aiModels?.filter(m => m.provider === provider) || [];
    console.log(`Testing ${providerModels.length} models for provider: ${provider}`);
    
    // Clear previous model test results for this provider
    const newModelResults = { ...modelTestResults };
    providerModels.forEach(model => {
      delete newModelResults[model.id.toString()];
    });
    setModelTestResults(newModelResults);
    
    let allSuccessful = true;
    let errorCount = 0;
    
    try {
      // Test each model individually
      for (const model of providerModels) {
        console.log(`Testing model: ${model.name} (ID: ${model.id})`);
        
        try {
          const response = await apiRequest(`/api/admin/test-api-key`, "POST", { 
            provider, 
            apiKey,
            modelId: model.id.toString()
          });
          
          console.log(`Model ${model.name} test result:`, response);
          
          if (response.success) {
            setModelTestResults(prev => ({ ...prev, [model.id.toString()]: 'success' }));
          } else {
            setModelTestResults(prev => ({ ...prev, [model.id.toString()]: 'error' }));
            allSuccessful = false;
            errorCount++;
          }
        } catch (modelError: any) {
          console.error(`Model ${model.name} test error:`, modelError);
          setModelTestResults(prev => ({ ...prev, [model.id.toString()]: 'error' }));
          allSuccessful = false;
          errorCount++;
        }
      }
      
      // Set overall provider result
      if (allSuccessful) {
        setTestResults(prev => ({ ...prev, [provider]: 'success' }));
        setErrorMessages(prev => ({ ...prev, [provider]: `All ${providerModels.length} models tested successfully` }));
      } else {
        setTestResults(prev => ({ ...prev, [provider]: 'error' }));
        setErrorMessages(prev => ({ ...prev, [provider]: `${errorCount} of ${providerModels.length} models failed` }));
      }
      
    } catch (error: any) {
      console.error('Test connection error:', error);
      setTestResults(prev => ({ ...prev, [provider]: 'error' }));
      setErrorMessages(prev => ({ ...prev, [provider]: error.message || 'Connection test failed' }));
    } finally {
      console.log('Clearing testing state for provider:', provider);
      setIsTestingConnection(null);
    }
  };

  const getConnectionStatus = (provider: any) => {
    const providerKey = provider.id || provider.provider || provider.name?.toLowerCase();
    const configStatus = apiKeyConfig?.[providerKey];
    const hasValidKey = (apiKeys[providerKey] && apiKeys[providerKey] !== '') || configStatus?.configured;
    return hasValidKey ? "connected" : "needs-key";
  };

  const isEnvironmentConfigured = (providerId: string) => {
    const configStatus = apiKeyConfig?.[providerId];
    return configStatus?.configured && configStatus?.source === 'environment';
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

  if (modelsLoading || apiKeyLoading) {
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
            const isEnvironmentConfig = isEnvironmentConfigured(provider.id);
            const isPlaceholder = !isEnvironmentConfig && (currentKey.startsWith('placeholder-') || currentKey === '');
            const isConfigured = status === "connected";
            
            return (
              <Card 
                key={provider.name} 
                style={{ 
                  border: isConfigured ? '1px solid #bbf7d0' : '1px solid #fecaca',
                  backgroundColor: isConfigured ? '#f0fdf4' : '#fef2f2',
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
                        backgroundColor: isConfigured ? '#dcfce7' : '#fee2e2',
                        color: isConfigured ? '#166534' : '#991b1b',
                        border: 'none',
                        fontSize: '12px',
                        padding: '4px 8px'
                      }}
                    >
                      {isConfigured ? (isEnvironmentConfig ? "Configured" : "API Key Set") : "Not configured"}
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
                        placeholder={isEnvironmentConfig ? "Configured via environment variables" : provider.keyPlaceholder}
                        value={currentKey}
                        onChange={isDemoMode || isEnvironmentConfig ? undefined : (e) => handleApiKeyChange(provider.id, e.target.value)}
                        onClick={isDemoMode ? () => openDialog('input') : undefined}
                        disabled={isDemoMode || isEnvironmentConfig}
                        style={{ 
                          flex: '1',
                          border: isConfigured ? '1px solid #86efac' : '1px solid #fca5a5',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          opacity: (isDemoMode || isEnvironmentConfig) ? 0.6 : 1,
                          cursor: (isDemoMode || isEnvironmentConfig) ? 'not-allowed' : 'text',
                          color: isEnvironmentConfig ? '#059669' : 'inherit'
                        }}
                      />
                      <Button
                        onClick={isDemoMode ? () => openDialog('save') : () => handleSaveApiKey(provider.id)}
                        disabled={isDemoMode || isEnvironmentConfig || updateApiKeyMutation.isPending}
                        style={{
                          backgroundColor: (isDemoMode || isEnvironmentConfig || !currentKey || currentKey.includes('(configured')) ? 'transparent' : '#1e3a8a',
                          color: (isDemoMode || isEnvironmentConfig || !currentKey || currentKey.includes('(configured')) ? '#1e3a8a' : 'white',
                          border: (isDemoMode || isEnvironmentConfig || !currentKey || currentKey.includes('(configured')) ? '1px solid #1e3a8a' : 'none',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '14px',
                          cursor: (isDemoMode || isEnvironmentConfig || updateApiKeyMutation.isPending) ? 'not-allowed' : 'pointer',
                          opacity: (isDemoMode || isEnvironmentConfig) ? 0.6 : 1
                        }}
                      >
                        {updateApiKeyMutation.isPending ? (
                          <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <Save style={{ width: '16px', height: '16px' }} />
                        )}
                        {updateApiKeyMutation.isPending ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>
                      {isEnvironmentConfig ? "This API key is configured via environment variables and ready to use." : provider.instructions}
                    </p>
                    {isPlaceholder && !isEnvironmentConfig && (
                      <p style={{ fontSize: '13px', color: '#dc2626', margin: '8px 0 0 0' }}>
                        ⚠ Enter your real API key to enable {provider.name} models
                      </p>
                    )}
                    {isEnvironmentConfig && (
                      <p style={{ fontSize: '13px', color: '#059669', margin: '8px 0 0 0' }}>
                        ✓ {provider.name} is configured and ready for AI interactions
                      </p>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ flex: '1' }}>
                      <Label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '8px' }}>
                        Available Models
                      </Label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {provider.models.map(model => {
                          const modelResult = modelTestResults[model.id.toString()];
                          return (
                            <div
                              key={model.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '4px 8px',
                                backgroundColor: '#f9fafb',
                                border: '1px solid #e5e7eb',
                                borderRadius: '4px'
                              }}
                            >
                              <span style={{ fontSize: '12px', color: '#374151', flex: '1' }}>
                                {model.name}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Badge 
                                  style={{ 
                                    backgroundColor: '#f3f4f6',
                                    color: '#6b7280',
                                    border: '1px solid #d1d5db',
                                    fontSize: '10px',
                                    padding: '1px 4px'
                                  }}
                                >
                                  {model.modelId}
                                </Badge>
                                {modelResult === 'success' && (
                                  <Check style={{ width: '14px', height: '14px', color: '#16a34a' }} />
                                )}
                                {modelResult === 'error' && (
                                  <X style={{ width: '14px', height: '14px', color: '#dc2626' }} />
                                )}
                                {modelResult === null && isTestingConnection === provider.id && (
                                  <TestTube style={{ width: '14px', height: '14px', color: '#6b7280' }} />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      onClick={isDemoMode ? () => openDialog('test') : (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Button clicked for provider:', provider.id);
                        testConnection(provider.id);
                      }}
                      disabled={isDemoMode || isTestingConnection === provider.id || isPlaceholder}
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
                        cursor: (isDemoMode || isPlaceholder) ? 'not-allowed' : 'pointer',
                        opacity: (isDemoMode || isPlaceholder) ? '0.5' : '1',
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
      {isDemoMode && DialogComponent && <DialogComponent />}
    </AdminLayout>
  );
}