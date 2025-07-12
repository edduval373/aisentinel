
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
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
}

export default function DeepResearch() {
  const queryClient = useQueryClient();
  const [localConfig, setLocalConfig] = useState<Partial<DeepResearchConfig>>({
    isEnabled: false,
    summaryModelId: null,
  });
  const [selectedModels, setSelectedModels] = useState<Set<number>>(new Set());

  // Fetch AI models
  const { data: aiModels = [], isLoading: modelsLoading } = useQuery<AiModel[]>({
    queryKey: ['/api/ai-models'],
  });

  // Fetch Deep Research config
  const { data: config, isLoading: configLoading } = useQuery<DeepResearchConfig>({
    queryKey: ['/api/deep-research-config'],
  });

  // Update local config when data is fetched
  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  // Initialize selected models with all enabled models
  useEffect(() => {
    if (aiModels.length > 0) {
      const enabledModelIds = aiModels.filter(model => model.isEnabled).map(model => model.id);
      setSelectedModels(new Set(enabledModelIds));
    }
  }, [aiModels]);

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

  const handleModelToggle = (modelId: number, checked: boolean) => {
    setSelectedModels(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(modelId);
      } else {
        newSet.delete(modelId);
      }
      return newSet;
    });
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

    saveConfigMutation.mutate(localConfig);
  };

  const enabledModels = aiModels.filter(model => model.isEnabled);

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
    <AdminLayout title="Deep Research" subtitle="Set up advanced multi-model AI processing for comprehensive research and analysis">
      <div className="px-6 pt-2 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-6 pt-6">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="space-y-1 flex-1">
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

                <Separator />
                
                {/* Summary Model Selection */}
                <div className="space-y-3" style={{ marginTop: '-36px', paddingTop: '20px' }}>
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Choose Summary Model
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Select the AI model that will create the final comprehensive summary of all model responses
                  </p>
                  <Select
                    value={localConfig.summaryModelId?.toString() || ""}
                    onValueChange={handleSummaryModelChange}
                    disabled={!localConfig.isEnabled}
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
                <div className="space-y-3" style={{ marginTop: '-18px', paddingTop: '6px' }}>
                  <Label className="text-base font-medium">Active Models</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Select which models to include in the deep research analysis
                  </p>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-sentinel-blue border-b">
                          <th className="text-left p-3 font-medium text-sm text-white">Provider</th>
                          <th className="text-left p-3 font-medium text-sm text-white">Model Name</th>
                          <th className="text-center p-3 font-medium text-sm text-white">Include in Research</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enabledModels.map((model, index) => (
                          <tr key={model.id} className={`border-b ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}`}>
                            <td className="p-3">
                              <Badge variant="secondary">{model.provider}</Badge>
                            </td>
                            <td className="p-3 text-sm">{model.name}</td>
                            <td className="p-3 text-center">
                              <Checkbox
                                id={`model-${model.id}`}
                                checked={selectedModels.has(model.id)}
                                onCheckedChange={(checked) => handleModelToggle(model.id, checked as boolean)}
                                disabled={!localConfig.isEnabled}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Save Button and Information */}
          <div className="space-y-6">
            {/* Save Configuration Button */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={handleSaveConfiguration}
                  disabled={saveConfigMutation.isPending}
                  className="w-full flex items-center justify-center gap-2"
                  size="lg"
                >
                  {saveConfigMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Save Configuration
                </Button>
              </CardContent>
            </Card>

            {/* Information Panel */}
            <Card>
              <CardContent className="pt-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        How Deep Research Works
                      </p>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• Users will see "Deep Research" as an option in the AI model selector</li>
                        <li>• The prompt is sent to all selected AI models simultaneously</li>
                        <li>• Individual responses are collected and combined</li>
                        <li>• The selected summary model creates a comprehensive analysis</li>
                        <li>• Processing may take several minutes depending on model count</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
