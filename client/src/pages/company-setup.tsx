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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Building, Users, Plus, Trash2 } from "lucide-react";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  domain: z.string().min(1, "Domain is required").regex(/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/, "Invalid domain format"),
  logo: z.string().optional(),
});

const employeeSchema = z.object({
  email: z.string().email("Invalid email format"),
  role: z.enum(["employee", "admin", "owner"]),
  department: z.string().optional(),
});

export default function CompanySetup() {
  const [newEmployee, setNewEmployee] = useState("");
  const [employees, setEmployees] = useState<string[]>([]);
  const { toast } = useToast();

  const companyForm = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      domain: "",
      logo: "",
    },
  });

  const employeeForm = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      email: "",
      role: "employee",
      department: "",
    },
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
      companyForm.reset();
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
    mutationFn: async (data: z.infer<typeof employeeSchema> & { companyId: number }) => {
      return apiRequest('/api/admin/company-employees', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employee added successfully",
      });
      employeeForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add employee",
        variant: "destructive",
      });
    },
  });

  const addEmployee = () => {
    if (newEmployee.trim()) {
      setEmployees([...employees, newEmployee.trim()]);
      setNewEmployee("");
    }
  };

  const removeEmployee = (index: number) => {
    setEmployees(employees.filter((_, i) => i !== index));
  };

  const onSubmitCompany = (data: z.infer<typeof companySchema>) => {
    createCompanyMutation.mutate(data);
  };

  const onSubmitEmployee = (data: z.infer<typeof employeeSchema>) => {
    // This would need a company ID, which should be selected from existing companies
    // For now, we'll just show the form structure
    console.log("Employee data:", data);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Company Setup</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Set up your company and manage employee access to AI Sentinel
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Configure your company details and domain for automatic employee recognition
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                        <FormLabel>Company Logo URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/logo.png" {...field} />
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
            </CardContent>
          </Card>

          {/* Employee Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee Management
              </CardTitle>
              <CardDescription>
                Add employees who are authorized to use AI Sentinel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...employeeForm}>
                <form onSubmit={employeeForm.handleSubmit(onSubmitEmployee)} className="space-y-4">
                  <FormField
                    control={employeeForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee Email</FormLabel>
                        <FormControl>
                          <Input placeholder="john.doe@acme.com" {...field} />
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
            </CardContent>
          </Card>
        </div>

        {/* Employee List */}
        {employees.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Authorized Employees</CardTitle>
              <CardDescription>
                Employees who can access AI Sentinel when they sign in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {employees.map((email, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="font-medium">{email}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEmployee(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}