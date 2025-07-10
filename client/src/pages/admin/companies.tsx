import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Building, Plus, Users, Mail, Calendar } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";

const companySchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  domain: z.string().min(1, "Domain is required").regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid domain format"),
  isActive: z.boolean().default(true),
});

const employeeSchema = z.object({
  email: z.string().email("Invalid email format"),
  role: z.enum(["employee", "admin", "owner"]),
  department: z.string().optional(),
  companyId: z.number(),
});

export default function AdminCompanies() {
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const { toast } = useToast();

  const companyForm = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: "",
      domain: "",
      isActive: true,
    },
  });

  const employeeForm = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      email: "",
      role: "employee",
      department: "",
      companyId: 0,
    },
  });

  // Fetch companies
  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ['/api/admin/companies'],
  });

  // Fetch employees for selected company
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['/api/admin/company-employees', selectedCompany?.id],
    enabled: !!selectedCompany?.id,
  });

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof companySchema>) => {
      return apiRequest('/api/admin/companies', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Company created successfully",
      });
      setShowAddCompany(false);
      companyForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/companies'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create company",
        variant: "destructive",
      });
    },
  });

  // Add employee mutation
  const addEmployeeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof employeeSchema>) => {
      return apiRequest('/api/admin/company-employees', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employee added successfully",
      });
      setShowAddEmployee(false);
      employeeForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/company-employees', selectedCompany?.id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add employee",
        variant: "destructive",
      });
    },
  });

  const onSubmitCompany = (data: z.infer<typeof companySchema>) => {
    createCompanyMutation.mutate(data);
  };

  const onSubmitEmployee = (data: z.infer<typeof employeeSchema>) => {
    addEmployeeMutation.mutate({ ...data, companyId: selectedCompany.id });
  };

  return (
    <AdminLayout title="Company Management" subtitle="Manage companies and employee access">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Companies List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Companies
              </CardTitle>
              <Dialog open={showAddCompany} onOpenChange={setShowAddCompany}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Company
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Company</DialogTitle>
                  </DialogHeader>
                  <Form {...companyForm}>
                    <form onSubmit={companyForm.handleSubmit(onSubmitCompany)} className="space-y-4">
                      <FormField
                        control={companyForm.control}
                        name="companyName"
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
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {companies?.map((company: any) => (
                  <div
                    key={company.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedCompany?.id === company.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedCompany(company)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{company.companyName}</h3>
                        <p className="text-sm text-gray-600">{company.domain}</p>
                      </div>
                      <Badge variant={company.isActive ? "default" : "secondary"}>
                        {company.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employee Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {selectedCompany ? `${selectedCompany.companyName} Employees` : 'Select Company'}
              </CardTitle>
              {selectedCompany && (
                <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Employee
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Employee to {selectedCompany.companyName}</DialogTitle>
                    </DialogHeader>
                    <Form {...employeeForm}>
                      <form onSubmit={employeeForm.handleSubmit(onSubmitEmployee)} className="space-y-4">
                        <FormField
                          control={employeeForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Employee Email</FormLabel>
                              <FormControl>
                                <Input placeholder={`john.doe@${selectedCompany.domain}`} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={employeeForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <FormControl>
                                <select {...field} className="w-full p-2 border rounded">
                                  <option value="employee">Employee</option>
                                  <option value="admin">Admin</option>
                                  <option value="owner">Owner</option>
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={employeeForm.control}
                          name="department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Engineering" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={addEmployeeMutation.isPending}>
                          {addEmployeeMutation.isPending ? "Adding..." : "Add Employee"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedCompany ? (
              <div className="text-center py-8 text-gray-500">
                Select a company to view employees
              </div>
            ) : employeesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {employees?.map((employee: any) => (
                  <div key={employee.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{employee.email}</p>
                          {employee.department && (
                            <p className="text-sm text-gray-600">{employee.department}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{employee.role}</Badge>
                        <Badge variant={employee.isActive ? "default" : "secondary"}>
                          {employee.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}