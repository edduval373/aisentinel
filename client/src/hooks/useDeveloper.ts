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

  // Query developer status
  const { data: status, isLoading } = useQuery<DeveloperStatus>({
    queryKey: ['/api/auth/developer-status'],
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
  });

  // Mutation to set test role
  const setRoleMutation = useMutation({
    mutationFn: async (testRole: string) => {
      const response = await fetch('/api/auth/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ testRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to set test role');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate auth and developer status queries
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/developer-status'] });
      
      // Refresh the page to update all UI state
      window.location.reload();
    },
    onError: (error: Error) => {
      console.error('Failed to set developer test role:', error);
    },
  });

  return {
    isDeveloper: status?.isDeveloper || false,
    testRole: status?.testRole || null,
    actualRole: status?.actualRole || 1,
    effectiveRole: status?.effectiveRole || 1,
    isLoading,
    setTestRole: setRoleMutation.mutate,
    isSettingRole: setRoleMutation.isPending,
  };
}