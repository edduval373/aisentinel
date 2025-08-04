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
// Template schema - NO company-specific API keys or config
const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  provider: z.string().min(1, "Provider is required"),
  modelId: z.string().min(1, "Model ID is required"),
  description: z.string().optional(),
  contextWindow: z.number().min(1).max(2000000),
  isEnabled: z.boolean().default(true),
  capabilities: z.array(z.string()).optional(),
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
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
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

  // Fetch AI model templates with proper authentication headers
  const { data: templates = [], isLoading: templatesLoading, error, isError, refetch } = useQuery({
    queryKey: ["/api/admin/ai-model-templates"],
    queryFn: async () => {
      console.log(`🔄 [TEMPLATES QUERY] Starting template fetch...`);
      const sessionToken = localStorage.getItem('sessionToken') || localStorage.getItem('authToken');
      console.log(`🔄 [TEMPLATES QUERY] Session token found:`, !!sessionToken);
      
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
        headers['X-Session-Token'] = sessionToken;
      }
      
      console.log(`🔄 [TEMPLATES QUERY] Making request to /api/admin/ai-model-templates`);
      const response = await fetch('/api/admin/ai-model-templates', { headers });
      console.log(`🔄 [TEMPLATES QUERY] Response status:`, response.status);
      
      if (!response.ok) {
        console.error(`❌ [TEMPLATES QUERY] Request failed:`, response.status, response.statusText);
        throw new Error(`Failed to fetch templates: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ [TEMPLATES QUERY] Received ${data.length} templates:`, data.map(t => ({ id: t.id, name: t.name })));
      return data;
    },
    retry: 2,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch when invalidated
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const templateForm = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      provider: "",
      modelId: "",
      description: "",
      contextWindow: 4096,
      isEnabled: true,
      capabilities: [],
    },
  });

  // Create template mutation with headers
  const createTemplateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof templateSchema>) => {
      const sessionToken = localStorage.getItem('sessionToken') || localStorage.getItem('authToken');
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
        headers['X-Session-Token'] = sessionToken;
      }
      
      const response = await fetch('/api/admin/ai-model-templates', {
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
    onSuccess: async (data) => {
      console.log(`✅ [TEMPLATE CREATE] Success callback executed with data:`, data);
      console.log(`✅ [TEMPLATE CREATE] Invalidating queries...`);
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-model-templates"] });
      console.log(`✅ [TEMPLATE CREATE] Refetching templates manually...`);
      await refetch();
      console.log(`✅ [TEMPLATE CREATE] Setting showCreateDialog to false...`);
      setShowCreateDialog(false);
      console.log(`✅ [TEMPLATE CREATE] Resetting form...`);
      templateForm.reset();
      console.log(`✅ [TEMPLATE CREATE] Showing success toast...`);
      toast({ 
        title: "Template Created", 
        description: "AI model template has been created successfully",
      });
      console.log(`✅ [TEMPLATE CREATE] Success callback completed - modal should close`);
    },
    onError: (error: any) => {
      console.error("Create template error:", error);
      toast({ 
        title: "Creation Failed", 
        description: error.message || "Failed to create AI model template. Please try again."
      });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & z.infer<typeof templateSchema>) => {
      console.log(`🔧 [TEMPLATE UPDATE] Starting update for template ID: ${id}`);
      console.log(`🔧 [TEMPLATE UPDATE] Update data:`, data);
      
      const sessionToken = localStorage.getItem('sessionToken') || localStorage.getItem('authToken');
      console.log(`🔧 [TEMPLATE UPDATE] Session token found:`, !!sessionToken);
      
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
        headers['X-Session-Token'] = sessionToken;
        console.log(`🔧 [TEMPLATE UPDATE] Auth headers set with token: ${sessionToken.substring(0, 10)}...`);
      }
      
      const url = `/api/admin/ai-model-templates/${id}`;
      console.log(`🔧 [TEMPLATE UPDATE] Making PUT request to: ${url}`);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });
      
      console.log(`🔧 [TEMPLATE UPDATE] Response status: ${response.status}`);
      console.log(`🔧 [TEMPLATE UPDATE] Response ok: ${response.ok}`);
      
      if (!response.ok) {
        console.error(`❌ [TEMPLATE UPDATE] Request failed with status ${response.status}`);
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error(`❌ [TEMPLATE UPDATE] Error data:`, errorData);
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`✅ [TEMPLATE UPDATE] Success:`, result);
      return result;
    },
    onSuccess: async (data) => {
      console.log(`✅ [TEMPLATE UPDATE] Success callback executed with data:`, data);
      console.log(`✅ [TEMPLATE UPDATE] Invalidating queries...`);
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-model-templates"] });
      console.log(`✅ [TEMPLATE UPDATE] Refetching templates manually...`);
      await refetch();
      console.log(`✅ [TEMPLATE UPDATE] Setting showEditDialog to false...`);
      setShowEditDialog(false);
      console.log(`✅ [TEMPLATE UPDATE] Clearing editing template...`);
      setEditingTemplate(null);
      console.log(`✅ [TEMPLATE UPDATE] Resetting form...`);
      templateForm.reset();
      console.log(`✅ [TEMPLATE UPDATE] Showing success toast...`);
      toast({ 
        title: "Template Updated", 
        description: "AI model template has been updated successfully",
      });
      console.log(`✅ [TEMPLATE UPDATE] Success callback completed - modal should close`);
    },
    onError: (error: any) => {
      console.error("❌ [TEMPLATE UPDATE] Error callback executed:", error);
      console.error("❌ [TEMPLATE UPDATE] Error message:", error.message);
      console.error("❌ [TEMPLATE UPDATE] Full error object:", error);
      toast({ 
        title: "Update Failed", 
        description: error.message || "Failed to update AI model template. Please try again."
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const sessionToken = localStorage.getItem('sessionToken') || localStorage.getItem('authToken');
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
        headers['X-Session-Token'] = sessionToken;
      }
      
      const response = await fetch(`/api/admin/ai-model-templates/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-model-templates"] });
      toast({ 
        title: "Template Deleted", 
        description: "AI model template has been deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error("Delete template error:", error);
      toast({ 
        title: "Deletion Failed", 
        description: error.message || "Failed to delete AI model template. Please try again."
      });
    },
  });

  const onSubmitTemplate = (data: z.infer<typeof templateSchema>) => {
    console.log('🚀 Form submission triggered with data:', data);
    console.log('🚀 Form validation state:', templateForm.formState);
    console.log('🚀 Form errors:', templateForm.formState.errors);
    
    // Check authentication tokens
    const sessionToken = localStorage.getItem('sessionToken');
    const authToken = localStorage.getItem('authToken');
    console.log('🔐 Authentication check:', { 
      sessionToken: sessionToken ? 'present' : 'missing',
      authToken: authToken ? 'present' : 'missing',
      user: user ? 'authenticated' : 'not authenticated',
      isSuperUser
    });
    
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, ...data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    templateForm.reset({
      name: template.name,
      provider: template.provider,
      modelId: template.modelId,
      description: template.description || "",
      contextWindow: template.contextWindow,
      isEnabled: template.isEnabled,
      capabilities: Array.isArray(template.capabilities) ? template.capabilities : [],
    });
    setShowEditDialog(true);
  };

  const handleDeleteTemplate = (id: number) => {
    if (confirm("Are you sure you want to delete this universal template? This will affect all companies that might use it.")) {
      deleteTemplateMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setActiveTab("basic");
    templateForm.reset();
    setEditingTemplate(null);
  };

  const handleProviderChange = (provider: string) => {
    templateForm.setValue("provider", provider);
  };

  if (templatesLoading) {
    return (
      <AdminLayout title="AI Model Templates" subtitle="Loading templates...">
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
      <AdminLayout title="AI Model Templates" subtitle="Error loading templates">
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
    <AdminLayout title="AI Model Templates" subtitle="Create universal AI model templates for companies to use (no API keys required)">
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Debug Authentication Info */}
        <div style={{ 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '6px', 
          padding: '12px', 
          marginBottom: '16px' 
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
            <strong>Auth Debug:</strong> User: {user ? 'authenticated' : 'not authenticated'}, 
            SuperUser: {isSuperUser ? 'yes' : 'no'}, 
            Tokens: {localStorage.getItem('sessionToken') ? 'session' : 'none'}/{localStorage.getItem('authToken') ? 'auth' : 'none'}
          </p>
        </div>
        
        {/* Header Section */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center',
          marginBottom: '8px'
        }}>
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
                Create Template
              </button>
            </DialogTrigger>
            <DialogContent style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
              <DialogHeader>
                <DialogTitle>Create New AI Model Template</DialogTitle>
                <DialogDescription>
                  Create a universal AI model template. No API keys needed - companies configure their own.
                </DialogDescription>
              </DialogHeader>
              <TemplateForm 
                form={templateForm}
                onSubmit={onSubmitTemplate}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                providers={providers}
                capabilities={capabilities}
                handleProviderChange={handleProviderChange}
                isSubmitting={createTemplateMutation.isPending}
                onCancel={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
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
          {/* Debug: Display template count and list */}
          {console.log(`🎨 [TEMPLATES RENDER] Rendering ${templates.length} templates:`, templates.map(t => ({ id: t.id, name: t.name })))}
          {templates.length === 0 ? (
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
                No Templates Created Yet
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                Create your first AI model template to get started
              </p>
            </div>
          ) : (
            templates.map((template: any) => (
              <div
                key={template.id}
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
                      {template.name}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 8px 0' }}>
                      {template.provider} • {template.modelId}
                    </p>
                    {template.description && (
                      <p style={{ fontSize: '14px', color: '#475569', margin: 0, lineHeight: '1.4' }}>
                        {template.description}
                      </p>
                    )}
                  </div>
                  <div style={{
                    backgroundColor: template.isEnabled ? '#10b981' : '#ef4444',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {template.isEnabled ? 'Active' : 'Disabled'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Context Window</p>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', margin: 0 }}>
                      {template.contextWindow?.toLocaleString() || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Capabilities</p>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', margin: 0 }}>
                      {template.capabilities?.length || 0} configured
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Template Type</p>
                  <div style={{
                    backgroundColor: '#f0f9ff',
                    color: '#0369a1',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    🌐 Universal Template - Companies configure their own API keys
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <button
                    onClick={() => handleEditTemplate(template)}
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
                    onClick={() => handleDeleteTemplate(template.id)}
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
          <DialogContent style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <DialogHeader>
              <DialogTitle>Edit Universal Template</DialogTitle>
              <DialogDescription>
                Modify this universal AI model template. Changes will affect all companies using this template.
              </DialogDescription>
            </DialogHeader>
            <TemplateForm 
              form={templateForm}
              onSubmit={onSubmitTemplate}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              providers={providers}
              capabilities={capabilities}
              handleProviderChange={handleProviderChange}
              isSubmitting={updateTemplateMutation.isPending}
              onCancel={() => {
                setShowEditDialog(false);
                resetForm();
              }}
            />
          </DialogContent>
        </Dialog>

      </div>
    </AdminLayout>
  );
}

// Template Form Component (NO API keys)
function TemplateForm({ 
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
          <TabsList style={{ display: 'grid', width: '100%', gridTemplateColumns: '1fr 1fr' }}>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
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
          

          
          <TabsContent value="advanced" style={{ marginTop: '16px' }}>
            <div style={{ display: 'grid', gap: '16px' }}>
              <FormField
                control={form.control}
                name="capabilities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capabilities (Optional)</FormLabel>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
                      {capabilities.map((capability) => (
                        <label key={capability} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={field.value?.includes(capability) || false}
                            onChange={(e) => {
                              const currentCapabilities = field.value || [];
                              if (e.target.checked) {
                                field.onChange([...currentCapabilities, capability]);
                              } else {
                                field.onChange(currentCapabilities.filter((c: string) => c !== capability));
                              }
                            }}
                            style={{ marginRight: '4px' }}
                          />
                          <span style={{ fontSize: '14px', textTransform: 'capitalize' }}>
                            {capability.replace('-', ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
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
          <button 
            type="submit" 
            disabled={isSubmitting}
            onClick={(e) => {
              console.log('🔥 Button clicked - triggering form submission');
              e.preventDefault();
              form.handleSubmit(onSubmit)();
            }}
            style={{
              backgroundColor: isSubmitting ? '#9ca3af' : '#3b82f6',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {isSubmitting ? "Processing..." : "Save Template"}
          </button>
        </div>
      </form>
    </Form>
  );
}