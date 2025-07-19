import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Download, Wifi } from "lucide-react";
import StatsCards from "./StatsCards";
import ActivityTable from "./ActivityTable";
import ConfigurationPanel from "./ConfigurationPanel";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(true);

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    refetchInterval: 10000, // Refetch every 10 seconds
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

  const handleExportReport = () => {
    // TODO: Implement export functionality
    toast({
      title: "Export Started",
      description: "Your report will be downloaded shortly.",
    });
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Admin Header */}
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Administration Dashboard</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Wifi className="w-4 h-4 text-sentinel-green" />
              <span className="text-sm text-slate-600">Real-time Monitoring</span>
            </div>
            <Button
              onClick={handleExportReport}
              className="bg-sentinel-blue hover:bg-blue-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Admin Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats Cards */}
        <StatsCards stats={stats} isLoading={statsLoading} />

        {/* Recent Activity Table */}
        <div className="mt-6">
          <ActivityTable />
        </div>

        {/* Configuration Panel */}
        <div className="mt-6">
          <ConfigurationPanel />
        </div>
      </div>
    </div>
  );
}
