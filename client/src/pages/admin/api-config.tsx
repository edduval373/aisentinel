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
import { useToast } from "@/hooks/use-toast";
import { Key, Plus, Edit2, Trash2, Eye, EyeOff, TestTube } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { isDemoModeActive } from "@/utils/demoMode";
import DemoInfoDialog from "@/components/demo/DemoInfoDialog";
import { useDemoDialog } from "@/hooks/useDemoDialog";

const apiConfigSchema = z.object({
  provider: z.string().min(1, "Provider is required"),
  apiKey: z.string().min(1, "API key is required"),
  endpoint: z.string().url("Must be a valid URL").optional(),
  organizationId: z.string().optional(),
  maxRetries: z.number().min(0).max(10).default(3),
  timeout: z.number().min(1000).max(60000).default(30000),
  rateLimit: z.number().min(1).max(1000).default(100),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
});

interface ApiConfig {
  id: number;
  provider: string;
  apiKey: string;
  endpoint?: string;
  organizationId?: string;
  maxRetries: number;
  timeout: number;
  rateLimit: number;
  isActive: boolean;
  description?: string;
  lastTested?: string;
  isWorking?: boolean;
}

const providers = [
  { value: "openai", label: "OpenAI", defaultEndpoint: "https://api.openai.com/v1" },
  { value: "anthropic", label: "Anthropic", defaultEndpoint: "https://api.anthropic.com/v1" },
  { value: "perplexity", label: "Perplexity", defaultEndpoint: "https://api.perplexity.ai" },
  { value: "google", label: "Google Gemini", defaultEndpoint: "https://generativelanguage.googleapis.com/v1" },
  { value: "cohere", label: "Cohere", defaultEndpoint: "https://api.cohere.ai/v1" },
  { value: "custom", label: "Custom", defaultEndpoint: "" },
];

export default function ApiConfiguration() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ApiConfig | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<Record<number, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Demo mode detection
  const { user } = useAuth();
  const isDemoMode = isDemoModeActive(user);
  const { showDialog, openDialog, closeDialog } = useDemoDialog('api-config');

  // Fetch API configurations
  const { data: apiConfigs = [], isLoading: configsLoading } = useQuery({
    queryKey: ["/api/admin/api-configs"],
  });

  const configForm = useForm<z.infer<typeof apiConfigSchema>>({
    resolver: zodResolver(apiConfigSchema),
    defaultValues: {
      provider: "",
      apiKey: "",
      endpoint: "",
      organizationId: "",
      maxRetries: 3,
      timeout: 30000,
      rateLimit: 100,
      isActive: true,
      description: "",
    },
  });

  // Watch provider changes to update endpoint
  const selectedProvider = configForm.watch("provider");

  // Create API config mutation
  const createConfigMutation = useMutation({
    mutationFn: (data: z.infer<typeof apiConfigSchema>) =>
      apiRequest("/api/admin/api-configs", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-configs"] });
      setShowCreateDialog(false);
      configForm.reset();
      toast({ title: "Success", description: "API configuration created successfully" });
    },
    onError: (error: any) => {
      console.error("API config creation error:", error);
      toast({ title: "Error", description: "Failed to create API configuration", variant: "destructive" });
    },
  });

  // Update API config mutation
  const updateConfigMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: z.infer<typeof apiConfigSchema> }) =>
      apiRequest(`/api/admin/api-configs/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-configs"] });
      setShowEditDialog(false);
      setEditingConfig(null);
      configForm.reset();
      toast({ title: "Success", description: "API configuration updated successfully" });
    },
    onError: (error: any) => {
      console.error("API config update error:", error);
      toast({ title: "Error", description: "Failed to update API configuration", variant: "destructive" });
    },
  });

  // Delete API config mutation
  const deleteConfigMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/admin/api-configs/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-configs"] });
      toast({ title: "Success", description: "API configuration deleted successfully" });
    },
    onError: (error: any) => {
      console.error("API config deletion error:", error);
      toast({ title: "Error", description: "Failed to delete API configuration", variant: "destructive" });
    },
  });

  // Test API config mutation
  const testConfigMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/admin/api-configs/${id}/test`, "POST"),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-configs"] });
      toast({ 
        title: "Success", 
        description: "API configuration test successful",
        variant: "default"
      });
    },
    onError: (error: any) => {
      console.error("API config test error:", error);
      toast({ 
        title: "Test Failed", 
        description: "API configuration test failed. Please check your credentials.",
        variant: "destructive"
      });
    },
  });

  const onSubmitConfig = (data: z.infer<typeof apiConfigSchema>) => {
    if (editingConfig) {
      updateConfigMutation.mutate({ id: editingConfig.id, data });
    } else {
      createConfigMutation.mutate(data);
    }
  };

  const handleEditConfig = (config: ApiConfig) => {
    setEditingConfig(config);
    configForm.reset({
      provider: config.provider,
      apiKey: config.apiKey,
      endpoint: config.endpoint || "",
      organizationId: config.organizationId || "",
      maxRetries: config.maxRetries,
      timeout: config.timeout,
      rateLimit: config.rateLimit,
      isActive: config.isActive,
      description: config.description || "",
    });
    setShowEditDialog(true);
  };

  const handleDeleteConfig = (id: number) => {
    if (confirm("Are you sure you want to delete this API configuration? This action cannot be undone.")) {
      deleteConfigMutation.mutate(id);
    }
  };

  const handleTestConfig = (id: number) => {
    testConfigMutation.mutate(id);
  };

  const toggleApiKeyVisibility = (id: number) => {
    setShowApiKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const resetForm = () => {
    setEditingConfig(null);
    configForm.reset();
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 4) + "•".repeat(key.length - 8) + key.substring(key.length - 4);
  };

  // Update endpoint when provider changes
  const handleProviderChange = (provider: string) => {
    const providerConfig = providers.find(p => p.value === provider);
    if (providerConfig?.defaultEndpoint) {
      configForm.setValue("endpoint", providerConfig.defaultEndpoint);
    }
    configForm.setValue("provider", provider);
  };

  if (configsLoading) {
    return (
      <AdminLayout title="API Configuration" subtitle="Manage API keys and settings for AI providers">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="API Configuration" subtitle="Manage API keys and settings for AI providers">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold ml-9">API Configurations</h2>
          {isDemoMode ? (
            <Button onClick={() => openDialog('create-api-config')}>
              <Plus className="w-4 h-4 mr-2" />
              Add API Config
            </Button>
          ) : (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add API Config
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add API Configuration</DialogTitle>
                <DialogDescription>
                  Configure API keys and endpoints for AI service providers.
                </DialogDescription>
              </DialogHeader>
              <Form {...configForm}>
                <form onSubmit={configForm.handleSubmit(onSubmitConfig)} className="space-y-4">
                  <FormField
                    control={configForm.control}
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
                  <FormField
                    control={configForm.control}
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
                    control={configForm.control}
                    name="endpoint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Endpoint</FormLabel>
                        <FormControl>
                          <Input placeholder="https://api.example.com/v1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={configForm.control}
                    name="organizationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization ID (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="org-..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={configForm.control}
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
                      control={configForm.control}
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
                      control={configForm.control}
                      name="rateLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate Limit</FormLabel>
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
                  <FormField
                    control={configForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Configuration description..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={configForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Active Configuration</FormLabel>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createConfigMutation.isPending}>
                      {createConfigMutation.isPending ? "Creating..." : "Create Config"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Configurations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {apiConfigs.map((config: ApiConfig) => (
            <Card key={config.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Key className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-base capitalize">{config.provider}</CardTitle>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant={config.isActive ? "default" : "secondary"}>
                      {config.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {config.isWorking !== undefined && (
                      <Badge variant={config.isWorking ? "default" : "destructive"}>
                        {config.isWorking ? "Working" : "Error"}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API Key:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono">
                        {showApiKeys[config.id] ? config.apiKey : maskApiKey(config.apiKey)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleApiKeyVisibility(config.id)}
                      >
                        {showApiKeys[config.id] ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {config.endpoint && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Endpoint:</span>
                      <span className="text-sm font-medium truncate max-w-48">{config.endpoint}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Rate Limit:</span>
                    <span className="text-sm font-medium">{config.rateLimit}/min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Timeout:</span>
                    <span className="text-sm font-medium">{config.timeout}ms</span>
                  </div>
                  {config.lastTested && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Tested:</span>
                      <span className="text-sm font-medium">
                        {new Date(config.lastTested).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                {config.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{config.description}</p>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isDemoMode ? () => openDialog('test-api-config') : () => handleTestConfig(config.id)}
                    disabled={!isDemoMode && testConfigMutation.isPending}
                  >
                    <TestTube className="w-3 h-3 mr-1" />
                    Test
                  </Button>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={isDemoMode ? () => openDialog('edit-api-config') : () => handleEditConfig(config)}
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={isDemoMode ? () => openDialog('delete-api-config') : () => handleDeleteConfig(config.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit API Configuration</DialogTitle>
              <DialogDescription>
                Modify API keys and endpoints for AI service providers.
              </DialogDescription>
            </DialogHeader>
            <Form {...configForm}>
              <form onSubmit={configForm.handleSubmit(onSubmitConfig)} className="space-y-4">
                <FormField
                  control={configForm.control}
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
                <FormField
                  control={configForm.control}
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
                  control={configForm.control}
                  name="endpoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Endpoint</FormLabel>
                      <FormControl>
                        <Input placeholder="https://api.example.com/v1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="organizationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization ID (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="org-..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={configForm.control}
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
                    control={configForm.control}
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
                    control={configForm.control}
                    name="rateLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate Limit</FormLabel>
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
                <FormField
                  control={configForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Configuration description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Active Configuration</FormLabel>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateConfigMutation.isPending}>
                    {updateConfigMutation.isPending ? "Updating..." : "Update Config"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Demo Info Dialog */}
      <DemoInfoDialog
        isOpen={showDialog}
        onClose={closeDialog}
        title="API Configuration"
        description="This feature allows you to manage API keys and settings for different AI providers. In the full version, you can add, edit, test, and delete API configurations for providers like OpenAI, Anthropic, Google, Cohere, and custom endpoints."
        features={[
          "Add API configurations for multiple providers",
          "Secure API key management with masking",
          "Test API connections and validate credentials",
          "Configure rate limits and timeout settings",
          "Enable/disable configurations as needed",
          "Organization ID support for enterprise accounts"
        ]}
      />
    </AdminLayout>
  );
}