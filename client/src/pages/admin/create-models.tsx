import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Bot, Plus, Edit2, Trash2, Key, Settings, Eye, EyeOff, TestTube } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { apiRequest } from "@/lib/queryClient";

// Add spinning AI Sentinel logo keyframes
const spinKeyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const modelSchema = z.object({
  name: z.string().min(1, "Model name is required"),
  provider: z.string().min(1, "Provider is required"),
  modelId: z.string().min(1, "Model ID is required"),
  description: z.string().optional(),
  contextWindow: z.number().min(1, "Context window must be at least 1"),
  isEnabled: z.boolean().default(true),
  capabilities: z.array(z.string()).default([]),
  // API Configuration - simplified
  apiKey: z.string().min(1, "API key is required"),
  apiEndpoint: z.string().url("Must be a valid URL"),
  maxTokens: z.number().min(1, "Max tokens must be at least 1").default(1000),
  temperature: z.number().min(0).max(2).default(0.7),
  // Advanced settings
  maxRetries: z.number().min(0).max(10).default(3),
  timeout: z.number().min(1000).max(60000).default(30000),
  rateLimit: z.number().min(1).max(1000).default(100),
});

interface AiModel {
  id: number;
  name: string;
  provider: string;
  modelId: string;
  description?: string;
  contextWindow: number;
  isEnabled: boolean;
  capabilities: string[];
  // API Configuration - simplified
  apiKey: string;
  apiEndpoint: string;
  maxTokens: number;
  temperature: number;
  // Advanced settings
  maxRetries: number;
  timeout: number;
  rateLimit: number;
  // Status
  lastTested?: string;
  isWorking?: boolean;
}

const providers = [
  { 
    value: "openai", 
    label: "OpenAI", 
    defaultEndpoint: "https://api.openai.com/v1/chat/completions",
    authMethod: "bearer",
    defaultHeaders: '{"Content-Type": "application/json"}'
  },
  { 
    value: "anthropic", 
    label: "Anthropic", 
    defaultEndpoint: "https://api.anthropic.com/v1/messages",
    authMethod: "x-api-key",
    defaultHeaders: '{"Content-Type": "application/json", "anthropic-version": "2023-06-01"}'
  },
  { 
    value: "perplexity", 
    label: "Perplexity", 
    defaultEndpoint: "https://api.perplexity.ai/chat/completions",
    authMethod: "bearer",
    defaultHeaders: '{"Content-Type": "application/json"}'
  },
  { 
    value: "google", 
    label: "Google Gemini", 
    defaultEndpoint: "https://generativelanguage.googleapis.com/v1/models",
    authMethod: "api-key",
    defaultHeaders: '{"Content-Type": "application/json"}'
  },
  { 
    value: "cohere", 
    label: "Cohere", 
    defaultEndpoint: "https://api.cohere.ai/v1/generate",
    authMethod: "bearer",
    defaultHeaders: '{"Content-Type": "application/json"}'
  },
  { 
    value: "custom", 
    label: "Custom Provider", 
    defaultEndpoint: "",
    authMethod: "bearer",
    defaultHeaders: '{"Content-Type": "application/json"}'
  },
];

const authMethods = [
  { value: "bearer", label: "Bearer Token" },
  { value: "api-key", label: "API Key Header" },
  { value: "x-api-key", label: "X-API-Key Header" },
  { value: "basic", label: "Basic Auth" },
  { value: "custom", label: "Custom Auth" },
];

const capabilities = [
  "text-generation",
  "image-analysis",
  "code-generation",
  "real-time-search",
  "function-calling",
  "multimodal",
];

export default function CreateModels() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingModel, setEditingModel] = useState<AiModel | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState("basic");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch AI models
  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ["/api/ai-models"],
  });

  const modelForm = useForm<z.infer<typeof modelSchema>>({
    resolver: zodResolver(modelSchema),
    defaultValues: {
      name: "",
      provider: "",
      modelId: "",
      description: "",
      contextWindow: 4096,
      isEnabled: true,
      capabilities: [],
      apiKey: "",
      apiEndpoint: "",
      maxTokens: 1000,
      temperature: 0.7,
      maxRetries: 3,
      timeout: 30000,
      rateLimit: 100,
    },
  });

  // Create model mutation
  const createModelMutation = useMutation({
    mutationFn: (data: z.infer<typeof modelSchema>) =>
      apiRequest("/api/ai-models", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-models"] });
      setShowCreateDialog(false);
      modelForm.reset();
      toast({ title: "Success", description: "AI model created successfully" });
    },
    onError: (error: any) => {
      console.error("Model creation error:", error);
      toast({ title: "Error", description: "Failed to create model", variant: "destructive" });
    },
  });

  // Update model mutation
  const updateModelMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: z.infer<typeof modelSchema> }) =>
      apiRequest(`/api/ai-models/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-models"] });
      setShowEditDialog(false);
      setEditingModel(null);
      modelForm.reset();
      toast({ title: "Success", description: "AI model updated successfully" });
    },
    onError: (error: any) => {
      console.error("Model update error:", error);
      toast({ title: "Error", description: "Failed to update model", variant: "destructive" });
    },
  });

  // Delete model mutation
  const deleteModelMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/ai-models/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-models"] });
      toast({ title: "Success", description: "AI model deleted successfully" });
    },
    onError: (error: any) => {
      console.error("Model deletion error:", error);
      toast({ title: "Error", description: "Failed to delete model", variant: "destructive" });
    },
  });

  const onSubmitModel = (data: z.infer<typeof modelSchema>) => {
    // Automatically add organizationId and requestHeaders
    const enrichedData = {
      ...data,
      organizationId: "company-1", // Auto-set company ID
      authMethod: "bearer", // Default auth method
      requestHeaders: '{"Content-Type": "application/json"}' // Default headers
    };
    
    if (editingModel) {
      updateModelMutation.mutate({ id: editingModel.id, data: enrichedData });
    } else {
      createModelMutation.mutate(enrichedData);
    }
  };

  const handleEditModel = (model: AiModel) => {
    setEditingModel(model);
    modelForm.reset({
      name: model.name,
      provider: model.provider,
      modelId: model.modelId,
      description: model.description || "",
      contextWindow: model.contextWindow,
      isEnabled: model.isEnabled,
      capabilities: model.capabilities,
      apiKey: model.apiKey,
      apiEndpoint: model.apiEndpoint,
      maxTokens: model.maxTokens,
      temperature: model.temperature,
      maxRetries: model.maxRetries,
      timeout: model.timeout,
      rateLimit: model.rateLimit,
    });
    setShowEditDialog(true);
  };

  const handleDeleteModel = (id: number) => {
    if (confirm("Are you sure you want to delete this model? This action cannot be undone.")) {
      deleteModelMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setEditingModel(null);
    setActiveTab("basic");
    modelForm.reset();
  };

  const toggleApiKeyVisibility = (id: number) => {
    setShowApiKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 4) + "•".repeat(key.length - 8) + key.substring(key.length - 4);
  };

  // Update form values when provider changes
  const handleProviderChange = (provider: string) => {
    const providerConfig = providers.find(p => p.value === provider);
    if (providerConfig) {
      modelForm.setValue("provider", provider);
      if (providerConfig.defaultEndpoint) {
        modelForm.setValue("apiEndpoint", providerConfig.defaultEndpoint);
      }
      modelForm.setValue("authMethod", providerConfig.authMethod);
      modelForm.setValue("requestHeaders", providerConfig.defaultHeaders);
      modelForm.setValue("authMethod", providerConfig.authMethod);
      modelForm.setValue("requestHeaders", providerConfig.defaultHeaders);
    }
  };

  // Test API configuration
  const testConfigMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/ai-models/${id}/test`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-models"] });
      toast({ 
        title: "Test Successful", 
        description: "API configuration is working correctly",
        variant: "default"
      });
    },
    onError: (error: any) => {
      console.error("API test error:", error);
      toast({ 
        title: "Test Failed", 
        description: "API configuration test failed. Please check your settings.",
        variant: "destructive"
      });
    },
  });

  const handleTestConfig = (id: number) => {
    testConfigMutation.mutate(id);
  };

  if (modelsLoading) {
    return (
      <AdminLayout title="Create AI Models" subtitle="Create and manage custom AI models from scratch">
        <style>{spinKeyframes}</style>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '400px',
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
          <div style={{
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 8px 0'
            }}>
              Loading AI Models
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#64748b',
              margin: 0
            }}>
              Preparing your custom model configuration...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Create AI Models" subtitle="Create and manage custom AI models from scratch">
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Header Section */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Bot style={{ width: '32px', height: '32px', color: '#3b82f6' }} />
            <div>
              <h2 style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: '#1e293b', 
                margin: '0 0 4px 0' 
              }}>
                Custom AI Models
              </h2>
              <p style={{ 
                fontSize: '16px', 
                color: '#64748b', 
                margin: 0 
              }}>
                Build and configure AI models tailored to your organization's needs
              </p>
            </div>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button 
                onClick={resetForm}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  border: 'none',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '16px',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }}
              >
                <Plus style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                Create Model
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New AI Model</DialogTitle>
              </DialogHeader>
              <Form {...modelForm}>
                <form onSubmit={modelForm.handleSubmit(onSubmitModel)} className="space-y-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="api">API Config</TabsTrigger>
                      <TabsTrigger value="settings">Settings</TabsTrigger>
                      <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={modelForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Model Name</FormLabel>
                              <FormControl>
                                <Input placeholder="GPT-4 Turbo" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={modelForm.control}
                          name="provider"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Provider</FormLabel>
                              <Select onValueChange={handleProviderChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select provider" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {providers.map((provider) => (
                                    <SelectItem key={provider.value} value={provider.value}>
                                      {provider.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={modelForm.control}
                        name="modelId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Model ID</FormLabel>
                            <FormControl>
                              <Input placeholder="gpt-4-turbo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={modelForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Model description..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={modelForm.control}
                        name="contextWindow"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Context Window</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="4096" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={modelForm.control}
                        name="isEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Enable Model</FormLabel>
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="api" className="space-y-4 mt-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-blue-900 mb-2">API Authentication & Communication</h3>
                        <p className="text-sm text-blue-700">Configure how your application communicates with the AI model API.</p>
                      </div>
                      <FormField
                        control={modelForm.control}
                        name="apiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>API Key</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="sk-..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={modelForm.control}
                        name="apiEndpoint"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>API Endpoint</FormLabel>
                            <FormControl>
                              <Input placeholder="https://api.openai.com/v1/chat/completions" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Authentication and headers are now handled automatically */}
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <p className="text-sm text-green-700">
                          ✓ Authentication method, request headers, and organization ID are configured automatically
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-4 mt-4">
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h3 className="font-semibold text-green-900 mb-2">Model Parameters</h3>
                        <p className="text-sm text-green-700">Configure model behavior and output settings.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={modelForm.control}
                          name="maxTokens"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Tokens</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="1000" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={modelForm.control}
                          name="temperature"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Temperature</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1"
                                  min="0"
                                  max="2"
                                  placeholder="0.7" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <FormLabel>Capabilities</FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                          {capabilities.map((capability) => (
                            <FormField
                              key={capability}
                              control={modelForm.control}
                              name="capabilities"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <Switch
                                      checked={field.value?.includes(capability)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          field.onChange([...field.value, capability]);
                                        } else {
                                          field.onChange(field.value?.filter((c) => c !== capability));
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm">{capability}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="advanced" className="space-y-4 mt-4">
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <h3 className="font-semibold text-orange-900 mb-2">Advanced Configuration</h3>
                        <p className="text-sm text-orange-700">Rate limiting, timeouts, and error handling settings.</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={modelForm.control}
                          name="maxRetries"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Retries</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  max="10" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={modelForm.control}
                          name="timeout"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Timeout (ms)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1000" 
                                  max="60000" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={modelForm.control}
                          name="rateLimit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rate Limit (req/min)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  max="1000" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    gap: '12px', 
                    paddingTop: '24px',
                    borderTop: '1px solid #e2e8f0'
                  }}>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateDialog(false)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        background: 'white',
                        color: '#374151'
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createModelMutation.isPending}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        color: 'white',
                        border: 'none',
                        fontWeight: '600'
                      }}
                    >
                      {createModelMutation.isPending ? "Creating..." : "Create Model"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Models Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '24px' 
        }}>
          {models.map((model: AiModel) => (
            <Card 
              key={model.id} 
              style={{
                background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.12)';
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <CardHeader style={{ paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}>
                      <Bot style={{ width: '24px', height: '24px', color: 'white' }} />
                    </div>
                    <div>
                      <CardTitle style={{ 
                        fontSize: '20px', 
                        fontWeight: '700', 
                        color: '#1e293b',
                        marginBottom: '4px'
                      }}>
                        {model.name}
                      </CardTitle>
                      <p style={{ 
                        fontSize: '14px', 
                        color: '#64748b', 
                        textTransform: 'capitalize',
                        fontWeight: '500'
                      }}>
                        {model.provider}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={model.isEnabled ? "default" : "secondary"}
                    style={{
                      background: model.isEnabled 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                        : '#6b7280',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    {model.isEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Model Details */}
                <div style={{ 
                  background: '#f8fafc', 
                  padding: '16px', 
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Model ID:</span>
                      <span style={{ 
                        fontSize: '14px', 
                        color: '#1e293b', 
                        fontWeight: '600',
                        fontFamily: 'monospace',
                        background: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        {model.modelId}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Context Window:</span>
                      <span style={{ 
                        fontSize: '14px', 
                        color: '#1e293b', 
                        fontWeight: '600',
                        background: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        {model.contextWindow ? model.contextWindow.toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>API Key:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          fontSize: '12px', 
                          fontFamily: 'monospace',
                          color: '#374151',
                          background: '#ffffff',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0'
                        }}>
                          {showApiKeys[model.id] ? model.apiKey : maskApiKey(model.apiKey || '')}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleApiKeyVisibility(model.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '4px',
                            cursor: 'pointer',
                            borderRadius: '4px'
                          }}
                        >
                          {showApiKeys[model.id] ? (
                            <EyeOff style={{ width: '14px', height: '14px', color: '#64748b' }} />
                          ) : (
                            <Eye style={{ width: '14px', height: '14px', color: '#64748b' }} />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Endpoint:</span>
                      <span style={{ 
                        fontSize: '12px', 
                        color: '#374151',
                        fontFamily: 'monospace',
                        background: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }} title={model.apiEndpoint}>
                        {model.apiEndpoint}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Rate Limit:</span>
                      <span style={{ 
                        fontSize: '12px', 
                        color: '#374151',
                        background: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        {model.rateLimit || 100}/min
                      </span>
                    </div>
                  </div>
                </div>
                {model.description && (
                  <div style={{
                    background: '#f0f9ff',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #bae6fd'
                  }}>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#0f172a', 
                      margin: 0,
                      lineHeight: '1.5'
                    }}>
                      {model.description}
                    </p>
                  </div>
                )}
                {model.capabilities && model.capabilities.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {model.capabilities.slice(0, 3).map((capability) => (
                      <Badge 
                        key={capability} 
                        variant="outline" 
                        style={{
                          fontSize: '11px',
                          padding: '4px 8px',
                          background: '#ffffff',
                          border: '1px solid #d1d5db',
                          color: '#374151',
                          borderRadius: '6px'
                        }}
                      >
                        {capability}
                      </Badge>
                    ))}
                    {model.capabilities.length > 3 && (
                      <Badge 
                        variant="outline" 
                        style={{
                          fontSize: '11px',
                          padding: '4px 8px',
                          background: '#ffffff',
                          border: '1px solid #d1d5db',
                          color: '#374151',
                          borderRadius: '6px'
                        }}
                      >
                        +{model.capabilities.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  paddingTop: '16px',
                  borderTop: '1px solid #e2e8f0'
                }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConfig(model.id)}
                    disabled={testConfigMutation.isPending}
                    style={{
                      flex: 1,
                      background: '#f0f9ff',
                      border: '1px solid #0ea5e9',
                      color: '#0369a1',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <TestTube style={{ width: '14px', height: '14px' }} />
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditModel(model)}
                    style={{
                      flex: 1,
                      background: '#f0fdf4',
                      border: '1px solid #22c55e',
                      color: '#15803d',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Edit2 style={{ width: '14px', height: '14px' }} />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteModel(model.id)}
                    style={{
                      flex: 1,
                      background: '#fef2f2',
                      border: '1px solid #ef4444',
                      color: '#dc2626',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Trash2 style={{ width: '14px', height: '14px' }} />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent style={{
            maxWidth: '900px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <DialogHeader>
              <DialogTitle style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                Edit AI Model
              </DialogTitle>
            </DialogHeader>
            <Form {...modelForm}>
              <form onSubmit={modelForm.handleSubmit(onSubmitModel)} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <Tabs value={activeTab} onValueChange={setActiveTab} style={{ width: '100%' }}>
                  <TabsList style={{
                    display: 'grid',
                    width: '100%',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    background: '#f8fafc',
                    padding: '4px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <TabsTrigger value="basic" style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}>
                      Basic Info
                    </TabsTrigger>
                    <TabsTrigger value="api" style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}>
                      API Config
                    </TabsTrigger>
                    <TabsTrigger value="settings" style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}>
                      Settings
                    </TabsTrigger>
                    <TabsTrigger value="advanced" style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}>
                      Advanced
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <FormField
                        control={modelForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Model Name</FormLabel>
                            <FormControl>
                              <Input placeholder="GPT-4 Turbo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={modelForm.control}
                        name="provider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Provider</FormLabel>
                            <Select onValueChange={handleProviderChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {providers.map((provider) => (
                                  <SelectItem key={provider.value} value={provider.value}>
                                    {provider.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={modelForm.control}
                      name="modelId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model ID</FormLabel>
                          <FormControl>
                            <Input placeholder="gpt-4-turbo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={modelForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Model description..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={modelForm.control}
                      name="contextWindow"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Context Window</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="4096" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={modelForm.control}
                      name="isEnabled"
                      render={({ field }) => (
                        <FormItem style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Enable Model</FormLabel>
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="api" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                    <div style={{
                      background: '#eff6ff',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid #bfdbfe'
                    }}>
                      <h3 style={{ 
                        fontWeight: '600', 
                        color: '#1e3a8a', 
                        marginBottom: '8px',
                        fontSize: '16px'
                      }}>
                        API Authentication & Communication
                      </h3>
                      <p style={{ fontSize: '14px', color: '#1d4ed8', margin: 0 }}>
                        Configure how your application communicates with the AI model API.
                      </p>
                    </div>
                    <FormField
                      control={modelForm.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Key</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="sk-..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={modelForm.control}
                      name="apiEndpoint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Endpoint</FormLabel>
                          <FormControl>
                            <Input placeholder="https://api.openai.com/v1/chat/completions" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Authentication and headers are now handled automatically */}
                    <div style={{
                      background: '#f0fdf4',
                      padding: '12px',
                      borderRadius: '8px', 
                      border: '1px solid #bbf7d0'
                    }}>
                      <p style={{ fontSize: '14px', color: '#15803d', margin: 0 }}>
                        ✓ Authentication method, request headers, and organization ID are configured automatically
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-4 mt-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-green-900 mb-2">Model Parameters</h3>
                      <p className="text-sm text-green-700">Configure model behavior and output settings.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={modelForm.control}
                        name="maxTokens"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Tokens</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="1000" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={modelForm.control}
                        name="temperature"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Temperature</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1"
                                min="0"
                                max="2"
                                placeholder="0.7" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <FormLabel>Capabilities</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {capabilities.map((capability) => (
                          <FormField
                            key={capability}
                            control={modelForm.control}
                            name="capabilities"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch
                                    checked={field.value?.includes(capability)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([...field.value, capability]);
                                      } else {
                                        field.onChange(field.value?.filter((c) => c !== capability));
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm">{capability}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4 mt-4">
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h3 className="font-semibold text-orange-900 mb-2">Advanced Configuration</h3>
                      <p className="text-sm text-orange-700">Rate limiting, timeouts, and error handling settings.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={modelForm.control}
                        name="maxRetries"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Retries</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                max="10" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={modelForm.control}
                        name="timeout"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timeout (ms)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1000" 
                                max="60000" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={modelForm.control}
                        name="rateLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rate Limit (req/min)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="1000" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateModelMutation.isPending}>
                    {updateModelMutation.isPending ? "Updating..." : "Update Model"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}