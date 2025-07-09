import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Settings, Plus } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import type { AiModel } from "@shared/schema";

export default function AdminModels() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddModelDialogOpen, setIsAddModelDialogOpen] = useState(false);
  const [newModel, setNewModel] = useState({
    name: '',
    provider: '',
    modelId: '',
    isEnabled: true
  });

  // Fetch AI models from database
  const { data: aiModels, isLoading: modelsLoading } = useQuery<AiModel[]>({
    queryKey: ['/api/admin/ai-models'],
    enabled: isAuthenticated && !isLoading,
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  // Update AI model mutation
  const updateAiModelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AiModel> }) => {
      const response = await apiRequest("PATCH", `/api/admin/ai-models/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-models'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-models'] });
      toast({
        title: "Success",
        description: "AI model updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update AI model",
        variant: "destructive",
      });
    },
  });

  // Add AI model mutation
  const addAiModelMutation = useMutation({
    mutationFn: async (modelData: typeof newModel) => {
      const response = await apiRequest("POST", "/api/admin/ai-models", modelData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-models'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-models'] });
      toast({
        title: "Success",
        description: "AI model added successfully",
      });
      setIsAddModelDialogOpen(false);
      setNewModel({ name: '', provider: '', modelId: '', isEnabled: true });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add AI model",
        variant: "destructive",
      });
    },
  });

  const handleModelToggle = (model: AiModel, enabled: boolean) => {
    updateAiModelMutation.mutate({
      id: model.id,
      data: { isEnabled: enabled }
    });
  };

  const handleAddModel = () => {
    if (!newModel.name || !newModel.provider || !newModel.modelId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    addAiModelMutation.mutate(newModel);
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'anthropic':
        return 'text-sentinel-green';
      case 'openai':
        return 'text-blue-600';
      case 'perplexity':
        return 'text-purple-600';
      default:
        return 'text-slate-600';
    }
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'anthropic':
        return 'Anthropic';
      case 'openai':
        return 'OpenAI';
      case 'perplexity':
        return 'Perplexity';
      default:
        return provider;
    }
  };

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (!user?.role?.includes('admin') && !user?.email?.includes('admin') && !user?.email?.includes('ed.duval15@gmail.com')))) {
      toast({
        title: "Unauthorized", 
        description: "You need admin privileges to access this page.",
        variant: "destructive",
      });
      window.location.href = "/";
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  if (isLoading || modelsLoading) {
    return (
      <AdminLayout title="AI Models" subtitle="Manage AI model configurations and availability">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sentinel-blue"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="AI Models" subtitle="Manage AI model configurations and availability">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Dialog open={isAddModelDialogOpen} onOpenChange={setIsAddModelDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Model
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New AI Model</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="model-name">Model Name</Label>
                  <Input
                    id="model-name"
                    value={newModel.name}
                    onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                    placeholder="e.g., GPT-4 Turbo"
                  />
                </div>
                <div>
                  <Label htmlFor="model-provider">Provider</Label>
                  <Select value={newModel.provider} onValueChange={(value) => setNewModel({ ...newModel, provider: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="perplexity">Perplexity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="model-id">Model ID</Label>
                  <Input
                    id="model-id"
                    value={newModel.modelId}
                    onChange={(e) => setNewModel({ ...newModel, modelId: e.target.value })}
                    placeholder="e.g., gpt-4-turbo"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newModel.isEnabled}
                    onCheckedChange={(checked) => setNewModel({ ...newModel, isEnabled: checked })}
                  />
                  <Label>Enable model</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddModelDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddModel} disabled={addAiModelMutation.isPending}>
                    {addAiModelMutation.isPending ? 'Adding...' : 'Add Model'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

      <div className="grid gap-6">
        {/* Dynamic AI Models */}
        {aiModels?.map((model) => (
          <Card key={model.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bot className={`w-5 h-5 ${getProviderColor(model.provider)}`} />
                  <CardTitle>{model.name}</CardTitle>
                  <Badge variant="secondary">{getProviderBadge(model.provider)}</Badge>
                </div>
                <Switch 
                  checked={model.isEnabled} 
                  onCheckedChange={(checked) => handleModelToggle(model, checked)}
                  disabled={updateAiModelMutation.isPending}
                />
              </div>
              <CardDescription>
                {model.provider === 'anthropic' && 'Advanced reasoning and analysis capabilities with enhanced safety'}
                {model.provider === 'openai' && 'Latest multimodal model with vision and advanced reasoning'}
                {model.provider === 'perplexity' && 'Internet-connected responses with real-time information and citations'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium text-slate-900">Provider</p>
                  <p className="text-slate-600">{getProviderBadge(model.provider)}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Model ID</p>
                  <p className="text-slate-600">{model.modelId}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Max Tokens</p>
                  <p className="text-slate-600">4,096</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Cost/1K tokens</p>
                  <p className="text-slate-600">
                    {model.provider === 'anthropic' && '$0.003'}
                    {model.provider === 'openai' && '$0.005'}
                    {model.provider === 'perplexity' && '$0.002'}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
                <Button variant="outline" size="sm">
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* No models message */}
        {!aiModels || aiModels.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Bot className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No AI models configured yet.</p>
              <Button className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Model
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Model Performance Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Model Performance</CardTitle>
            <CardDescription>Usage statistics and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">1,247</p>
                <p className="text-sm text-slate-600">Total Requests Today</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">1.2s</p>
                <p className="text-sm text-slate-600">Avg Response Time</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">99.9%</p>
                <p className="text-sm text-slate-600">Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </AdminLayout>
  );
}