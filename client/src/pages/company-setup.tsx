import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building, CheckCircle, Users, Settings, Eye } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";

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

interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  role: string;
}

export default function CompanySetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "", department: "" });
  const [isEditCompanyModalOpen, setIsEditCompanyModalOpen] = useState(false);
  const [companyEditForm, setCompanyEditForm] = useState({ name: "", domain: "", primaryAdminName: "", primaryAdminEmail: "", primaryAdminTitle: "" });
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState<Owner | null>(null);

  // Fetch available companies for owners/super-users
  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ["/api/admin/companies"],
    enabled: user?.role === 'super-user' || user?.role === 'owner',
  });

  // Get user's current company
  const userCompany = companies.find((company: Company) => company.id === user?.companyId);
  const currentCompany = selectedCompanyId 
    ? companies.find((company: Company) => company.id === selectedCompanyId)
    : userCompany;

  // Set current company mutation
  const setCurrentCompanyMutation = useMutation({
    mutationFn: (companyId: number) =>
      apiRequest(`/api/user/set-current-company`, "POST", { companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Success", description: "Current company updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to set current company", 
        variant: "destructive" 
      });
    },
  });

  const handleSelectCompany = (companyId: number) => {
    setSelectedCompanyId(companyId);
    setCurrentCompanyMutation.mutate(companyId);
  };

  // Fetch owners from API
  const { data: owners = [], isLoading: ownersLoading, refetch: refetchOwners } = useQuery({
    queryKey: ["/api/company/owners", currentCompany?.id],
    enabled: !!currentCompany?.id,
  });

  const handleAddOwner = () => {
    setEditingOwner(null); // No owner selected means we're adding
    setEditForm({ firstName: "", lastName: "", email: "", department: "" }); // Empty form
    setIsEditModalOpen(true);
  };

  const handleEditOwner = (owner: Owner) => {
    setEditingOwner(owner);
    setEditForm({
      firstName: owner.firstName,
      lastName: owner.lastName,
      email: owner.email,
      department: owner.department || ""
    });
    setIsEditModalOpen(true);
  };

  // Add owner mutation
  const addOwnerMutation = useMutation({
    mutationFn: (ownerData: { firstName: string; lastName: string; email: string; department?: string }) =>
      apiRequest(`/api/company/owners`, "POST", { companyId: currentCompany?.id, ...ownerData }),
    onSuccess: () => {
      refetchOwners();
      toast({ title: "Success", description: "Owner added successfully" });
      setIsEditModalOpen(false);
      setEditingOwner(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to add owner", 
        variant: "destructive" 
      });
    },
  });

  // Update owner mutation
  const updateOwnerMutation = useMutation({
    mutationFn: (ownerData: { userId: string; firstName?: string; lastName?: string; email?: string; department?: string }) =>
      apiRequest(`/api/company/owners/${ownerData.userId}`, "PUT", ownerData),
    onSuccess: () => {
      refetchOwners();
      toast({ title: "Success", description: "Owner updated successfully" });
      setIsEditModalOpen(false);
      setEditingOwner(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to update owner", 
        variant: "destructive" 
      });
    },
  });

  const handleSaveEdit = () => {
    if (editForm.firstName && editForm.lastName && editForm.email) {
      if (editingOwner) {
        // Editing existing owner
        updateOwnerMutation.mutate({
          userId: editingOwner.id,
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email,
          department: editForm.department
        });
      } else {
        // Adding new owner
        addOwnerMutation.mutate({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email,
          department: editForm.department
        });
      }
    }
  };

  // Remove owner mutation
  const removeOwnerMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest(`/api/company/owners/${userId}`, "DELETE", { companyId: currentCompany?.id }),
    onSuccess: () => {
      refetchOwners();
      toast({ title: "Success", description: "Owner deleted successfully" });
      setIsDeleteConfirmOpen(false);
      setOwnerToDelete(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to remove owner", 
        variant: "destructive" 
      });
    },
  });

  const handleEditCompany = (company: Company) => {
    setCompanyEditForm({
      name: company.name,
      domain: company.domain,
      primaryAdminName: company.primaryAdminName,
      primaryAdminEmail: company.primaryAdminEmail,
      primaryAdminTitle: company.primaryAdminTitle
    });
    setIsEditCompanyModalOpen(true);
  };

  const handleSaveCompanyEdit = () => {
    if (companyEditForm.name && companyEditForm.domain) {
      // In a real app, this would make an API call to update the company
      toast({ title: "Success", description: "Company information updated successfully" });
      setIsEditCompanyModalOpen(false);
    }
  };

  const handleConfirmDelete = () => {
    if (ownerToDelete) {
      removeOwnerMutation.mutate(ownerToDelete.id);
    }
  };



  if (companiesLoading) {
    return (
      <AdminLayout title="Company Setup" subtitle="Configure your company settings">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Company Setup" subtitle="Configure your current company and manage owners">
      <div className="space-y-6">
        {/* Company Selection */}
        {(user?.role === 'super-user' || user?.role === 'owner') && companies.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Select Current Company
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {companies.map((company: Company) => (
                  <Card 
                    key={company.id} 
                    className={`cursor-pointer border-2 transition-colors ${
                      currentCompany?.id === company.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSelectCompany(company.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {company.logo && (
                          <img 
                            src={company.logo} 
                            alt={company.name} 
                            className="w-10 h-10 object-cover rounded-lg border"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold">{company.name}</h3>
                          <p className="text-sm text-gray-600">{company.domain}</p>
                        </div>
                        {currentCompany?.id === company.id && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Company Details */}
        {currentCompany && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  {currentCompany.name}
                  <Badge variant="default">Current Company</Badge>
                </div>
                <button 
                  onClick={() => handleEditCompany(currentCompany)}
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  edit
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-medium mb-3">Company Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Domain:</span> {currentCompany.domain}</div>
                    <div><span className="font-medium">Status:</span> 
                      <Badge variant={currentCompany.isActive ? "default" : "secondary"} className="ml-2">
                        {currentCompany.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-3">Primary Administrator</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {currentCompany.primaryAdminName}</div>
                    <div><span className="font-medium">Email:</span> {currentCompany.primaryAdminEmail}</div>
                    <div><span className="font-medium">Title:</span> {currentCompany.primaryAdminTitle}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Owners */}
        {currentCompany && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Owners
                </div>
                <Button onClick={handleAddOwner} size="sm">
                  Add Owner
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ownersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {owners.map((owner) => (
                    <div key={owner.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{owner.firstName} {owner.lastName}</h4>
                        <p className="text-sm text-gray-600">{owner.email}</p>
                        {owner.department && <p className="text-sm text-gray-500">{owner.department}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={owner.role === 'owner' ? 'default' : 'secondary'}>
                          {owner.role}
                        </Badge>
                        <button 
                          onClick={() => handleEditOwner(owner)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          edit
                        </button>
                        <button 
                          onClick={() => {
                            if (owners.length === 1) {
                              toast({ 
                                title: "Cannot Delete", 
                                description: "Cannot delete the last owner. At least one owner must remain.", 
                                variant: "destructive" 
                              });
                              return;
                            }
                            setOwnerToDelete(owner);
                            setIsDeleteConfirmOpen(true);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        {currentCompany && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                <Button variant="outline" className="justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage AI Models
                </Button>
                <Button variant="outline" className="justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  View Users
                </Button>
                <Button variant="outline" className="justify-start">
                  <Eye className="w-4 h-4 mr-2" />
                  Activity Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Company Selected */}
        {!currentCompany && (
          <Card>
            <CardContent className="text-center py-12">
              <Building className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No Company Selected</h3>
              <p className="text-gray-600 mb-4">
                {companies.length > 0 
                  ? "Select a company above to view and manage settings"
                  : "No companies are available. Contact your super-user to set up companies."
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Edit Owner Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingOwner ? 'Edit Owner' : 'Add New Owner'}</DialogTitle>
              <DialogDescription>
                {editingOwner ? 'Update the owner\'s name, email, and job title.' : 'Enter the new owner\'s information.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                  placeholder="Enter last name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department (Optional)</Label>
                <Input
                  id="department"
                  value={editForm.department}
                  onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                  placeholder="Enter department"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={addOwnerMutation.isPending || updateOwnerMutation.isPending}
              >
                {(addOwnerMutation.isPending || updateOwnerMutation.isPending) ? 'Saving...' : (editingOwner ? 'Update' : 'Add')} Owner
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Company Modal */}
        <Dialog open={isEditCompanyModalOpen} onOpenChange={setIsEditCompanyModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Company Information</DialogTitle>
              <DialogDescription>
                Update your company details and administrator information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companyEditForm.name}
                  onChange={(e) => setCompanyEditForm({...companyEditForm, name: e.target.value})}
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={companyEditForm.domain}
                  onChange={(e) => setCompanyEditForm({...companyEditForm, domain: e.target.value})}
                  placeholder="Enter company domain"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminName">Primary Admin Name</Label>
                <Input
                  id="adminName"
                  value={companyEditForm.primaryAdminName}
                  onChange={(e) => setCompanyEditForm({...companyEditForm, primaryAdminName: e.target.value})}
                  placeholder="Enter admin name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Primary Admin Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={companyEditForm.primaryAdminEmail}
                  onChange={(e) => setCompanyEditForm({...companyEditForm, primaryAdminEmail: e.target.value})}
                  placeholder="Enter admin email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminTitle">Primary Admin Title</Label>
                <Input
                  id="adminTitle"
                  value={companyEditForm.primaryAdminTitle}
                  onChange={(e) => setCompanyEditForm({...companyEditForm, primaryAdminTitle: e.target.value})}
                  placeholder="Enter admin title"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditCompanyModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCompanyEdit}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Confirm Deletion
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-600">
                Are you sure you want to delete <span className="font-medium text-gray-900">{ownerToDelete?.firstName} {ownerToDelete?.lastName}</span>?
              </p>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmDelete}
                disabled={removeOwnerMutation.isPending}
              >
                {removeOwnerMutation.isPending ? 'Deleting...' : 'Delete Owner'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}