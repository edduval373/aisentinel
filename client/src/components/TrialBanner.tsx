import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertCircle, Crown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";

interface TrialUsage {
  hasActionsRemaining: boolean;
  actionsUsed: number;
  maxActions: number;
  isTrialExpired: boolean;
  trialEndDate: string;
}

export function TrialBanner() {
  const { user, isAuthenticated } = useAuth();
  
  const { data: trialUsage } = useQuery<TrialUsage>({
    queryKey: ['/api/trial/usage', user?.id],
    enabled: !!user?.id && user?.isTrialUser,
  });

  // Don't show banner if user is not on trial or not authenticated
  if (!isAuthenticated || !user?.isTrialUser || !trialUsage) {
    return null;
  }

  const progressPercentage = Math.round((trialUsage.actionsUsed / trialUsage.maxActions) * 100);
  const remainingActions = trialUsage.maxActions - trialUsage.actionsUsed;

  if (trialUsage.isTrialExpired) {
    return (
      <Alert className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800 mb-4">
        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-red-800 dark:text-red-200">
            Your free trial has expired. Upgrade to continue using AI features.
          </span>
          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
            <Crown className="w-4 h-4 mr-1" />
            Upgrade Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!trialUsage.hasActionsRemaining) {
    return (
      <Alert className="bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800 mb-4">
        <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-orange-800 dark:text-orange-200">
            Trial limit reached. You've used all {trialUsage.maxActions} free actions.
          </span>
          <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
            <Crown className="w-4 h-4 mr-1" />
            Upgrade Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show remaining actions for active trial
  return (
    <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 mb-4">
      <Crown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-blue-800 dark:text-blue-200 font-medium">
            Free Trial: {remainingActions} actions remaining
          </span>
          <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
            Upgrade
          </Button>
        </div>
        <div className="space-y-1">
          <Progress 
            value={progressPercentage} 
            className="h-2 bg-blue-200 dark:bg-blue-900" 
          />
          <div className="text-xs text-blue-600 dark:text-blue-400">
            {trialUsage.actionsUsed} of {trialUsage.maxActions} actions used
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}