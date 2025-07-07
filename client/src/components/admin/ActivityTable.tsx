import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import type { UserActivity } from "@shared/schema";

export default function ActivityTable() {
  const { toast } = useToast();

  const { data: activities, isLoading } = useQuery<UserActivity[]>({
    queryKey: ['/api/admin/user-activities'],
    refetchInterval: 5000, // Refetch every 5 seconds
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-sentinel-green/10 text-sentinel-green hover:bg-sentinel-green/20">
            Approved
          </Badge>
        );
      case 'blocked':
        return (
          <Badge className="bg-sentinel-red/10 text-sentinel-red hover:bg-sentinel-red/20">
            Blocked
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-sentinel-amber/10 text-sentinel-amber hover:bg-sentinel-amber/20">
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  const getInitials = (userId: string) => {
    return userId.slice(0, 2).toUpperCase();
  };

  const handleViewDetails = (activity: UserActivity) => {
    // TODO: Implement view details modal
    console.log('View details for activity:', activity);
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-800">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    AI Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Activity Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {activities?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No activities found
                    </td>
                  </tr>
                ) : (
                  activities?.map((activity) => (
                    <tr key={activity.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-sentinel-blue rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {getInitials(activity.userId)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-slate-900">
                              {activity.userId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        Model #{activity.aiModelId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        Type #{activity.activityTypeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(activity.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {format(new Date(activity.timestamp), "MMM d, h:mm a")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(activity)}
                          className="text-sentinel-blue hover:text-blue-600"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
