import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Key, Shield, Zap, Globe, Save, TestTube, AlertCircle } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import type { AiModel } from "@shared/schema";

export default function SetupApiKeys() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTestingConnection, setIsTestingConnection] = useState<string | null>(null);
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
    if (!apiKey || apiKey.startsWith('placeholder-')) {
      toast({
        title: "No API Key",
        description: "Please save a valid API key first",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(provider);
    try {
      await apiRequest(`/api/admin/test-api-key`, "POST", { provider, apiKey });
      toast({
        title: "Connection Test Successful",
        description: `${provider} API is working correctly`,
      });
    } catch (error: any) {
      toast({
        title: "Connection Test Failed",
        description: error.message || `Unable to connect to ${provider} API`,
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(null);
    }
  };

  const getConnectionStatus = (provider: any) => {
    const hasValidKey = apiKeys[provider.id] && !apiKeys[provider.id].startsWith('placeholder-');
    return hasValidKey ? "connected" : "needs-key";
  };

  if (modelsLoading) {
    return (
      <AdminLayout title="Setup API Keys" subtitle="Configure AI provider API keys">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sentinel-blue"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Setup API Keys" subtitle="Configure AI provider API keys">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Instructions */}
        <Card style={{ border: '1px solid #bfdbfe', backgroundColor: '#eff6ff' }}>
          <CardContent style={{ paddingTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <AlertCircle style={{ width: '20px', height: '20px', color: '#2563eb', marginTop: '2px' }} />
              <div>
                <h3 style={{ fontWeight: '500', color: '#1e3a8a', margin: '0 0 4px 0' }}>Super-User API Key Management</h3>
                <p style={{ fontSize: '14px', color: '#1d4ed8', margin: '0', lineHeight: '1.5' }}>
                  As a super-user, you can configure API keys for all AI providers. These keys will be used by all companies in the system.
                  Make sure to use valid, working API keys to enable AI model functionality.
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
                  
                  <div style={{ marginBottom: '20px' }}>
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

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      Status: <span style={{ fontWeight: '500', color: isPlaceholder ? '#dc2626' : '#16a34a' }}>
                        {isPlaceholder ? "Not configured" : "Configured"}
                      </span>
                    </div>
                    <Button
                      onClick={() => testConnection(provider.id)}
                      disabled={isTestingConnection === provider.id || isPlaceholder}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#1e3a8a',
                        border: '1px solid #1e3a8a',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        cursor: isPlaceholder ? 'not-allowed' : 'pointer',
                        opacity: isPlaceholder ? '0.5' : '1'
                      }}
                    >
                      <TestTube style={{ width: '14px', height: '14px' }} />
                      {isTestingConnection === provider.id ? "Testing..." : "Test Connection"}
                    </Button>
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