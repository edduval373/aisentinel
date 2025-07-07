import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Shield, Users, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardsProps {
  stats?: {
    totalConversations: number;
    securityBlocks: number;
    activeUsers: number;
    policyViolations: number;
  };
  isLoading: boolean;
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Conversations",
      value: stats?.totalConversations || 0,
      icon: MessageSquare,
      color: "text-sentinel-blue",
    },
    {
      title: "Security Blocks",
      value: stats?.securityBlocks || 0,
      icon: Shield,
      color: "text-sentinel-amber",
    },
    {
      title: "Active Users",
      value: stats?.activeUsers || 0,
      icon: Users,
      color: "text-sentinel-green",
    },
    {
      title: "Policy Violations",
      value: stats?.policyViolations || 0,
      icon: AlertTriangle,
      color: "text-sentinel-red",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">{card.title}</p>
                <p className="text-2xl font-semibold text-slate-800">{card.value.toLocaleString()}</p>
              </div>
              <card.icon className={`w-8 h-8 ${card.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
