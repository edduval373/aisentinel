import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bot, Plus, Edit, Trash2, Eye, EyeOff, TestTube } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

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
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null);
  const [showApiKeys, setShowApiKeys] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState("basic");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isSuperUser: authIsSuperUser } = useAuth();
  
  // SECURITY: Super-user access only (role level 1000+)
  const isSuperUser = authIsSuperUser;
  if (!isSuperUser) {
    return (
      <AdminLayout 
        title="Access Denied" 
        subtitle="Super-user privileges required"
      >
        <div style={{ 
          padding: '48px', 
          textAlign: 'center',
          backgroundColor: '#fef2f2',
          borderRadius: '12px',
          border: '1px solid #fecaca'
        }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            backgroundColor: '#dc2626',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto'
          }}>
            <Bot style={{ width: '32px', height: '32px', color: 'white' }} />
          </div>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            color: '#991b1b', 
            margin: '0 0 12px 0' 
          }}>
            Access Restricted
          </h2>
          <p style={{ 
            fontSize: '16px', 
            color: '#7f1d1d', 
            margin: '0 0 16px 0',
            lineHeight: '1.5'
          }}>
            Creating AI model templates requires super-user privileges (role level 1000+).
            <br />
            Current role level: {user?.roleLevel || 0}
          </p>
          <p style={{ 
            fontSize: '14px', 
            color: '#991b1b', 
            margin: 0,
            fontStyle: 'italic'
          }}>
            Contact your system administrator to request elevated access.
          </p>
        </div>
      </AdminLayout>
    );
  }

  // Fetch AI models with proper authentication headers
  const { data: models = [], isLoading: modelsLoading, error, isError } = useQuery({
    queryKey: ["/api/ai-models"],
    queryFn: async () => {
      const sessionToken = localStorage.getItem('sessionToken') || localStorage.getItem('authToken');
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
        headers['X-Session-Token'] = sessionToken;
      }
      
      const response = await fetch('/api/ai-models', { headers });
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 30000,
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

  // Create model mutation with headers
  const createModelMutation = useMutation({
    mutationFn: async (data: z.infer<typeof modelSchema>) => {
      const sessionToken = localStorage.getItem('sessionToken') || localStorage.getItem('authToken');
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
        headers['X-Session-Token'] = sessionToken;
      }
      
      const response = await fetch('/api/ai-models', {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-models"] });
      setShowCreateDialog(false);
      resetForm();
      toast({ 
        title: "Model Created", 
        description: "AI model has been created successfully",
      });
    },
    onError: (error: any) => {
      console.error("Create model error:", error);
      toast({ 
        title: "Creation Failed", 
        description: error.message || "Failed to create AI model. Please try again."
      });
    },
  });

  // Update model mutation with headers
  const updateModelMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & z.infer<typeof modelSchema>) => {
      const sessionToken = localStorage.getItem('sessionToken') || localStorage.getItem('authToken');
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
        headers['X-Session-Token'] = sessionToken;
      }
      
      const response = await fetch(`/api/ai-models/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-models"] });
      setShowEditDialog(false);
      resetForm();
      toast({ 
        title: "Model Updated", 
        description: "AI model has been updated successfully",
      });
    },
    onError: (error: any) => {
      console.error("Update model error:", error);
      toast({ 
        title: "Update Failed", 
        description: error.message || "Failed to update AI model. Please try again."
      });
    },
  });

  // Delete model mutation with headers
  const deleteModelMutation = useMutation({
    mutationFn: async (id: number) => {
      const sessionToken = localStorage.getItem('sessionToken') || localStorage.getItem('authToken');
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
        headers['X-Session-Token'] = sessionToken;
      }
      
      const response = await fetch(`/api/ai-models/${id}`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-models"] });
      toast({ 
        title: "Model Deleted", 
        description: "AI model has been deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error("Delete model error:", error);
      toast({ 
        title: "Deletion Failed", 
        description: error.message || "Failed to delete AI model. Please try again."
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

  const handleEditModel = (model: any) => {
    setEditingModel(model);
    modelForm.reset({
      name: model.name,
      provider: model.provider,
      modelId: model.modelId,
      description: model.description || "",
      contextWindow: model.contextWindow,
      isEnabled: model.isEnabled,
      capabilities: Array.isArray(model.capabilities) ? model.capabilities : [],
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

  const handleProviderChange = (provider: string) => {
    const providerConfig = providers.find(p => p.value === provider);
    if (providerConfig) {
      modelForm.setValue("provider", provider);
      if (providerConfig.defaultEndpoint) {
        modelForm.setValue("apiEndpoint", providerConfig.defaultEndpoint);
      }
    }
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

  if (isError) {
    return (
      <AdminLayout title="Create AI Models" subtitle="Create and manage custom AI models from scratch">
        <div style={{ 
          padding: '48px', 
          textAlign: 'center',
          backgroundColor: '#fef2f2',
          borderRadius: '12px',
          border: '1px solid #fecaca'
        }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            color: '#991b1b', 
            margin: '0 0 12px 0' 
          }}>
            Error Loading Models
          </h2>
          <p style={{ 
            fontSize: '16px', 
            color: '#7f1d1d', 
            margin: '0 0 16px 0' 
          }}>
            {error?.message || 'Failed to load AI models'}
          </p>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/ai-models"] })}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Create AI Models" 
      subtitle="Create and manage custom AI models from scratch"
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
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <button style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <Plus style={{ width: '16px', height: '16px' }} />
                Create Model
              </button>
            </DialogTrigger>
            <DialogContent style={{ maxWidth: '80vw', maxHeight: '90vh', overflowY: 'auto' }}>
              <DialogHeader>
                <DialogTitle>Create New AI Model</DialogTitle>
                <DialogDescription>
                  Configure a custom AI model for your organization
                </DialogDescription>
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
        </div>

        {/* Models List */}
        <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
          gap: '24px'
        }}>
          {models.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '48px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '2px dashed #cbd5e1'
            }}>
              <Bot style={{ width: '48px', height: '48px', color: '#64748b', margin: '0 auto 16px auto' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#475569', margin: '0 0 8px 0' }}>
                No Models Created Yet
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                Create your first custom AI model to get started
              </p>
            </div>
          ) : (
            models.map((model: any) => (
              <div
                key={model.id}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 4px 0' }}>
                      {model.name}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 8px 0' }}>
                      {model.provider} • {model.modelId}
                    </p>
                    {model.description && (
                      <p style={{ fontSize: '14px', color: '#475569', margin: 0, lineHeight: '1.4' }}>
                        {model.description}
                      </p>
                    )}
                  </div>
                  <div style={{
                    backgroundColor: model.isEnabled ? '#10b981' : '#ef4444',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {model.isEnabled ? 'Active' : 'Disabled'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Context Window</p>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', margin: 0 }}>
                      {model.contextWindow?.toLocaleString() || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Temperature</p>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', margin: 0 }}>
                      {model.temperature || 0.7}
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>API Key</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <code style={{
                      backgroundColor: '#f1f5f9',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      color: '#475569',
                      flex: 1
                    }}>
                      {showApiKeys[model.id] ? model.apiKey : maskApiKey(model.apiKey || '')}
                    </code>
                    <button
                      onClick={() => toggleApiKeyVisibility(model.id)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: '4px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: '#64748b'
                      }}
                    >
                      {showApiKeys[model.id] ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    onClick={() => handleEditModel(model)}
                    style={{
                      backgroundColor: '#f8fafc',
                      color: '#475569',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    <Edit style={{ width: '14px', height: '14px' }} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteModel(model.id)}
                    style={{
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #fecaca',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    <Trash2 style={{ width: '14px', height: '14px' }} />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent style={{ maxWidth: '80vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <DialogHeader>
              <DialogTitle>Edit AI Model</DialogTitle>
              <DialogDescription>
                Modify the configuration for this AI model
              </DialogDescription>
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
          <TabsList style={{ display: 'grid', width: '100%', gridTemplateColumns: '1fr 1fr 1fr' }}>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="api">API Config</TabsTrigger>
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
                        {providers?.map((provider) => (
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
                  <FormLabel style={{ margin: 0 }}>Enable this model</FormLabel>
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="api" style={{ marginTop: '16px' }}>
            <div style={{ display: 'grid', gap: '16px' }}>
              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your API key..." 
                        {...field} 
                      />
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
                    <FormLabel>API Endpoint (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://api.example.com/v1" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" style={{ marginTop: '16px' }}>
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
            </div>
          </TabsContent>
        </Tabs>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '16px' }}>
          <button type="button" onClick={onCancel} style={{
            backgroundColor: '#f8fafc',
            color: '#475569',
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} style={{
            backgroundColor: isSubmitting ? '#9ca3af' : '#3b82f6',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {isSubmitting ? "Saving..." : "Save Model"}
          </button>
        </div>
      </form>
    </Form>
  );
}