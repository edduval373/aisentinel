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
      <div className="space-y-6">
        {/* Instructions */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Super-User API Key Management</h3>
                <p className="text-sm text-blue-700 mt-1">
                  As a super-user, you can configure API keys for all AI providers. These keys will be used by all companies in the system.
                  Make sure to use valid, working API keys to enable AI model functionality.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Provider Cards */}
        <div className="grid gap-6">
          {apiProviders.map((provider) => {
            const status = getConnectionStatus(provider);
            const currentKey = apiKeys[provider.id] || '';
            const isPlaceholder = currentKey.startsWith('placeholder-') || currentKey === '';
            
            return (
              <Card key={provider.name} className={isPlaceholder ? "border-red-200" : "border-green-200"}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <provider.icon className="h-6 w-6 text-sentinel-blue" />
                      <div>
                        <CardTitle className="text-lg">{provider.name}</CardTitle>
                        <CardDescription>{provider.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={status === "connected" ? "default" : "secondary"}
                        className={status === "connected" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {status === "connected" ? "API Key Set" : "Need API Key"}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {provider.models.length} model{provider.models.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${provider.id}-key`}>API Key</Label>
                    <div className="flex space-x-2">
                      <Input
                        id={`${provider.id}-key`}
                        type="password"
                        placeholder={provider.keyPlaceholder}
                        value={currentKey}
                        onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                        className={isPlaceholder ? "border-red-300" : "border-green-300"}
                      />
                      <Button
                        onClick={() => handleSaveApiKey(provider.id)}
                        disabled={updateApiKeyMutation.isPending}
                        size="sm"
                        variant={isPlaceholder ? "default" : "outline"}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600">
                      {provider.instructions}
                    </p>
                    {isPlaceholder && (
                      <p className="text-sm text-red-600">⚠ Enter your real API key to enable {provider.name} models</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Available Models</Label>
                    <div className="flex flex-wrap gap-2">
                      {provider.models.map(model => (
                        <Badge key={model.id} variant="outline" className="text-xs">
                          {model.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm text-gray-600">
                      Status: {isPlaceholder ? "Not configured" : "Configured"}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection(provider.id)}
                      disabled={isTestingConnection === provider.id || isPlaceholder}
                    >
                      <TestTube className="h-4 w-4 mr-1" />
                      {isTestingConnection === provider.id ? "Testing..." : "Test Connection"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Security Notice */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Key className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-900">Security Notice</h3>
                <p className="text-sm text-yellow-700 mt-1">
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