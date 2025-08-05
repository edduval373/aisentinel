import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { insertAiProviderSchema, type AiProvider, type InsertAiProvider } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export default function CreateProviders() {
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [showEditProvider, setShowEditProvider] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AiProvider | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<AiProvider | null>(null);
  const [nameCheckResult, setNameCheckResult] = useState<{
    checking: boolean;
    exists: boolean;
    message: string;
  }>({ checking: false, exists: false, message: "" });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Authentication check - super-user only
  if (!user || (user.roleLevel ?? 0) < 1000) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444', fontSize: '24px', marginBottom: '16px' }}>Access Denied</h1>
        <p style={{ color: '#6b7280' }}>Super-user access (1000+) required for AI Provider management.</p>
      </div>
    );
  }

  const form = useForm<InsertAiProvider>({
    resolver: zodResolver(insertAiProviderSchema),
    defaultValues: {
      name: '',
      displayName: '',
      description: '',
      website: '',
      apiDocUrl: '',
      isEnabled: true,
    },
  });

  // Fetch AI providers with proper authentication
  const token = localStorage.getItem('sessionToken');
  
  const { data: providers = [], isLoading, error: providersError, refetch: refetchProviders } = useQuery({
    queryKey: ['/api/admin/ai-providers'],
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch('/api/admin/ai-providers', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Session-Token': token || '',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch providers: ${response.status}`);
      }
      
      return response.json();
    }
  }) as { data: AiProvider[], isLoading: boolean, error: any, refetch: () => Promise<any> };

  // Name availability checking (following ScreenStandards.md pattern)
  const checkNameAvailability = React.useCallback(
    React.useMemo(
      () => {
        let timeoutId: NodeJS.Timeout;
        return (name: string) => {
          clearTimeout(timeoutId);
          
          if (!name || name.length < 2) {
            setNameCheckResult({ checking: false, exists: false, message: "" });
            return;
          }

          setNameCheckResult({ checking: true, exists: false, message: "Checking name..." });
          
          timeoutId = setTimeout(async () => {
            const nameExists = providers.some(provider => 
              provider.name?.toLowerCase() === name.toLowerCase() && 
              (!editingProvider || provider.id !== editingProvider.id)
            );
            
            setNameCheckResult({ 
              checking: false, 
              exists: nameExists, 
              message: nameExists ? "❌ This name is already taken" : "✅ Name is available" 
            });
          }, 300);
        };
      },
      [providers, editingProvider]
    ),
    [providers, editingProvider]
  );

  // Create provider mutation
  const createProviderMutation = useMutation({
    mutationFn: async (data: InsertAiProvider) => {
      const response = await fetch('/api/admin/ai-providers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Session-Token': token || '',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to create provider: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetchProviders();
      toast({
        title: "Provider Created",
        description: "AI provider has been created successfully.",
      });
      setShowAddProvider(false);
      setNameCheckResult({ checking: false, exists: false, message: "" });
      form.reset();
    },
    onError: (error: any) => {
      let errorMessage = "Failed to create provider";
      
      if (error?.message.includes("duplicate key") || 
          error?.message.includes("unique constraint") || 
          error?.message.includes("violates unique constraint")) {
        errorMessage = "This provider name already exists. Please choose a different name.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update provider mutation
  const updateProviderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertAiProvider }) => {
      const response = await fetch(`/api/admin/ai-providers/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Session-Token': token || '',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to update provider: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetchProviders();
      toast({
        title: "Provider Updated",
        description: "AI provider has been updated successfully.",
      });
      setShowEditProvider(false);
      setEditingProvider(null);
      setNameCheckResult({ checking: false, exists: false, message: "" });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update provider",
        variant: "destructive",
      });
    },
  });

  // Delete provider mutation
  const deleteProviderMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/ai-providers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Session-Token': token || '',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to delete provider: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetchProviders();
      toast({
        title: "Provider Deleted",
        description: "AI provider has been deleted successfully.",
      });
      setShowDeleteDialog(false);
      setProviderToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete provider",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertAiProvider) => {
    // CRITICAL: Block submission if validation shows duplicates
    if (nameCheckResult.exists) {
      toast({
        variant: "destructive",
        title: "Duplicate Name",
        description: "This name already exists. Please choose a different name.",
      });
      return;
    }

    if (editingProvider) {
      updateProviderMutation.mutate({ id: editingProvider.id, data });
    } else {
      createProviderMutation.mutate(data);
    }
  };

  const handleEdit = (provider: AiProvider) => {
    setEditingProvider(provider);
    setNameCheckResult({ checking: false, exists: false, message: "" });
    form.reset({
      name: provider.name,
      displayName: provider.displayName,
      description: provider.description || '',
      website: provider.website || '',
      apiDocUrl: provider.apiDocUrl || '',
      isEnabled: provider.isEnabled,
    });
    setShowEditProvider(true);
  };

  const handleDelete = (provider: AiProvider) => {
    setProviderToDelete(provider);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (providerToDelete) {
      deleteProviderMutation.mutate(providerToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: 'white',
          padding: '24px',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>AI Providers</h1>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>Manage universal AI providers for the platform</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            border: '2px solid #e5e7eb',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{ color: '#6b7280' }}>Loading AI providers...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header section following ScreenStandards.md pattern */}
      <div style={{ 
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        color: 'white',
        padding: '24px',
        borderRadius: '8px',
        marginBottom: '24px'
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>AI Providers</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>Manage universal AI providers for the platform</p>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: '#3b82f6',
          margin: 0 
        }}>
          Provider Management
        </h2>
        
        <Dialog open={showAddProvider} onOpenChange={setShowAddProvider}>
          <DialogTrigger asChild>
            <Button>
              <Plus style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New AI Provider</DialogTitle>
              <DialogDescription>
                Create a new AI provider that will be available in the provider dropdown.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{ fontSize: '14px', fontWeight: '500' }}>
                          <span style={{ color: '#dc2626' }}>*</span> Internal Name (must be unique)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="openai" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              checkNameAvailability(e.target.value);
                            }}
                            style={{
                              borderColor: nameCheckResult.exists ? '#ef4444' : 
                                          nameCheckResult.message.includes("✅") ? '#10b981' : '#d1d5db',
                              backgroundColor: nameCheckResult.exists ? '#fef2f2' : 
                                              nameCheckResult.message.includes("✅") ? '#f0fdf4' : '#ffffff'
                            }}
                          />
                        </FormControl>
                        {nameCheckResult.message && (
                          <div style={{ 
                            fontSize: '13px', 
                            marginTop: '4px',
                            fontWeight: '500',
                            color: nameCheckResult.checking ? '#6b7280' :
                                   nameCheckResult.exists ? '#ef4444' : '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: nameCheckResult.exists ? '#fef2f2' : 
                                            nameCheckResult.message.includes("✅") ? '#f0fdf4' : 'transparent',
                            padding: nameCheckResult.message ? '6px 8px' : '0',
                            borderRadius: '4px',
                            border: nameCheckResult.exists ? '1px solid #fecaca' : 
                                   nameCheckResult.message.includes("✅") ? '1px solid #bbf7d0' : 'none'
                          }}>
                            {nameCheckResult.checking && (
                              <div style={{
                                width: '12px',
                                height: '12px',
                                border: '2px solid #e5e7eb',
                                borderTop: '2px solid #3b82f6',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                              }} />
                            )}
                            {nameCheckResult.message}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{ fontSize: '14px', fontWeight: '500' }}>
                          <span style={{ color: '#dc2626' }}>*</span> Display Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="OpenAI" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: '#64748b', fontWeight: '500', fontSize: '14px' }}>
                        Description (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of the AI provider..." 
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{ color: '#64748b', fontWeight: '500', fontSize: '14px' }}>
                          Website (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://openai.com" 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="apiDocUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{ color: '#64748b', fontWeight: '500', fontSize: '14px' }}>
                          API Documentation (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://platform.openai.com/docs" 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isEnabled"
                  render={({ field }) => (
                    <FormItem style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel style={{ margin: 0 }}>Enable this provider</FormLabel>
                    </FormItem>
                  )}
                />

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddProvider(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createProviderMutation.isPending || nameCheckResult.exists || nameCheckResult.checking}
                    style={{ 
                      backgroundColor: (createProviderMutation.isPending || nameCheckResult.exists || nameCheckResult.checking) ? '#9ca3af' : '#10b981',
                      color: 'white',
                      opacity: (createProviderMutation.isPending || nameCheckResult.exists || nameCheckResult.checking) ? 0.7 : 1,
                      cursor: (createProviderMutation.isPending || nameCheckResult.exists || nameCheckResult.checking) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {createProviderMutation.isPending ? 'Creating...' : 
                     nameCheckResult.checking ? 'Validating...' :
                     nameCheckResult.exists ? 'Name Taken' : 
                     editingProvider ? 'Update Provider' : 'Create Provider'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Three-column grid layout following ScreenStandards.md pattern */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '16px' 
      }}>
        {providers.map((provider: AiProvider) => (
          <div 
            key={provider.id} 
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: 'white',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#1f2937',
                    margin: 0 
                  }}>
                    {provider.displayName}
                  </h3>
                  <span style={{
                    fontSize: '12px',
                    color: '#64748b',
                    backgroundColor: '#f1f5f9',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    {provider.name}
                  </span>
                  {!provider.isEnabled && (
                    <span style={{
                      fontSize: '12px',
                      color: '#dc2626',
                      backgroundColor: '#fef2f2',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      Disabled
                    </span>
                  )}
                </div>
                
                {provider.description && (
                  <p style={{ 
                    color: '#64748b', 
                    fontSize: '14px',
                    margin: '0 0 12px 0',
                    lineHeight: '1.5'
                  }}>
                    {provider.description}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {provider.website && (
                    <a 
                      href={provider.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#2563eb',
                        textDecoration: 'none',
                        fontSize: '14px'
                      }}
                    >
                      Website <ExternalLink style={{ width: '14px', height: '14px' }} />
                    </a>
                  )}
                  {provider.apiDocUrl && (
                    <a 
                      href={provider.apiDocUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#2563eb',
                        textDecoration: 'none',
                        fontSize: '14px'
                      }}
                    >
                      API Docs <ExternalLink style={{ width: '14px', height: '14px' }} />
                    </a>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(provider)}
                >
                  <Edit style={{ width: '16px', height: '16px' }} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(provider)}
                  style={{ color: '#dc2626', borderColor: '#dc2626' }}
                >
                  <Trash2 style={{ width: '16px', height: '16px' }} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Provider Dialog */}
      <Dialog open={showEditProvider} onOpenChange={setShowEditProvider}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit AI Provider</DialogTitle>
            <DialogDescription>
              Update provider information and settings.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ fontSize: '14px', fontWeight: '500' }}>
                        <span style={{ color: '#dc2626' }}>*</span> Internal Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="openai" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ fontSize: '14px', fontWeight: '500' }}>
                        <span style={{ color: '#dc2626' }}>*</span> Display Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="OpenAI" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: '#64748b', fontWeight: '500', fontSize: '14px' }}>
                      Description (Optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the AI provider..." 
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: '#64748b', fontWeight: '500', fontSize: '14px' }}>
                        Website (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://openai.com" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="apiDocUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: '#64748b', fontWeight: '500', fontSize: '14px' }}>
                        API Documentation (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://platform.openai.com/docs" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isEnabled"
                render={({ field }) => (
                  <FormItem style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel style={{ margin: 0 }}>Enable this provider</FormLabel>
                  </FormItem>
                )}
              />

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditProvider(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateProviderMutation.isPending}
                  style={{ 
                    backgroundColor: '#f97316',
                    color: 'white',
                    opacity: updateProviderMutation.isPending ? 0.5 : 1
                  }}
                >
                  {updateProviderMutation.isPending ? 'Updating...' : 'Update Provider'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete AI Provider</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{providerToDelete?.displayName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDelete}
              disabled={deleteProviderMutation.isPending}
              style={{ 
                backgroundColor: '#dc2626',
                color: 'white',
                opacity: deleteProviderMutation.isPending ? 0.5 : 1
              }}
            >
              {deleteProviderMutation.isPending ? 'Deleting...' : 'Delete Provider'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}