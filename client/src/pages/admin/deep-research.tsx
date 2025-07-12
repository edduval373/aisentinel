import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { Brain, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AiModel {
  id: number;
  name: string;
  provider: string;
  modelName: string;
  isEnabled: boolean;
}

interface DeepResearchConfig {
  id: number;
  companyId: number;
  isEnabled: boolean;
  summaryModelId: number | null;
  includedModels: number[];
}

export default function DeepResearch() {
  const queryClient = useQueryClient();
  const [localConfig, setLocalConfig] = useState<Partial<DeepResearchConfig>>({
    isEnabled: false,
    summaryModelId: null,
    includedModels: [],
  });

  // Fetch AI models
  const { data: aiModels = [], isLoading: modelsLoading } = useQuery<AiModel[]>({
    queryKey: ['/api/ai-models'],
  });

  // Fetch Deep Research config
  const { data: config, isLoading: configLoading } = useQuery<DeepResearchConfig>({
    queryKey: ['/api/deep-research-config'],
    onSuccess: (data) => {
      if (data) {
        setLocalConfig(data);
      }
    },
  });

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (configData: Partial<DeepResearchConfig>) => {
      const method = config?.id ? 'PUT' : 'POST';
      const url = config?.id ? `/api/deep-research-config/${config.id}` : '/api/deep-research-config';
      
      return await apiRequest(url, {
        method,
        body: configData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuration Saved",
        description: "Deep Research settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/deep-research-config'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration",
        variant: "destructive",
      });
    },
  });

  const handleToggleEnabled = (enabled: boolean) => {
    setLocalConfig(prev => ({ ...prev, isEnabled: enabled }));
  };

  const handleSummaryModelChange = (modelId: string) => {
    setLocalConfig(prev => ({ ...prev, summaryModelId: parseInt(modelId) }));
  };

  const handleModelIncludeToggle = (modelId: number, included: boolean) => {
    setLocalConfig(prev => ({
      ...prev,
      includedModels: included
        ? [...(prev.includedModels || []), modelId]
        : (prev.includedModels || []).filter(id => id !== modelId)
    }));
  };

  const handleSaveConfiguration = () => {
    if (localConfig.isEnabled && !localConfig.summaryModelId) {
      toast({
        title: "Validation Error",
        description: "Please select a summary model when Deep Research is enabled.",
        variant: "destructive",
      });
      return;
    }

    if (localConfig.isEnabled && (!localConfig.includedModels || localConfig.includedModels.length === 0)) {
      toast({
        title: "Validation Error",
        description: "Please select at least one model to include in Deep Research.",
        variant: "destructive",
      });
      return;
    }

    saveConfigMutation.mutate(localConfig);
  };

  const enabledModels = aiModels.filter(model => model.isEnabled);
  const availableModels = enabledModels.filter(model => model.id !== localConfig.summaryModelId);

  if (modelsLoading || configLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Deep Research" subtitle="Configure multi-model AI research with comprehensive analysis and summarization">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Deep Research Configuration</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Set up advanced multi-model AI processing for comprehensive research and analysis
            </p>
          </div>
          <Button
            onClick={handleSaveConfiguration}
            disabled={saveConfigMutation.isPending}
            className="flex items-center gap-2"
          >
            {saveConfigMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Save Configuration
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Deep Research Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="deep-research-enabled" className="text-base font-medium">
                  Enable Deep Research
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  When enabled, users can submit prompts to multiple AI models simultaneously
                </p>
              </div>
              <Switch
                id="deep-research-enabled"
                checked={localConfig.isEnabled || false}
                onCheckedChange={handleToggleEnabled}
              />
            </div>

            {localConfig.isEnabled && (
              <>
                <Separator />
                
                {/* Summary Model Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Summary Model
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Select the AI model that will create the final comprehensive summary of all model responses
                  </p>
                  <Select
                    value={localConfig.summaryModelId?.toString() || ""}
                    onValueChange={handleSummaryModelChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a model for summarization" />
                    </SelectTrigger>
                    <SelectContent>
                      {enabledModels.map((model) => (
                        <SelectItem key={model.id} value={model.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{model.provider}</Badge>
                            {model.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Model Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    Include Models in Deep Research
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Select which AI models to include in the Deep Research process. Each selected model will process the prompt independently.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableModels.map((model) => {
                      const isIncluded = localConfig.includedModels?.includes(model.id) || false;
                      
                      return (
                        <Card key={model.id} className={`cursor-pointer transition-all ${
                          isIncluded 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'hover:border-gray-300 dark:hover:border-gray-600'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                id={`model-${model.id}`}
                                checked={isIncluded}
                                onCheckedChange={(checked) => 
                                  handleModelIncludeToggle(model.id, checked as boolean)
                                }
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Label 
                                    htmlFor={`model-${model.id}`}
                                    className="font-medium cursor-pointer"
                                  >
                                    {model.name}
                                  </Label>
                                  <Badge variant="outline" className="text-xs">
                                    {model.provider}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  {model.modelName}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {availableModels.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>No additional models available for Deep Research.</p>
                      <p className="text-sm">Configure more AI models to enable Deep Research.</p>
                    </div>
                  )}
                </div>

                {/* Information Panel */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        How Deep Research Works
                      </p>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• Users will see "Deep Research" as an option in the AI model selector</li>
                        <li>• The prompt is sent to all selected models simultaneously</li>
                        <li>• Individual responses are collected and combined</li>
                        <li>• The summary model creates a comprehensive analysis</li>
                        <li>• Processing may take several minutes depending on model count</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}