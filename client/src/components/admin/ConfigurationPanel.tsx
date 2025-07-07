import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import type { AiModel, ActivityType } from "@shared/schema";

export default function ConfigurationPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch AI models
  const { data: aiModels, isLoading: modelsLoading } = useQuery<AiModel[]>({
    queryKey: ['/api/admin/ai-models'],
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

  // Fetch activity types
  const { data: activityTypes, isLoading: typesLoading } = useQuery<ActivityType[]>({
    queryKey: ['/api/admin/activity-types'],
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

  // Update activity type mutation
  const updateActivityTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ActivityType> }) => {
      const response = await apiRequest("PATCH", `/api/admin/activity-types/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/activity-types'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity-types'] });
      toast({
        title: "Success",
        description: "Activity type updated successfully",
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
        description: "Failed to update activity type",
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

  const handleActivityTypeToggle = (activityType: ActivityType, enabled: boolean) => {
    updateActivityTypeMutation.mutate({
      id: activityType.id,
      data: { isEnabled: enabled }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* AI Models Configuration */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">
            AI Models Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {modelsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-11" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {aiModels?.map((model) => (
                <div key={model.id} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-slate-700">{model.name}</span>
                    <p className="text-xs text-slate-500">{model.provider}</p>
                  </div>
                  <Switch
                    checked={model.isEnabled}
                    onCheckedChange={(checked) => handleModelToggle(model, checked)}
                    disabled={updateAiModelMutation.isPending}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Types Configuration */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">
            Activity Types Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {typesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-11" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {activityTypes?.map((activityType) => (
                <div key={activityType.id} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-slate-700">{activityType.name}</span>
                    {activityType.description && (
                      <p className="text-xs text-slate-500">{activityType.description}</p>
                    )}
                  </div>
                  <Switch
                    checked={activityType.isEnabled}
                    onCheckedChange={(checked) => handleActivityTypeToggle(activityType, checked)}
                    disabled={updateActivityTypeMutation.isPending}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
