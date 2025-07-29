import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface DeveloperStatus {
  isDeveloper: boolean;
  testRole: string | null;
  actualRole: number;
  effectiveRole: number;
}

export function useDeveloper() {
  const queryClient = useQueryClient();

  // Check if user is a developer
  const { data: developerStatus, isLoading } = useQuery<DeveloperStatus>({
    queryKey: ['/api/auth/developer-status'],
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Mutation to switch test roles
  const switchRoleMutation = useMutation({
    mutationFn: async (testRole: string) => {
      const response = await fetch('/api/auth/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ testRole })
      });

      if (!response.ok) {
        throw new Error('Failed to switch role');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate developer status query to refresh
      queryClient.invalidateQueries({ queryKey: ['/api/auth/developer-status'] });
      // Refresh the page to apply new role
      window.location.reload();
    },
  });

  return {
    isDeveloper: developerStatus?.isDeveloper ?? false,
    testRole: developerStatus?.testRole ?? null,
    actualRole: developerStatus?.actualRole ?? 1,
    effectiveRole: developerStatus?.effectiveRole ?? 1,
    isLoading,
    switchRole: switchRoleMutation.mutate,
    isSwitchingRole: switchRoleMutation.isPending,
  };
}