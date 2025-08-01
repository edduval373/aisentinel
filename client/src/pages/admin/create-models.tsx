import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bot, Plus, Edit, Trash2, Eye, EyeOff, TestTube } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { isDemoModeActive, isReadOnlyMode } from "@/utils/demoMode";
import { useDemoDialog } from "@/hooks/useDemoDialog";
import DemoBanner from "@/components/DemoBanner";
import type { AiModel } from "@shared/schema";

// Animation keyframes for loading spinner
const spinKeyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Model schema for form validation
const modelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  provider: z.string().min(1, "Provider is required"),
  modelId: z.string().min(1, "Model ID is required"),
  description: z.string().optional(),
  contextWindow: z.number().min(1).max(2000000),
  isEnabled: z.boolean(),
  capabilities: z.array(z.string()),
  apiKey: z.string().min(1, "API key is required"),
  apiEndpoint: z.string().optional(),
  maxTokens: z.number().min(1).max(100000),
  temperature: z.number().min(0).max(2),
  maxRetries: z.number().min(0).max(10),
  timeout: z.number().min(1000).max(120000),
  rateLimit: z.number().min(1).max(10000),
});

// Provider configurations
const providers = [
  { value: "openai", label: "OpenAI", defaultEndpoint: "https://api.openai.com/v1" },
  { value: "anthropic", label: "Anthropic", defaultEndpoint: "https://api.anthropic.com/v1" },
  { value: "google", label: "Google AI", defaultEndpoint: "https://generativelanguage.googleapis.com/v1" },
  { value: "perplexity", label: "Perplexity", defaultEndpoint: "https://api.perplexity.ai" },
  { value: "cohere", label: "Cohere", defaultEndpoint: "https://api.cohere.ai/v1" },
  { value: "mistral", label: "Mistral AI", defaultEndpoint: "https://api.mistral.ai/v1" },
  { value: "custom", label: "Custom Provider", defaultEndpoint: "" },
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
  console.log("[CREATE MODELS] Component rendering started");
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingModel, setEditingModel] = useState<AiModel | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState("basic");
  const [showDebug, setShowDebug] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showDialog, DialogComponent } = useDemoDialog();
  
  console.log("[CREATE MODELS] Component state initialized, user:", user?.role, "level:", user?.roleLevel);
  
  // Check if we're in demo mode
  const isDemoMode = isDemoModeActive(user);
  const isReadOnly = isReadOnlyMode(user);

  // Fetch AI models
  const { data: models = [], isLoading: modelsLoading, error, isError, refetch } = useQuery<AiModel[]>({
    queryKey: ["/api/ai-models"],
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  });

  // Debug logging for models loading
  console.log("🤖 Create Models Debug:", {
    modelsLoading,
    modelsCount: models?.length || 0,
    isError,
    error: error?.message,
    models: models?.slice(0, 2), // First 2 models for debug
    rawModels: models, // Full models array
    queryDataType: typeof models,
    isArray: Array.isArray(models),
    modelsTestCondition: models && models.length > 0,
    modelsUndefined: models === undefined,
    modelsNull: models === null,
    modelsEmpty: models?.length === 0
  });

  // Fetch debug status
  const { data: debugStatus } = useQuery({
    queryKey: ["/api/debug/status"],
    enabled: showDebug,
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
      resetForm();
      toast({ 
        title: "Model Created", 
        description: "AI model has been created successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      console.error("Create model error:", error);
      toast({ 
        title: "Creation Failed", 
        description: "Failed to create AI model. Please try again.",
        variant: "destructive"
      });
    },
  });

  // Update model mutation
  const updateModelMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & z.infer<typeof modelSchema>) =>
      apiRequest(`/api/ai-models/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-models"] });
      setShowEditDialog(false);
      resetForm();
      toast({ 
        title: "Model Updated", 
        description: "AI model has been updated successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      console.error("Update model error:", error);
      toast({ 
        title: "Update Failed", 
        description: "Failed to update AI model. Please try again.",
        variant: "destructive"
      });
    },
  });

  // Delete model mutation
  const deleteModelMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/ai-models/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-models"] });
      toast({ 
        title: "Model Deleted", 
        description: "AI model has been deleted successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      console.error("Delete model error:", error);
      toast({ 
        title: "Deletion Failed", 
        description: "Failed to delete AI model. Please try again.",
        variant: "destructive"
      });
    },
  });

  const onSubmitModel = (data: z.infer<typeof modelSchema>) => {
    if (editingModel) {
      updateModelMutation.mutate({ id: editingModel.id, ...data });
    } else {
      createModelMutation.mutate(data);
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
      capabilities: (model.capabilities as string[]) || [],
      apiKey: model.apiKey,
      apiEndpoint: model.apiEndpoint || "",
      maxTokens: model.maxTokens || 1000,
      temperature: model.temperature || 0.7,
      maxRetries: model.maxRetries || 3,
      timeout: model.timeout || 30000,
      rateLimit: model.rateLimit || 100,
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
    console.log("[CREATE MODELS] Showing loading state");
    return (
      <AdminLayout title="Create AI Models" subtitle="Create and manage custom AI models from scratch">
        <style>{spinKeyframes}</style>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src="/ai-sentinel-logo.png" 
              alt="AI Sentinel" 
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'contain',
                animation: 'spin 2s linear infinite',
                filter: 'brightness(1.1) saturate(1.3) contrast(1.2)'
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

  console.log("[CREATE MODELS] Rendering main component");
  return (
    <AdminLayout 
      title="Create AI Models" 
      subtitle="Create and manage custom AI models from scratch"
      rightContent={<DemoBanner message="Demo Mode - Read Only View - AI models cannot be modified" />}
    >
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
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => refetch()}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                marginRight: '8px'
              }}
            >
              Refresh Models
            </button>
            <Button
              onClick={() => setShowDebug(!showDebug)}
              style={{
                backgroundColor: showDebug ? '#dc2626' : '#eab308',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {showDebug ? 'Hide Debug' : 'Debug Panel'}
            </Button>
            {!isDemoMode ? (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Plus style={{ width: '16px', height: '16px' }} />
                    Create Model
                  </Button>
                </DialogTrigger>
                <DialogContent style={{ maxWidth: '80vw', maxHeight: '90vh', overflowY: 'auto' }}>
                  <DialogHeader>
                    <DialogTitle>Create New AI Model</DialogTitle>  
                  </DialogHeader>
                  <ModelForm 
                    form={modelForm}
                    onSubmit={onSubmitModel}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    providers={providers}
                    capabilities={capabilities}
                    handleProviderChange={handleProviderChange}
                    isSubmitting={createModelMutation.isPending}
                    onCancel={() => setShowCreateDialog(false)}
                  />
                </DialogContent>
              </Dialog>
            ) : (
              <Button
                onClick={() => showDialog({
                  title: 'Create AI Model',
                  description: 'In demo mode, AI model creation shows how you can build custom models with your own API keys, provider endpoints, and specialized configurations for your organization.'
                })}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
                Create Model
              </Button>
            )}
          </div>
        </div>

        {/* Debug Panel */}
        {showDebug && (
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px 0' }}>
              Debug Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
              <div>
                <strong>Models Loading:</strong> {modelsLoading ? 'Yes' : 'No'}<br/>
                <strong>Models Count:</strong> {models?.length || 0}<br/>
                <strong>Models Type:</strong> {typeof models}<br/>
                <strong>Is Array:</strong> {Array.isArray(models) ? 'Yes' : 'No'}<br/>
                <strong>Models Defined:</strong> {models !== undefined ? 'Yes' : 'No'}<br/>
                <strong>Has Error:</strong> {isError ? 'Yes' : 'No'}<br/>
                <strong>Error Message:</strong> {error?.message || 'None'}
              </div>
              <div>
                <strong>Debug Status:</strong> {debugStatus ? 'Loaded' : 'Not loaded'}<br/>
                <strong>Environment:</strong> {(debugStatus as any)?.environment || 'Unknown'}<br/>
                <strong>Database:</strong> {(debugStatus as any)?.databaseConnected ? 'Connected' : 'Disconnected'}<br/>
                <strong>API Endpoint:</strong> /api/ai-models<br/>
                <strong>First Model Name:</strong> {models?.[0]?.name || 'None'}<br/>
                <strong>Second Model Name:</strong> {models?.[1]?.name || 'None'}
              </div>
            </div>
          </div>
        )}

        {/* Models Grid */}
        {modelsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div>Loading AI models...</div>
          </div>
        ) : (models && Array.isArray(models) && models.length > 0) ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px'
          }}>
            {models.map((model: AiModel) => (
            <div
              key={model.id}
              style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 4px 0' }}>
                    {model.name}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                    {model.provider} • {model.modelId}
                  </p>
                </div>
                <div style={{
                  backgroundColor: model.isEnabled ? '#10b981' : '#6b7280',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginLeft: '144px'
                }}>
                  {model.isEnabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>

              {model.description && (
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 12px 0' }}>
                  {model.description}
                </p>
              )}

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>API Key</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code style={{
                    backgroundColor: '#f3f4f6',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    flex: 1
                  }}>
                    {showApiKeys[model.id] ? model.apiKey : maskApiKey(model.apiKey)}
                  </code>
                  <button
                    onClick={() => toggleApiKeyVisibility(model.id)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: '#6b7280'
                    }}
                  >
                    {showApiKeys[model.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => handleTestConfig(model.id)}
                  disabled={testConfigMutation.isPending}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <TestTube size={14} />
                  Test
                </Button>
                {!isDemoMode ? (
                  <>
                    <Button
                      onClick={() => handleEditModel(model)}
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: 'none',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Edit size={14} />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteModel(model.id)}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: 'none',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => showDialog({
                        title: 'Edit AI Model',
                        description: 'In demo mode, model editing shows how you can modify API endpoints, adjust parameters like temperature and token limits, and configure advanced settings for your custom AI models.'
                      })}
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: 'none',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Edit size={14} />
                      Edit
                    </Button>
                    <Button
                      onClick={() => showDialog({
                        title: 'Delete AI Model',
                        description: 'In demo mode, model deletion demonstrates the confirmation process and safety measures in place when removing AI models from your organization\'s configuration.'
                      })}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: 'none',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <div>No AI models found. Create your first model to get started.</div>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent style={{ maxWidth: '80vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <DialogHeader>
              <DialogTitle>Edit AI Model</DialogTitle>
            </DialogHeader>
            <ModelForm 
              form={modelForm}
              onSubmit={onSubmitModel}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              providers={providers}
              capabilities={capabilities}
              handleProviderChange={handleProviderChange}
              isSubmitting={updateModelMutation.isPending}
              onCancel={() => setShowEditDialog(false)}
            />
          </DialogContent>
        </Dialog>
        
        {/* Demo Info Dialog */}
        <DialogComponent />
      </div>
    </AdminLayout>
  );
}

// Model Form Component
function ModelForm({ 
  form, 
  onSubmit, 
  activeTab, 
  setActiveTab, 
  providers, 
  capabilities, 
  handleProviderChange, 
  isSubmitting, 
  onCancel 
}: {
  form: any;
  onSubmit: (data: any) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  providers: any[];
  capabilities: string[];
  handleProviderChange: (provider: string) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} style={{ width: '100%' }}>
          <TabsList style={{ display: 'grid', width: '100%', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="api">API Config</TabsTrigger>
            <TabsTrigger value="settings">Parameters</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" style={{ marginTop: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Custom GPT-4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      handleProviderChange(value);
                    }} defaultValue={field.value}>
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
              
              <FormField
                control={form.control}
                name="modelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., gpt-4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contextWindow"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Context Window</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="2000000" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe this model's capabilities and use cases..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isEnabled"
              render={({ field }) => (
                <FormItem style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Enable this model</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="api" style={{ marginTop: '16px' }}>
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your API key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="apiEndpoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Endpoint</FormLabel>
                  <FormControl>
                    <Input placeholder="API endpoint URL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="settings" style={{ marginTop: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField
                control={form.control}
                name="maxTokens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Tokens</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="100000" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="2" 
                        step="0.1" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <FormLabel>Capabilities</FormLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                {capabilities.map((capability) => (
                  <FormField
                    key={capability}
                    control={form.control}
                    name="capabilities"
                    render={({ field }) => (
                      <FormItem style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FormControl>
                          <Switch
                            checked={field.value?.includes(capability)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, capability]);
                              } else {
                                field.onChange(current.filter((c: string) => c !== capability));
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel style={{ fontSize: '14px' }}>{capability}</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" style={{ marginTop: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <FormField
                control={form.control}
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
                control={form.control}
                name="timeout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timeout (ms)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1000" 
                        max="120000" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="rateLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate Limit</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="10000" 
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
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '16px' }}>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Model"}
          </Button>
        </div>
      </form>
    </Form>
  );
}