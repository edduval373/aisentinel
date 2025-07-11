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
import { Bot, Plus, Edit2, Trash2, Key, Settings } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { apiRequest } from "@/lib/queryClient";

const modelSchema = z.object({
  name: z.string().min(1, "Model name is required"),
  provider: z.string().min(1, "Provider is required"),
  modelId: z.string().min(1, "Model ID is required"),
  description: z.string().optional(),
  contextWindow: z.number().min(1, "Context window must be at least 1"),
  isEnabled: z.boolean().default(true),
  capabilities: z.array(z.string()).default([]),
  apiEndpoint: z.string().url("Must be a valid URL").optional(),
  maxTokens: z.number().min(1, "Max tokens must be at least 1").optional(),
  temperature: z.number().min(0).max(2).optional(),
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
  apiEndpoint?: string;
  maxTokens?: number;
  temperature?: number;
}

const providers = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "perplexity", label: "Perplexity" },
  { value: "google", label: "Google" },
  { value: "cohere", label: "Cohere" },
  { value: "custom", label: "Custom" },
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
      apiEndpoint: "",
      maxTokens: 1000,
      temperature: 0.7,
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
    if (editingModel) {
      updateModelMutation.mutate({ id: editingModel.id, data });
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
      capabilities: model.capabilities,
      apiEndpoint: model.apiEndpoint || "",
      maxTokens: model.maxTokens || 1000,
      temperature: model.temperature || 0.7,
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
    modelForm.reset();
  };

  if (modelsLoading) {
    return (
      <AdminLayout title="Create AI Models" subtitle="Create and manage custom AI models from scratch">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Create AI Models" subtitle="Create and manage custom AI models from scratch">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold ml-9">Custom AI Models</h2>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Create Model
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New AI Model</DialogTitle>
              </DialogHeader>
              <Form {...modelForm}>
                <form onSubmit={modelForm.handleSubmit(onSubmitModel)} className="space-y-4">
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                    name="apiEndpoint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Endpoint (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://api.openai.com/v1/chat/completions" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-3 gap-4">
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
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createModelMutation.isPending}>
                      {createModelMutation.isPending ? "Creating..." : "Create Model"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model: AiModel) => (
            <Card key={model.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-base">{model.name}</CardTitle>
                  </div>
                  <Badge variant={model.isEnabled ? "default" : "secondary"}>
                    {model.isEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Provider:</span>
                    <span className="font-medium">{model.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Model ID:</span>
                    <span className="font-medium">{model.modelId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Context:</span>
                    <span className="font-medium">{model.contextWindow.toLocaleString()}</span>
                  </div>
                </div>
                {model.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{model.description}</p>
                )}
                {model.capabilities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {model.capabilities.slice(0, 3).map((capability) => (
                      <Badge key={capability} variant="outline" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                    {model.capabilities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{model.capabilities.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditModel(model)}
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteModel(model.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit AI Model</DialogTitle>
            </DialogHeader>
            <Form {...modelForm}>
              <form onSubmit={modelForm.handleSubmit(onSubmitModel)} className="space-y-4">
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                  name="apiEndpoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Endpoint (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://api.openai.com/v1/chat/completions" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
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