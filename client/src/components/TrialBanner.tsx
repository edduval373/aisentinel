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
      <Alert style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', marginBottom: '16px' }}>
        <AlertCircle style={{ height: '16px', width: '16px', color: '#dc2626' }} />
        <AlertDescription style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#991b1b' }}>
            Your free trial has expired. Upgrade to continue using AI features.
          </span>
          <Button size="sm" style={{ backgroundColor: '#dc2626', color: 'white' }}>
            <Crown style={{ width: '16px', height: '16px', marginRight: '4px' }} />
            Upgrade Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!trialUsage.hasActionsRemaining) {
    return (
      <Alert style={{ backgroundColor: '#fffbeb', borderColor: '#fed7aa', marginBottom: '16px' }}>
        <AlertCircle style={{ height: '16px', width: '16px', color: '#ea580c' }} />
        <AlertDescription style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#9a3412' }}>
            Trial limit reached. You've used all {trialUsage.maxActions} free actions.
          </span>
          <Button size="sm" style={{ backgroundColor: '#ea580c', color: 'white' }}>
            <Crown style={{ width: '16px', height: '16px', marginRight: '4px' }} />
            Upgrade Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show remaining actions for active trial
  return (
    <Alert style={{ backgroundColor: '#dbeafe', borderColor: '#bfdbfe', marginBottom: '16px' }}>
      <Crown style={{ height: '16px', width: '16px', color: '#2563eb' }} />
      <AlertDescription style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#1e40af', fontWeight: 500 }}>
            Free Trial: {remainingActions} actions remaining
          </span>
          <Button size="sm" variant="outline" style={{ borderColor: '#93c5fd', color: '#1d4ed8' }}>
            Upgrade
          </Button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Progress 
            value={progressPercentage} 
            style={{ height: '8px', backgroundColor: '#bfdbfe' }}
          />
          <div style={{ fontSize: '12px', color: '#2563eb' }}>
            {trialUsage.actionsUsed} of {trialUsage.maxActions} actions used
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}