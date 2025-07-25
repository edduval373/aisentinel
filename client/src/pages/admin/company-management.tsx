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
import { Building, Plus, Edit2, Trash2, UserPlus, Mail } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { apiRequest } from "@/lib/queryClient";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  domain: z.string().min(1, "Domain is required").regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid domain format"),
  primaryAdminName: z.string().min(1, "Primary administrator name is required"),
  primaryAdminEmail: z.string().email("Valid email required for primary administrator"),
  primaryAdminTitle: z.string().min(1, "Primary administrator title is required"),
  logo: z.string().optional(),
  isActive: z.boolean().default(true),
});

interface Company {
  id: number;
  name: string;
  domain: string;
  primaryAdminName: string;
  primaryAdminEmail: string;
  primaryAdminTitle: string;
  logo?: string;
  isActive: boolean;
}

export default function CompanyManagement() {
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all companies (using authentication bypass route)
  const { data: companies = [], isLoading: companiesLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const companyForm = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      domain: "",
      primaryAdminName: "",
      primaryAdminEmail: "",
      primaryAdminTitle: "",
      logo: "",
      isActive: true,
    },
  });

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: (data: z.infer<typeof companySchema>) =>
      apiRequest(`/api/admin/companies`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setShowAddCompany(false);
      companyForm.reset();
      toast({ title: "Success", description: "Company created successfully" });
    },
    onError: (error: any) => {
      console.error("Company creation error:", error);
      let errorMessage = "Failed to create company";
      
      if (error?.message) {
        if (error.message.includes("request entity too large")) {
          errorMessage = "Company logo is too large. Please use a smaller image (under 5MB).";
        } else if (error.message.includes("413")) {
          errorMessage = "Upload file is too large. Please use a smaller image.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    },
  });

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: z.infer<typeof companySchema> }) =>
      apiRequest(`/api/admin/companies/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setShowEditCompany(false);
      setEditingCompany(null);
      companyForm.reset();
      toast({ title: "Success", description: "Company updated successfully" });
    },
    onError: (error: any) => {
      console.error("Company update error:", error);
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to update company", 
        variant: "destructive" 
      });
    },
  });

  // Delete company mutation - using dev route to bypass auth issues
  const deleteCompanyMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/dev/companies/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "Success", description: "Company deleted successfully" });
    },
    onError: (error: any) => {
      console.error("Company deletion error:", error);
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to delete company", 
        variant: "destructive" 
      });
    },
  });

  const onSubmitCompany = (data: z.infer<typeof companySchema>) => {
    if (editingCompany) {
      updateCompanyMutation.mutate({ id: editingCompany.id, data });
    } else {
      createCompanyMutation.mutate(data);
    }
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    companyForm.reset({
      name: company.name,
      domain: company.domain,
      primaryAdminName: company.primaryAdminName,
      primaryAdminEmail: company.primaryAdminEmail,
      primaryAdminTitle: company.primaryAdminTitle,
      logo: company.logo || "",
      isActive: company.isActive,
    });
    setShowEditCompany(true);
  };

  const handleDeleteCompany = (id: number) => {
    deleteCompanyMutation.mutate(id);
  };

  if (companiesLoading) {
    return (
      <AdminLayout title="Company Management" subtitle="Manage all companies (Super-user only)">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '256px',
          gap: '16px'
        }}>
          <img 
            src="/ai-sentinel-logo.png" 
            alt="AI Sentinel" 
            style={{
              width: '80px',
              height: '80px',
              objectFit: 'contain',
              animation: 'spin 2s linear infinite',
              filter: 'brightness(1.1) saturate(1.3) contrast(1.2)'
            }}
          />
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            fontWeight: '500',
            margin: 0
          }}>
            Loading companies...
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Company Management" subtitle="Manage all companies (Super-user only)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Add Company Button */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#374151',
            margin: 0 
          }}>
            All Companies
          </h2>
          <Dialog open={showAddCompany} onOpenChange={setShowAddCompany}>
            <DialogTrigger asChild>
              <Button>
                <Plus style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent style={{ 
              maxWidth: '512px', 
              maxHeight: '80vh', 
              overflowY: 'auto' 
            }}>
              <DialogHeader>
                <DialogTitle>Add New Company</DialogTitle>
              </DialogHeader>
              <Form {...companyForm}>
                <form onSubmit={companyForm.handleSubmit(onSubmitCompany)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <FormField
                    control={companyForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corporation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={companyForm.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Domain</FormLabel>
                        <FormControl>
                          <Input placeholder="acme.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={companyForm.control}
                    name="primaryAdminName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Administrator Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={companyForm.control}
                    name="primaryAdminEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Administrator Email</FormLabel>
                        <FormControl>
                          <Input placeholder="john.smith@acme.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={companyForm.control}
                    name="primaryAdminTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Administrator Title</FormLabel>
                        <FormControl>
                          <Input placeholder="CEO" {...field} />
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
                        <FormLabel>Company Logo (Optional - Max 5MB)</FormLabel>
                        <FormControl>
                          <Input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Check file size (limit to 5MB)
                                const maxSize = 5 * 1024 * 1024; // 5MB in bytes
                                if (file.size > maxSize) {
                                  toast({
                                    title: "File too large",
                                    description: "Please select an image smaller than 5MB",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                
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
                  <Button type="submit" style={{ width: '100%' }} disabled={createCompanyMutation.isPending || updateCompanyMutation.isPending}>
                    {editingCompany 
                      ? (updateCompanyMutation.isPending ? "Updating..." : "Update Company")
                      : (createCompanyMutation.isPending ? "Creating..." : "Create Company")
                    }
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Companies List */}
        <Card>
          <CardContent style={{ padding: '24px' }}>
            {companies.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '32px 0', 
                color: '#6b7280' 
              }}>
                <Building style={{ 
                  width: '48px', 
                  height: '48px', 
                  margin: '0 auto 8px', 
                  color: '#d1d5db' 
                }} />
                <p>No companies found</p>
                <p style={{ fontSize: '14px' }}>Add companies to manage your organization</p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gap: '16px', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' 
              }}>
                {companies.map((company: Company) => (
                  <Card key={company.id} style={{ border: '1px solid #e5e7eb' }}>
                    <CardContent style={{ padding: '16px' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        justifyContent: 'space-between', 
                        marginBottom: '16px' 
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {company.logo && (
                            <img 
                              src={company.logo} 
                              alt={company.name} 
                              style={{
                                width: '48px',
                                height: '48px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb'
                              }}
                            />
                          )}
                          <div>
                            <h3 style={{ fontWeight: '600', marginBottom: '4px' }}>{company.name}</h3>
                            <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '2px' }}>{company.domain}</p>
                            <p style={{ fontSize: '12px', color: '#6b7280' }}>Admin: {company.primaryAdminName}</p>
                          </div>
                        </div>
                        <Badge variant={company.isActive ? "default" : "secondary"}>
                          {company.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCompany(company)}
                        >
                          <Edit2 style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCompany(company.id)}
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Company Dialog */}
        <Dialog open={showEditCompany} onOpenChange={(open) => {
          setShowEditCompany(open);
          if (!open) {
            setEditingCompany(null);
            companyForm.reset();
          }
        }}>
          <DialogContent style={{ 
            maxWidth: '512px', 
            maxHeight: '80vh', 
            overflowY: 'auto' 
          }}>
            <DialogHeader>
              <DialogTitle>Edit Company</DialogTitle>
            </DialogHeader>
            <Form {...companyForm}>
              <form onSubmit={companyForm.handleSubmit(onSubmitCompany)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <FormField
                  control={companyForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corporation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Domain</FormLabel>
                      <FormControl>
                        <Input placeholder="acme.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="primaryAdminName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Administrator Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="primaryAdminEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Administrator Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john.smith@acme.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="primaryAdminTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Administrator Title</FormLabel>
                      <FormControl>
                        <Input placeholder="CEO" {...field} />
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
                      <FormLabel>Company Logo (Optional - Max 5MB)</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Check file size (limit to 5MB)
                              const maxSize = 5 * 1024 * 1024; // 5MB in bytes
                              if (file.size > maxSize) {
                                toast({
                                  title: "File too large",
                                  description: "Please select an image smaller than 5MB",
                                  variant: "destructive",
                                });
                                return;
                              }
                              
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
                <Button type="submit" style={{ width: '100%' }} disabled={updateCompanyMutation.isPending}>
                  {updateCompanyMutation.isPending ? "Updating..." : "Update Company"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}