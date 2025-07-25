
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { Brain, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { hasAccessLevel, canViewAdminPage } from "@/utils/roleBasedAccess";
import { useAuth } from "@/hooks/useAuth";

interface AiModel {
  id: number;
  name: string;
  provider: string;
  modelName: string;
  isEnabled: boolean;
}

interface ModelFusionConfig {
  id: number;
  companyId: number;
  isEnabled: boolean;
  summaryModelId: number | null;
}

export default function ModelFusion() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check access level - require Owner level (99+)
  if (!canViewAdminPage(user?.roleLevel, 99)) {
    return (
      <AdminLayout title="Model Fusion" subtitle="Set up advanced multi-model AI processing for comprehensive research and analysis">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          textAlign: 'center',
          padding: '40px'
        }}>
          <AlertCircle style={{
            width: '64px',
            height: '64px',
            color: '#ef4444',
            marginBottom: '24px'
          }} />
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '12px'
          }}>
            Access Denied
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            marginBottom: '8px'
          }}>
            Owner level access required (99+)
          </p>
          <p style={{
            fontSize: '14px',
            color: '#9ca3af'
          }}>
            Contact your system administrator for access
          </p>
        </div>
      </AdminLayout>
    );
  }
  const [localConfig, setLocalConfig] = useState<Partial<ModelFusionConfig>>({
    isEnabled: false,
    summaryModelId: null,
  });
  const [selectedModels, setSelectedModels] = useState<Set<number>>(new Set());

  // Fetch AI models
  const { data: aiModels = [], isLoading: modelsLoading } = useQuery<AiModel[]>({
    queryKey: ['/api/ai-models'],
  });

  // Fetch Model Fusion config
  const { data: config, isLoading: configLoading } = useQuery<ModelFusionConfig>({
    queryKey: ['/api/model-fusion-config'],
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
    mutationFn: async (configData: Partial<ModelFusionConfig>) => {
      const method = config?.id ? 'PUT' : 'POST';
      const url = config?.id ? `/api/model-fusion-config/${config.id}` : '/api/model-fusion-config';
      
      return await apiRequest(url, method, configData);
    },
    onSuccess: () => {
      toast({
        title: "Configuration Saved",
        description: "Model Fusion settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/model-fusion-config'] });
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
      <AdminLayout title="Model Fusion" subtitle="Set up advanced multi-model AI processing for comprehensive research and analysis">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          gap: '20px'
        }}>
          <img 
            src="/ai-sentinel-logo.png" 
            alt="AI Sentinel" 
            style={{ 
              width: '64px', 
              height: '64px', 
              animation: 'spin 2s linear infinite',
              filter: 'brightness(1.1) saturate(1.3) contrast(1.2)'
            }}
          />
          <div style={{
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '8px'
            }}>
              Loading Model Fusion Configuration
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Fetching your multi-model AI processing settings...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Model Fusion" subtitle="Set up advanced multi-model AI processing for comprehensive research and analysis">
      <div style={{ padding: '24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px'
        }}>
          {/* Left Column - Configuration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '24px' }}>
                {/* Enable/Disable Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  marginBottom: '24px'
                }}>
                  <div style={{ flex: 1 }}>
                    <label 
                      htmlFor="model-fusion-enabled" 
                      style={{
                        display: 'block',
                        fontSize: '16px',
                        fontWeight: '500',
                        color: '#1f2937',
                        marginBottom: '4px'
                      }}
                    >
                      Enable Model Fusion
                    </label>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: 0
                    }}>
                      When enabled, users can submit prompts to multiple AI models simultaneously
                    </p>
                  </div>
                  <Switch
                    id="model-fusion-enabled"
                    checked={localConfig.isEnabled || false}
                    onCheckedChange={handleToggleEnabled}
                  />
                </div>

                {/* Separator */}
                <div style={{
                  height: '1px',
                  backgroundColor: '#e5e7eb',
                  margin: '24px 0'
                }} />
                
                {/* Summary Model Selection */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#1f2937',
                    marginBottom: '8px'
                  }}>
                    <Zap style={{ width: '16px', height: '16px' }} />
                    Choose Summary Model
                  </label>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    marginBottom: '12px'
                  }}>
                    Select the AI model that will create the final comprehensive summary of all model responses
                  </p>
                  <select
                    value={localConfig.summaryModelId?.toString() || ""}
                    onChange={(e) => handleSummaryModelChange(e.target.value)}
                    disabled={!localConfig.isEnabled}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      color: '#374151',
                      backgroundColor: localConfig.isEnabled ? 'white' : '#f9fafb',
                      cursor: localConfig.isEnabled ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <option value="">Select a model for summarization</option>
                    {enabledModels.map((model) => (
                      <option key={model.id} value={model.id.toString()}>
                        {model.provider} - {model.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Separator */}
                <div style={{
                  height: '1px',
                  backgroundColor: '#e5e7eb',
                  margin: '24px 0'
                }} />

                {/* Model Selection */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#1f2937',
                    marginBottom: '8px'
                  }}>
                    Active Models
                  </label>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    marginBottom: '16px'
                  }}>
                    Select which models to include in the model fusion analysis
                  </p>
                  <div style={{
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#3b82f6' }}>
                          <th style={{
                            textAlign: 'left',
                            padding: '12px',
                            fontWeight: '500',
                            fontSize: '14px',
                            color: 'white'
                          }}>
                            Provider
                          </th>
                          <th style={{
                            textAlign: 'left',
                            padding: '12px',
                            fontWeight: '500',
                            fontSize: '14px',
                            color: 'white'
                          }}>
                            Model Name
                          </th>
                          <th style={{
                            textAlign: 'center',
                            padding: '12px',
                            fontWeight: '500',
                            fontSize: '14px',
                            color: 'white'
                          }}>
                            Include in Research
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {enabledModels.map((model, index) => (
                          <tr key={model.id} style={{
                            backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc',
                            borderTop: index > 0 ? '1px solid #e5e7eb' : 'none'
                          }}>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                fontSize: '12px',
                                fontWeight: '500',
                                color: '#374151',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '9999px'
                              }}>
                                {model.provider}
                              </span>
                            </td>
                            <td style={{
                              padding: '12px',
                              fontSize: '14px',
                              color: '#374151'
                            }}>
                              {model.name}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                id={`model-${model.id}`}
                                checked={selectedModels.has(model.id)}
                                onChange={(e) => handleModelToggle(model.id, e.target.checked)}
                                disabled={!localConfig.isEnabled}
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  cursor: localConfig.isEnabled ? 'pointer' : 'not-allowed'
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Save Button and Information */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Save Configuration Button */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb',
              padding: '24px'
            }}>
              <button
                onClick={handleSaveConfiguration}
                disabled={saveConfigMutation.isPending}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: saveConfigMutation.isPending ? '#9ca3af' : '#3b82f6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: saveConfigMutation.isPending ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!saveConfigMutation.isPending) {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!saveConfigMutation.isPending) {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                  }
                }}
              >
                {saveConfigMutation.isPending ? (
                  <img 
                    src="/ai-sentinel-logo.png" 
                    alt="AI Sentinel" 
                    style={{ 
                      width: '16px', 
                      height: '16px', 
                      animation: 'spin 2s linear infinite',
                      filter: 'brightness(0) invert(1)'
                    }}
                  />
                ) : (
                  <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                )}
                Save Configuration
              </button>
            </div>

            {/* Information Panel */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb',
              padding: '24px'
            }}>
              <div style={{
                padding: '16px',
                backgroundColor: '#eff6ff',
                borderRadius: '8px',
                border: '1px solid #bfdbfe'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <AlertCircle style={{
                    width: '20px',
                    height: '20px',
                    color: '#2563eb',
                    marginTop: '2px',
                    flexShrink: 0
                  }} />
                  <div>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#1e40af',
                      marginBottom: '8px',
                      margin: '0 0 8px 0'
                    }}>
                      How Model Fusion Works
                    </p>
                    <ul style={{
                      fontSize: '14px',
                      color: '#1e40af',
                      margin: 0,
                      paddingLeft: '0',
                      listStyle: 'none'
                    }}>
                      <li style={{ marginBottom: '4px' }}>• Users will see "Model Fusion" as an option in the AI model selector</li>
                      <li style={{ marginBottom: '4px' }}>• The prompt is sent to all selected AI models simultaneously</li>
                      <li style={{ marginBottom: '4px' }}>• Individual responses are collected and combined</li>
                      <li style={{ marginBottom: '4px' }}>• The selected summary model creates a comprehensive analysis</li>
                      <li style={{ marginBottom: '4px' }}>• Processing may take several minutes depending on model count</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
