import { useQuery } from "@tanstack/react-query";

interface DemoUsage {
  questionsUsed: number;
  maxQuestions: number;
  questionsRemaining: number;
  email: string;
  expiresAt: string;
}

export function useDemoUsage() {
  return useQuery<DemoUsage>({
    queryKey: ['/api/demo/usage'],
    enabled: document.cookie.includes('demo-session-'),
    refetchInterval: 30000, // Refetch every 30 seconds to keep usage current
    retry: false, // Don't retry if not a demo user
  });
}