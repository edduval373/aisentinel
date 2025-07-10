import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, CheckCircle, Users, Settings, Eye } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { apiRequest } from "@/lib/queryClient";

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
  id: number;
  name: string;
  email: string;
  title: string;
  role: "owner" | "admin";
}

export default function CompanySetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

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

  // Sample owners data - in a real app this would come from API
  const [owners, setOwners] = useState<Owner[]>([
    {
      id: 1,
      name: "Larry Ditto",
      email: "larry.ditto@horizonedge.com",
      title: "CEO",
      role: "owner"
    }
  ]);

  const handleAddOwner = () => {
    const newOwner: Owner = {
      id: owners.length + 1,
      name: "New Owner",
      email: "new.owner@company.com",
      title: "Executive",
      role: "owner"
    };
    setOwners([...owners, newOwner]);
  };

  const handleEditOwner = (owner: Owner) => {
    // Simple edit - you can implement inline editing or a modal later
    const newName = prompt("Edit name:", owner.name);
    const newEmail = prompt("Edit email:", owner.email);
    const newTitle = prompt("Edit title:", owner.title);
    
    if (newName && newEmail && newTitle) {
      setOwners(owners.map(o => 
        o.id === owner.id 
          ? { ...o, name: newName, email: newEmail, title: newTitle }
          : o
      ));
    }
  };

  const handleRemoveOwner = (id: number) => {
    setOwners(owners.filter(owner => owner.id !== id));
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
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                {currentCompany.name}
                <Badge variant="default">Current Company</Badge>
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
              <div className="space-y-3">
                {owners.map((owner) => (
                  <div key={owner.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">{owner.name}</h4>
                      <p className="text-sm text-gray-600">{owner.email}</p>
                      <p className="text-sm text-gray-500">{owner.title}</p>
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
                      {owners.length > 1 && (
                        <button 
                          onClick={() => handleRemoveOwner(owner.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
      </div>
    </AdminLayout>
  );
}