import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Building, Plus, Users, UserPlus, Mail, Trash2 } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  domain: z.string().min(1, "Domain is required").regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid domain format"),
  primaryAdminName: z.string().min(1, "Primary administrator name is required"),
  primaryAdminEmail: z.string().email("Valid email required for primary administrator"),
  primaryAdminTitle: z.string().min(1, "Primary administrator title is required"),
  logo: z.string().optional(),
  isActive: z.boolean().default(true),
});

const ownerSchema = z.object({
  name: z.string().min(1, "Owner name is required"),
  email: z.string().email("Valid email required"),
  title: z.string().min(1, "Title is required"),
  role: z.enum(["owner", "admin"]).default("owner"),
});

export default function AdminCompanies() {
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [showAddOwner, setShowAddOwner] = useState(false);
  const [owners, setOwners] = useState<Array<z.infer<typeof ownerSchema>>>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const ownerForm = useForm<z.infer<typeof ownerSchema>>({
    resolver: zodResolver(ownerSchema),
    defaultValues: {
      name: "",
      email: "",
      title: "",
      role: "owner",
    },
  });

  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ["/api/admin/companies"],
    queryFn: async () => {
      const token = localStorage.getItem('prodAuthToken') || 'prod-1754052835575-289kvxqgl42h';
      const response = await fetch("/api/admin/companies", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch companies');
      return response.json();
    }
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof companySchema>) => {
      const token = localStorage.getItem('prodAuthToken') || 'prod-1754052835575-289kvxqgl42h';
      const response = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create company");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Company created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      setShowAddCompany(false);
      companyForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create company", variant: "destructive" });
    },
  });

  const onSubmitCompany = (data: z.infer<typeof companySchema>) => {
    createCompanyMutation.mutate(data);
  };

  const addOwner = (data: z.infer<typeof ownerSchema>) => {
    setOwners([...owners, data]);
    ownerForm.reset();
    setShowAddOwner(false);
    toast({ title: "Owner Added", description: "Owner has been added to the list" });
  };

  const removeOwner = (index: number) => {
    setOwners(owners.filter((_, i) => i !== index));
    toast({ title: "Owner Removed", description: "Owner has been removed from the list" });
  };

  return (
    <AdminLayout title="Company Management" subtitle="Manage companies and organizational settings">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              width: '100%',
              gap: '20px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827'
              }}>
                <Building style={{ width: '20px', height: '20px' }} />
                Companies
              </div>
              
              <Dialog open={showAddCompany} onOpenChange={setShowAddCompany}>
                <DialogTrigger asChild>
                  <button style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                  }}>
                    <Plus style={{ width: '16px', height: '16px' }} />
                    Add Company
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Company</DialogTitle>
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
                            <FormLabel>Email Domain</FormLabel>
                            <FormControl>
                              <Input placeholder="acme.com" {...field} />
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
                      
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-sm mb-3">Primary Company Administrator</h4>
                        <div className="space-y-3">
                          <FormField
                            control={companyForm.control}
                            name="primaryAdminName"
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
                            control={companyForm.control}
                            name="primaryAdminEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
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
                                <FormLabel>Job Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="IT Director" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <Button type="submit" className="w-full" disabled={createCompanyMutation.isPending}>
                        {createCompanyMutation.isPending ? "Creating..." : "Create Company"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {companiesLoading ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '40px',
                color: '#6b7280' 
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid #e5e7eb',
                  borderTop: '3px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {companies?.map((company: any) => (
                  <div 
                    key={company.id} 
                    className="company-card"
                    style={{
                      padding: '24px',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
                        {company.logo && (
                          <img 
                            src={company.logo} 
                            alt={`${company.name} logo`}
                            style={{
                              width: '48px',
                              height: '48px',
                              objectFit: 'contain',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb'
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <h3 style={{ 
                              fontSize: '20px', 
                              fontWeight: '600', 
                              color: '#111827',
                              margin: 0
                            }}>
                              {company.name}
                            </h3>
                            <span style={{
                              backgroundColor: (company.is_active || company.isActive) ? '#10b981' : '#6b7280',
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '500',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              {(company.is_active || company.isActive) ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          <div style={{ 
                            fontSize: '15px', 
                            color: '#4b5563',
                            marginBottom: '12px',
                            fontWeight: '500'
                          }}>
                            🌐 {company.domain}
                          </div>
                          
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '6px',
                            fontSize: '14px',
                            color: '#6b7280'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Users style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
                              <span style={{ fontWeight: '500', color: '#374151' }}>
                                {company.primary_admin_name || company.primaryAdminName}
                              </span>
                              <span style={{ color: '#9ca3af' }}>•</span>
                              <span>{company.primary_admin_title || company.primaryAdminTitle}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Mail style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
                              <span>{company.primary_admin_email || company.primaryAdminEmail}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                        <button
                          className="manage-button"
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
                          }}
                          onClick={() => setSelectedCompany(company)}
                        >
                          <Users style={{ width: '16px', height: '16px' }} />
                          Manage Owners
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Company Owners Management Modal */}
        {selectedCompany && (
          <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Manage Owners - {selectedCompany.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Company Owners</h3>
                  <Dialog open={showAddOwner} onOpenChange={setShowAddOwner}>
                    <DialogTrigger asChild>
                      <Button size="sm">
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
                </div>
                
                <div className="space-y-2">
                  {owners.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No owners added yet</p>
                      <p className="text-sm">Add owners to manage company access</p>
                    </div>
                  ) : (
                    owners.map((owner, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-gray-400" />
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
                            onClick={() => removeOwner(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
}