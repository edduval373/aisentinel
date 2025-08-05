import { useState } from 'react';
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
import { apiRequest } from '@/lib/queryClient';

export default function CreateProviders() {
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [showEditProvider, setShowEditProvider] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AiProvider | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<AiProvider | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Fetch AI providers
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['/api/admin/ai-providers'],
  });

  // Create provider mutation
  const createProviderMutation = useMutation({
    mutationFn: (data: InsertAiProvider) => apiRequest('/api/admin/ai-providers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-providers'] });
      toast({
        title: "Provider Created",
        description: "AI provider has been created successfully.",
      });
      setShowAddProvider(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create provider",
        variant: "destructive",
      });
    },
  });

  // Update provider mutation
  const updateProviderMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: InsertAiProvider }) => 
      apiRequest(`/api/admin/ai-providers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-providers'] });
      toast({
        title: "Provider Updated",
        description: "AI provider has been updated successfully.",
      });
      setShowEditProvider(false);
      setEditingProvider(null);
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
    mutationFn: (id: number) => apiRequest(`/api/admin/ai-providers/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-providers'] });
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
    if (editingProvider) {
      updateProviderMutation.mutate({ id: editingProvider.id, data });
    } else {
      createProviderMutation.mutate(data);
    }
  };

  const handleEdit = (provider: AiProvider) => {
    setEditingProvider(provider);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <div style={{ width: '200px', height: '24px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}></div>
        </div>
        <div style={{ display: 'grid', gap: '16px' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ height: '100px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: '#1f2937',
          margin: 0 
        }}>
          AI Providers
        </h1>
        
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
                          <Input placeholder="https://openai.com" {...field} />
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
                          <Input placeholder="https://platform.openai.com/docs" {...field} />
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
                    disabled={createProviderMutation.isPending}
                    style={{ 
                      backgroundColor: '#f97316',
                      color: 'white',
                      opacity: createProviderMutation.isPending ? 0.5 : 1
                    }}
                  >
                    {createProviderMutation.isPending ? 'Creating...' : 'Create Provider'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
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
                        <Input placeholder="https://openai.com" {...field} />
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
                        <Input placeholder="https://platform.openai.com/docs" {...field} />
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