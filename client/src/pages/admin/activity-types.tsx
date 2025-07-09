import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Settings, Plus, Shield } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ActivityType } from "@shared/schema";

const activityTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  prePrompt: z.string().min(1, "Pre-prompt is required"),
  riskLevel: z.enum(["low", "medium", "high"]),
  permissions: z.array(z.string()).min(1, "At least one permission is required"),
});

export default function AdminActivityTypes() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (!user?.role?.includes('admin') && !user?.email?.includes('admin') && !user?.email?.includes('ed.duval15@gmail.com')))) {
      toast({
        title: "Unauthorized",
        description: "You need admin privileges to access this page.",
        variant: "destructive",
      });
      window.location.href = "/";
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Fetch activity types from database
  const { data: activityTypes, isLoading: typesLoading } = useQuery<ActivityType[]>({
    queryKey: ['/api/admin/activity-types'],
    enabled: isAuthenticated && !isLoading,
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

  // Create activity type mutation
  const createActivityTypeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof activityTypeSchema>) => {
      return apiRequest('/api/admin/activity-types', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/activity-types'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity-types'] });
      toast({
        title: "Success",
        description: "Activity type created successfully",
      });
      form.reset();
      setIsAddDialogOpen(false);
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
      console.error("Create activity type error:", error);
      toast({
        title: "Error",
        description: "Failed to create activity type",
        variant: "destructive",
      });
    },
  });

  // Toggle activity type enabled status
  const toggleActivityTypeMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: number; isEnabled: boolean }) => {
      return apiRequest(`/api/admin/activity-types/${id}`, 'PATCH', { isEnabled });
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

  // Form setup
  const form = useForm<z.infer<typeof activityTypeSchema>>({
    resolver: zodResolver(activityTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      prePrompt: "",
      riskLevel: "low",
      permissions: ["read"],
    },
  });

  const onSubmit = (data: z.infer<typeof activityTypeSchema>) => {
    console.log("Form data being submitted:", data);
    createActivityTypeMutation.mutate(data);
  };

  if (isLoading || typesLoading) {
    return (
      <AdminLayout title="Activity Types" subtitle="Manage allowed activities and their permissions">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sentinel-blue"></div>
        </div>
      </AdminLayout>
    );
  }

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleToggleEnabled = (id: number, currentEnabled: boolean) => {
    toggleActivityTypeMutation.mutate({ id, isEnabled: !currentEnabled });
  };

  return (
    <AdminLayout title="Activity Types" subtitle="Manage allowed activities and their permissions">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Activity Type
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Activity Type</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Code Review" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Brief description of this activity type" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="prePrompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pre-prompt</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="System prompt to guide AI behavior for this activity type"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          This prompt will be automatically prepended to all messages in this activity type to guide the AI's behavior.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="riskLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select risk level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <FormLabel>Permissions</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {["read", "write", "analyze", "edit", "audit"].map((permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={permission}
                            checked={form.watch("permissions").includes(permission)}
                            onChange={(e) => {
                              const currentPermissions = form.getValues("permissions");
                              if (e.target.checked) {
                                form.setValue("permissions", [...currentPermissions, permission]);
                              } else {
                                form.setValue("permissions", currentPermissions.filter(p => p !== permission));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor={permission} className="text-sm font-medium capitalize">
                            {permission}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createActivityTypeMutation.isPending}>
                      {createActivityTypeMutation.isPending ? "Creating..." : "Create Activity Type"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {activityTypes?.map((activity) => (
            <Card key={activity.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Activity className="w-5 h-5 text-sentinel-blue" />
                  <div>
                    <CardTitle className="text-lg">{activity.name}</CardTitle>
                    <CardDescription>{activity.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={getRiskBadgeColor(activity.riskLevel || "low")}>
                    {activity.riskLevel || "low"} risk
                  </Badge>
                  <Switch 
                    checked={activity.isEnabled} 
                    onCheckedChange={() => handleToggleEnabled(activity.id, activity.isEnabled)}
                    disabled={toggleActivityTypeMutation.isPending}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-slate-900 mb-1">Permissions</p>
                  <div className="flex flex-wrap gap-1">
                    {activity.permissions && Array.isArray(activity.permissions) ? activity.permissions.map((perm) => (
                      <Badge key={perm} variant="outline" className="text-xs">
                        {perm}
                      </Badge>
                    )) : (
                      <Badge variant="outline" className="text-xs">read</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Risk Level</p>
                  <Badge className={getRiskBadgeColor(activity.riskLevel || "low")}>
                    {(activity.riskLevel || "low").charAt(0).toUpperCase() + (activity.riskLevel || "low").slice(1)}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Status</p>
                  <Badge variant={activity.isEnabled ? "default" : "secondary"}>
                    {activity.isEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
              
              {activity.prePrompt && (
                <div className="mt-4">
                  <p className="font-medium text-slate-900 mb-1">Pre-prompt</p>
                  <div className="bg-slate-50 p-3 rounded-md text-sm text-slate-700">
                    {activity.prePrompt}
                  </div>
                </div>
              )}
              <div className="mt-4 flex space-x-2">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
                <Button variant="outline" size="sm">
                  <Shield className="w-4 h-4 mr-2" />
                  Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* No activity types message */}
        {!activityTypes || activityTypes.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No activity types configured yet.</p>
              <p className="text-sm text-slate-500 mt-2">Add activity types to define what actions users can perform.</p>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </AdminLayout>
  );
}