import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Building, UserPlus, Mail, Trash2, Edit2 } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { apiRequest } from "@/lib/queryClient";

const ownerSchema = z.object({
  name: z.string().min(1, "Owner name is required"),
  email: z.string().email("Valid email required"),
  title: z.string().min(1, "Title is required"),
  role: z.enum(["owner", "admin"]).default("owner"),
});

const companyUpdateSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  logo: z.string().optional(),
});

interface Owner {
  id: number;
  name: string;
  email: string;
  title: string;
  role: "owner" | "admin";
}

export default function CompanyManagement() {
  const [showAddOwner, setShowAddOwner] = useState(false);
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [owners, setOwners] = useState<Owner[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch the single company
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["/api/admin/company"],
  });

  const ownerForm = useForm<z.infer<typeof ownerSchema>>({
    resolver: zodResolver(ownerSchema),
    defaultValues: {
      name: "",
      email: "",
      title: "",
      role: "owner",
    },
  });

  const companyForm = useForm<z.infer<typeof companyUpdateSchema>>({
    resolver: zodResolver(companyUpdateSchema),
    defaultValues: {
      name: company?.name || "",
      logo: company?.logo || "",
    },
  });

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: (data: z.infer<typeof companyUpdateSchema>) =>
      apiRequest(`/api/admin/company`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/company"] });
      setShowEditCompany(false);
      companyForm.reset();
      toast({ title: "Success", description: "Company updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update company", variant: "destructive" });
    },
  });

  const addOwner = (data: z.infer<typeof ownerSchema>) => {
    const newOwner: Owner = {
      id: Date.now(), // temporary ID
      ...data,
    };
    setOwners([...owners, newOwner]);
    ownerForm.reset();
    setShowAddOwner(false);
    toast({ title: "Owner Added", description: "Owner has been added to the company" });
  };

  const removeOwner = (id: number) => {
    setOwners(owners.filter(owner => owner.id !== id));
    toast({ title: "Owner Removed", description: "Owner has been removed from the company" });
  };

  const onSubmitCompany = (data: z.infer<typeof companyUpdateSchema>) => {
    updateCompanyMutation.mutate(data);
  };

  if (companyLoading) {
    return (
      <AdminLayout title="Company Management" subtitle="Manage your company and owners">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Company Management" subtitle="Manage your company and owners">
      <div className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Company Information
            </CardTitle>
            <Dialog open={showEditCompany} onOpenChange={setShowEditCompany}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Company
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Company Information</DialogTitle>
                </DialogHeader>
                <Form {...companyForm}>
                  <form onSubmit={companyForm.handleSubmit(onSubmitCompany)} className="space-y-4">
                    <FormField
                      control={companyForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Corp" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="logo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Logo (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    field.onChange(event.target?.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={updateCompanyMutation.isPending}>
                      {updateCompanyMutation.isPending ? "Updating..." : "Update Company"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {company?.logo && (
                <img 
                  src={company.logo} 
                  alt={company.name} 
                  className="w-16 h-16 object-cover rounded-lg border"
                />
              )}
              <div>
                <h3 className="text-xl font-semibold">{company?.name}</h3>
                <p className="text-gray-600">{company?.domain}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Owners */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Company Owners
            </CardTitle>
            <Dialog open={showAddOwner} onOpenChange={setShowAddOwner}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Owner
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Owner</DialogTitle>
                </DialogHeader>
                <Form {...ownerForm}>
                  <form onSubmit={ownerForm.handleSubmit(addOwner)} className="space-y-4">
                    <FormField
                      control={ownerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={ownerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="john.smith@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={ownerForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input placeholder="CEO" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={ownerForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <FormControl>
                            <select {...field} className="w-full p-2 border rounded-md">
                              <option value="owner">Owner</option>
                              <option value="admin">Admin</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">
                      Add Owner
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {owners.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserPlus className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No owners added yet</p>
                  <p className="text-sm">Add owners to manage company access</p>
                </div>
              ) : (
                owners.map((owner) => (
                  <div key={owner.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{owner.name}</p>
                        <p className="text-sm text-gray-600">{owner.email}</p>
                        <p className="text-xs text-gray-500">{owner.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={owner.role === 'owner' ? 'default' : 'secondary'}>
                        {owner.role}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOwner(owner.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}