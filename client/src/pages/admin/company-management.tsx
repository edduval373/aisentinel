import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
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
  const [dialogJustOpened, setDialogJustOpened] = useState(false);
  
  // Debug effect to track state changes
  React.useEffect(() => {
    console.log("🔍 State change - showEditCompany:", showEditCompany, "editingCompany:", editingCompany?.name);
  }, [showEditCompany, editingCompany]);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ isOpen: boolean; company: Company | null }>({
    isOpen: false,
    company: null
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all companies (super-user only)
  const { data: companies = [], isLoading: companiesLoading, error: companiesError, refetch: refetchCompanies } = useQuery<Company[]>({
    queryKey: ["/api/admin/companies"],
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache data
    refetchInterval: false, // Disable automatic refetching
  });

  // Debug logging for companies query
  React.useEffect(() => {
    console.log("🏢 Companies query state:", {
      isLoading: companiesLoading,
      hasError: !!companiesError,
      error: companiesError,
      companiesCount: companies?.length || 0,
      companies: companies
    });
    
    // Check cookies manually
    console.log("🍪 Document cookies:", document.cookie);
    
    // Manual API test
    if (!companiesLoading && companies.length === 0 && !companiesError) {
      console.log("🧪 Manual API test - fetching companies directly...");
      fetch('/api/admin/companies', { credentials: 'include' })
        .then(res => {
          console.log("🧪 Manual fetch response status:", res.status);
          return res.json();
        })
        .then(data => {
          console.log("🧪 Manual fetch response data:", data);
        })
        .catch(err => {
          console.error("🧪 Manual fetch error:", err);
        });
    }
  }, [companies, companiesLoading, companiesError]);

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
    mutationFn: (data: z.infer<typeof companySchema>) => {
      console.log("🚀 [CREATE] Starting company creation with data:", data);
      console.log("🚀 [CREATE] API endpoint: /api/admin/companies");
      console.log("🚀 [CREATE] Request method: POST");
      return apiRequest(`/api/admin/companies`, "POST", data);
    },
    onSuccess: (newCompany) => {
      console.log("✅ [CREATE] Company created successfully!");
      console.log("✅ [CREATE] New company data:", newCompany);
      console.log("✅ [CREATE] Company ID:", newCompany?.id);
      console.log("✅ [CREATE] Company Name:", newCompany?.name);
      console.log("🔄 [CREATE] Manually refreshing companies list...");
      
      // Force immediate refetch
      refetchCompanies().then(() => {
        console.log("✅ [CREATE] Companies list refreshed successfully");
        console.log("✅ [CREATE] Total companies after creation:", companies?.length + 1);
      });
      
      setShowAddCompany(false);
      companyForm.reset();
      toast({ title: "Success", description: `Company '${newCompany?.name}' created successfully` });
    },
    onError: (error: any) => {
      console.error("❌ [CREATE] Company creation failed!");
      console.error("❌ [CREATE] Error details:", error);
      console.error("❌ [CREATE] Error message:", error?.message);
      console.error("❌ [CREATE] Error status:", error?.status);
      console.error("❌ [CREATE] Full error object:", JSON.stringify(error, null, 2));
      
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
      
      console.error("❌ [CREATE] Final error message:", errorMessage);
      
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    },
  });

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: z.infer<typeof companySchema> }) => {
      console.log("🔄 [UPDATE] Starting company update");
      console.log("🔄 [UPDATE] Company ID:", id);
      console.log("🔄 [UPDATE] Update data:", data);
      console.log("🔄 [UPDATE] API endpoint:", `/api/admin/companies/${id}`);
      console.log("🔄 [UPDATE] Request method: PUT");
      return apiRequest(`/api/admin/companies/${id}`, "PUT", data);
    },
    onSuccess: (response) => {
      console.log("✅ [UPDATE] Company update successful!");
      console.log("✅ [UPDATE] Response data:", response);
      console.log("✅ [UPDATE] Updated company name:", response?.name);
      
      // Invalidate both company list and current company data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/current-company"] });
      
      console.log("✅ [UPDATE] Cache invalidated");
      
      setShowEditCompany(false);
      setEditingCompany(null);
      companyForm.reset();
      
      toast({ title: "Success", description: `Company '${response?.name}' updated successfully` });
      
      console.log("✅ [UPDATE] Scheduling page refresh in 1 second...");
      // Force page refresh to update chat header
      setTimeout(() => {
        console.log("🔄 [UPDATE] Refreshing page now...");
        window.location.reload();
      }, 1000);
    },
    onError: (error: any) => {
      console.error("❌ [UPDATE] Company update failed!");
      console.error("❌ [UPDATE] Error details:", error);
      console.error("❌ [UPDATE] Error message:", error?.message);
      console.error("❌ [UPDATE] Error status:", error?.status);
      console.error("❌ [UPDATE] Full error object:", JSON.stringify(error, null, 2));
      
      const errorMessage = error?.message || "Failed to update company";
      console.error("❌ [UPDATE] Final error message:", errorMessage);
      
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    },
  });

  // Delete company mutation
  const deleteCompanyMutation = useMutation({
    mutationFn: (id: number) => {
      console.log("🗑️ [DELETE] Starting company deletion");
      console.log("🗑️ [DELETE] Company ID:", id);
      console.log("🗑️ [DELETE] API endpoint:", `/api/admin/companies/${id}`);
      console.log("🗑️ [DELETE] Request method: DELETE");
      return apiRequest(`/api/admin/companies/${id}`, "DELETE");
    },
    onSuccess: (response, deletedId) => {
      console.log("✅ [DELETE] Company deletion successful!");
      console.log("✅ [DELETE] Response data:", response);
      console.log("✅ [DELETE] Deleted company ID:", deletedId);
      console.log("🔄 [DELETE] Invalidating cache...");
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      
      // Force refetch to update UI immediately
      refetchCompanies().then(() => {
        console.log("✅ [DELETE] Companies list refreshed successfully");
        console.log("✅ [DELETE] Total companies after deletion:", companies?.length - 1);
      });
      
      toast({ title: "Success", description: "Company deleted successfully" });
    },
    onError: (error: any) => {
      console.error("❌ [DELETE] Company deletion failed!");
      console.error("❌ [DELETE] Error details:", error);
      console.error("❌ [DELETE] Error message:", error?.message);
      console.error("❌ [DELETE] Error status:", error?.status);
      console.error("❌ [DELETE] Full error object:", JSON.stringify(error, null, 2));
      
      const errorMessage = error?.message || "Failed to delete company";
      console.error("❌ [DELETE] Final error message:", errorMessage);
      
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    },
  });

  const onSubmitCompany = (data: z.infer<typeof companySchema>) => {
    console.log("📝 Form submitted with data:", data);
    if (editingCompany) {
      console.log("🔄 Editing existing company:", editingCompany.id, editingCompany.name);
      updateCompanyMutation.mutate({ id: editingCompany.id, data });
    } else {
      console.log("➕ Creating new company");
      createCompanyMutation.mutate(data);
    }
  };

  const handleEditCompany = (company: Company) => {
    console.log("🔧 handleEditCompany called for:", company.name);
    console.log("Current showEditCompany state:", showEditCompany);
    
    // Use setTimeout to ensure state update happens in next tick
    setTimeout(() => {
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
      setDialogJustOpened(true);
      setShowEditCompany(true);
      
      // Reset the flag after a short delay
      setTimeout(() => setDialogJustOpened(false), 100);
      
      console.log("After setShowEditCompany(true), editingCompany:", company.name);
      console.log("Updated showEditCompany state:", true);
    }, 0);
  };

  const handleDeleteClick = (company: Company) => {
    console.log("🗑️ [DELETE] handleDeleteClick called for:", company.name);
    console.log("🗑️ [DELETE] Company ID:", company.id);
    console.log("🗑️ [DELETE] Company domain:", company.domain);
    console.log("🗑️ [DELETE] Opening delete confirmation dialog...");
    setDeleteConfirmDialog({ isOpen: true, company });
  };

  const handleDeleteConfirm = () => {
    const company = deleteConfirmDialog.company;
    console.log("🗑️ [DELETE] Delete confirmed by user");
    console.log("🗑️ [DELETE] Company to delete:", company?.name);
    console.log("🗑️ [DELETE] Company ID to delete:", company?.id);
    
    if (company) {
      console.log("🗑️ [DELETE] Calling deleteCompanyMutation.mutate...");
      deleteCompanyMutation.mutate(company.id);
      console.log("🗑️ [DELETE] Closing delete confirmation dialog...");
      setDeleteConfirmDialog({ isOpen: false, company: null });
    } else {
      console.error("🗑️ [DELETE] ERROR: No company found in delete dialog!");
    }
  };

  const handleDeleteCancel = () => {
    console.log("🗑️ [DELETE] Delete cancelled by user");
    console.log("🗑️ [DELETE] Closing delete confirmation dialog...");
    setDeleteConfirmDialog({ isOpen: false, company: null });
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Company</DialogTitle>
                <DialogDescription>
                  Create a new company with administrator details and configuration.
                </DialogDescription>
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
            {companiesError ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '32px 0', 
                color: '#ef4444' 
              }}>
                <Building style={{ 
                  width: '48px', 
                  height: '48px', 
                  margin: '0 auto 8px', 
                  color: '#d1d5db' 
                }} />
                <p>Error loading companies</p>
                <p style={{ fontSize: '14px' }}>
                  {companiesError?.message || 'Failed to fetch companies'}
                </p>
                <Button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] })}
                  style={{ marginTop: '16px' }}
                >
                  Retry
                </Button>
              </div>
            ) : companies.length === 0 ? (
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
                          onClick={() => {
                            console.log("Edit button clicked for company:", company.id, company.name);
                            handleEditCompany(company);
                          }}
                        >
                          <Edit2 style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log("Delete button clicked for company:", company.id, company.name);
                            handleDeleteClick(company);
                          }}
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
        <Dialog 
          open={showEditCompany} 
          onOpenChange={(open) => {
            console.log("Edit Dialog onOpenChange called with:", open, "current state:", showEditCompany, "justOpened:", dialogJustOpened);
            // Prevent immediate closure after opening
            if (open === false && dialogJustOpened) {
              console.log("Preventing immediate dialog closure - just opened");
              return;
            }
            setShowEditCompany(open);
            if (!open) {
              setEditingCompany(null);
              companyForm.reset();
              setDialogJustOpened(false);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Company</DialogTitle>
              <DialogDescription>
                Update company information and administrator details.
              </DialogDescription>
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
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      console.log("❌ Edit dialog cancelled");
                      setShowEditCompany(false);
                      setEditingCompany(null);
                      companyForm.reset();
                    }}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    style={{ flex: 1 }} 
                    disabled={updateCompanyMutation.isPending}
                  >
                    {updateCompanyMutation.isPending ? "Updating..." : "Update Company"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Beautiful Centered Delete Confirmation Modal */}
        <Dialog open={deleteConfirmDialog.isOpen} onOpenChange={(open) => {
          console.log("🗑️ [DELETE] Delete Dialog onOpenChange called with:", open);
          console.log("🗑️ [DELETE] Company in dialog:", deleteConfirmDialog.company?.name);
          if (!open) {
            console.log("🗑️ [DELETE] Dialog closed without confirmation");
            handleDeleteCancel();
          }
        }}>
          <DialogContent style={{ 
            maxWidth: '480px',
            margin: '0 auto',
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e5e7eb',
            zIndex: 1000
          }}>
            <DialogHeader style={{ textAlign: 'center', marginBottom: '24px' }}>
              {/* Warning Icon */}
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#fef2f2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: '4px solid #fecaca'
              }}>
                <svg 
                  width="28" 
                  height="28" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#dc2626" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <path d="M12 9v4"/>
                  <path d="m12 17 .01 0"/>
                </svg>
              </div>
              
              <DialogTitle style={{ 
                color: '#1f2937',
                fontSize: '24px',
                fontWeight: '700',
                marginBottom: '8px',
                lineHeight: '1.3'
              }}>
                Delete Company?
              </DialogTitle>
              <DialogDescription style={{ 
                fontSize: '16px', 
                color: '#6b7280',
                lineHeight: '1.5',
                marginBottom: '0'
              }}>
                This action cannot be undone. All company data will be permanently removed.
              </DialogDescription>
            </DialogHeader>
            
            {/* Company Details in Beautiful Card */}
            <div style={{ 
              padding: '20px',
              backgroundColor: '#f9fafb',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              margin: '24px 0',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '4px'
              }}>
                {deleteConfirmDialog.company?.name}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280'
              }}>
                {deleteConfirmDialog.company?.domain}
              </div>
            </div>

            {/* Simplified Warning */}
            <div style={{ 
              textAlign: 'center',
              padding: '16px 0',
              borderTop: '1px solid #e5e7eb',
              borderBottom: '1px solid #e5e7eb',
              margin: '20px 0'
            }}>
              <p style={{ 
                margin: '0', 
                fontSize: '15px',
                color: '#6b7280',
                lineHeight: '1.6'
              }}>
                This will permanently delete all company data including AI models, chat sessions, and user activities.
              </p>
            </div>

            {/* Beautiful Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'center',
              paddingTop: '8px'
            }}>
              <Button
                variant="outline"
                onClick={() => {
                  console.log("🗑️ [DELETE] Cancel button clicked");
                  handleDeleteCancel();
                }}
                disabled={deleteCompanyMutation.isPending}
                style={{
                  minWidth: '100px',
                  padding: '8px 16px'
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  console.log("🗑️ [DELETE] Delete confirmation button clicked");
                  handleDeleteConfirm();
                }}
                disabled={deleteCompanyMutation.isPending}
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  minWidth: '140px',
                  padding: '8px 16px',
                  fontWeight: '600'
                }}
              >
                {deleteCompanyMutation.isPending ? (
                  <>
                    <span style={{ marginRight: '8px' }}>🔄</span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <span style={{ marginRight: '8px' }}>🗑️</span>
                    Yes, Delete Company
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}