import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Settings, Zap, Shield, AlertCircle, Thermometer } from "lucide-react";
import type { AiModel } from "@shared/schema";

export default function AdminModelSettings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Fetch AI models from database (using authentication bypass)
  const { data: aiModels, isLoading: modelsLoading } = useQuery<AiModel[]>({
    queryKey: ['/api/ai-models'],
    enabled: !isLoading,
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

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'anthropic':
        return <Bot className="w-5 h-5 mr-2" />;
      case 'openai':
        return <Bot className="w-5 h-5 mr-2" />;
      case 'perplexity':
        return <Zap className="w-5 h-5 mr-2" />;
      default:
        return <Bot className="w-5 h-5 mr-2" />;
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

  const getModelDescription = (provider: string) => {
    switch (provider) {
      case 'anthropic':
        return 'Advanced reasoning and analysis with constitutional AI training';
      case 'openai':
        return 'Latest multimodal model with vision and advanced reasoning capabilities';
      case 'perplexity':
        return 'Real-time web search and information retrieval with citations';
      default:
        return 'AI language model for text generation and analysis';
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || modelsLoading) {
    return (
      <AdminLayout title="Model Settings" subtitle="Configure AI model parameters and behavior">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sentinel-blue"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout title="Model Settings" subtitle="Configure AI model parameters and behavior">
      <div className="p-6 space-y-6">
        {/* Dynamic AI Model Settings */}
        {aiModels?.map((model) => (
          <Card key={model.id}>
            <CardHeader>
              <CardTitle className="flex items-center">
                {getProviderIcon(model.provider)}
                {model.name} Configuration
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant={model.isEnabled ? "default" : "secondary"}>
                  {model.isEnabled ? "Active" : "Disabled"}
                </Badge>
                <span className="text-sm text-slate-600">
                  {getModelDescription(model.provider)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor={`${model.id}-temperature`}>Temperature</Label>
                  <div className="mt-2 space-y-2">
                    <Slider
                      id={`${model.id}-temperature`}
                      defaultValue={[model.provider === 'perplexity' ? 0.2 : 0.7]}
                      max={2}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Conservative (0.0)</span>
                      <span>Balanced ({model.provider === 'perplexity' ? '0.2' : '0.7'})</span>
                      <span>Creative (2.0)</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor={`${model.id}-max-tokens`}>Max Tokens</Label>
                  <Input
                    id={`${model.id}-max-tokens`}
                    type="number"
                    defaultValue="4096"
                    className="mt-2"
                  />
                </div>
              </div>
            
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor={`${model.id}-top-p`}>Top P (Nucleus Sampling)</Label>
                  <div className="mt-2 space-y-2">
                    <Slider
                      id={`${model.id}-top-p`}
                      defaultValue={[model.provider === 'perplexity' ? 0.9 : 1]}
                      max={1}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Focused (0.0)</span>
                      <span>Balanced (1.0)</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor={`${model.id}-frequency-penalty`}>
                    {model.provider === 'anthropic' ? 'Top K' : 'Frequency Penalty'}
                  </Label>
                  <div className="mt-2 space-y-2">
                    {model.provider === 'anthropic' ? (
                      <Input
                        id={`${model.id}-frequency-penalty`}
                        type="number"
                        defaultValue="40"
                        className="w-full"
                      />
                    ) : (
                      <Slider
                        id={`${model.id}-frequency-penalty`}
                        defaultValue={[0]}
                        max={2}
                        min={-2}
                        step={0.1}
                        className="w-full"
                      />
                    )}
                    {model.provider !== 'anthropic' && (
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Repetitive (-2.0)</span>
                        <span>Varied (2.0)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor={`${model.id}-stream`}>Enable streaming responses</Label>
                    <p className="text-sm text-slate-600">Stream responses for better user experience</p>
                  </div>
                  <Switch id={`${model.id}-stream`} defaultChecked={model.provider !== 'perplexity'} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor={`${model.id}-function-calling`}>
                      {model.provider === 'anthropic' ? 'Enable vision capabilities' : 
                       model.provider === 'perplexity' ? 'Enable web search' : 'Enable function calling'}
                    </Label>
                    <p className="text-sm text-slate-600">
                      {model.provider === 'anthropic' ? 'Allow image analysis and processing' : 
                       model.provider === 'perplexity' ? 'Access real-time web information' : 'Allow model to call predefined functions'}
                    </p>
                  </div>
                  <Switch id={`${model.id}-function-calling`} defaultChecked={model.provider === 'perplexity'} />
                </div>
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
              <p className="text-sm text-slate-500 mt-2">Add models from the AI Models page to configure their settings.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}