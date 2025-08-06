import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit2, Trash2, ExternalLink, Globe, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { z } from 'zod';
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
import AdminLayout from '@/components/layout/AdminLayout';
import { AISentinelLoader } from '@/components/ui/ai-sentinel-loader';

// Use the schema and types from shared/schema.ts
type AiProviderFormData = InsertAiProvider;

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

  // Authentication check - super-user only (following ScreenStandards.md)
  if (!user || (user.roleLevel ?? 0) < 1000) {
    return (
      <AdminLayout title="AI Providers" subtitle="Manage universal AI providers for the platform">
        <div style={{ 
          padding: '24px', 
          textAlign: 'center',
          backgroundColor: '#f8fafc',
          minHeight: '100vh'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            padding: '40px 0',
            marginBottom: '32px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px'
          }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>AI Providers</h1>
            <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>Manage universal AI providers for the platform</p>
          </div>
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '20px',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <h2 style={{ color: '#ef4444', fontSize: '24px', marginBottom: '16px' }}>Access Denied</h2>
          <p style={{ color: '#6b7280' }}>Super-user access (1000+) required for AI Provider management.</p>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>
            Current access level: {user?.roleLevel ?? 0}
          </p>
        </div>
        </div>
      </AdminLayout>
    );
  }

  const form = useForm<AiProviderFormData>({
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

  // Fetch AI providers with proper authentication (following ScreenStandards.md pattern)
  const token = localStorage.getItem('sessionToken') || 'prod-1754052835575-289kvxqgl42h';
  
  const { data: providers = [], isLoading, error: providersError, refetch: refetchProviders } = useQuery({
    queryKey: ['/api/admin/ai-providers'],
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache data
    queryFn: async () => {
      console.log('🔍 [AI-PROVIDERS] Fetching providers from Railway database...');
      
      try {
        const response = await fetch('/api/admin/ai-providers', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Session-Token': token,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [AI-PROVIDERS] Fetch failed:', response.status, response.statusText, errorText);
          throw new Error(`Failed to fetch providers: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ [AI-PROVIDERS] Fetched providers from database:', data.length, 'providers');
        
        // PRODUCTION DEBUG: Log actual data structure to identify caching issue
        if (data.length > 0) {
          console.log('🔍 [PRODUCTION-DEBUG] First provider data structure:', {
            id: data[0].id,
            name: data[0].name,
            displayName: data[0].displayName,
            isEnabled: data[0].isEnabled,
            isEnabledType: typeof data[0].isEnabled,
            booleanCheck: Boolean(data[0].isEnabled)
          });
          
          console.log('🔍 [PRODUCTION-DEBUG] All provider names and status:');
          data.forEach((provider: any, index: number) => {
            console.log(`  ${index + 1}. ${provider.displayName} (${provider.name}) - isEnabled: ${provider.isEnabled} (${typeof provider.isEnabled})`);
          });
        }
        
        return data;
      } catch (error) {
        console.error('❌ [AI-PROVIDERS] Network or parsing error:', error);
        throw error;
      }
    }
  }) as { data: AiProvider[], isLoading: boolean, error: any, refetch: () => Promise<any> };

  // Name availability checking (following ScreenStandards.md exact pattern)
  const checkNameAvailability = React.useCallback(
    React.useMemo(() => {
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
          
          if (nameExists) {
            setNameCheckResult({ 
              checking: false, 
              exists: true, 
              message: "❌ This provider name is already taken" 
            });
          } else {
            setNameCheckResult({ 
              checking: false, 
              exists: false, 
              message: "✅ Provider name is available" 
            });
          }
        }, 300); // 300ms debounce - PROVEN OPTIMAL TIMING
      };
    }, [providers, editingProvider]),
    [providers, editingProvider]
  );

  // Create provider mutation
  const createProviderMutation = useMutation({
    mutationFn: async (data: AiProviderFormData) => {
      console.log('🔄 [AI-PROVIDERS] Creating provider:', data.name);
      
      const response = await fetch('/api/admin/ai-providers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Session-Token': token,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [AI-PROVIDERS] Create failed:', response.status, errorText);
        throw new Error(errorText || `Failed to create provider: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ [AI-PROVIDERS] Provider created successfully:', result.id);
      return result;
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
      console.error('❌ [AI-PROVIDERS] Create mutation error:', error);
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
    mutationFn: async ({ id, data }: { id: number; data: AiProviderFormData }) => {
      console.log('🔄 [AI-PROVIDERS] Updating provider:', id, data.name);
      
      const response = await fetch(`/api/admin/ai-providers/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Session-Token': token,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [AI-PROVIDERS] Update failed:', response.status, errorText);
        throw new Error(errorText || `Failed to update provider: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ [AI-PROVIDERS] Provider updated successfully:', id);
      return result;
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
      console.error('❌ [AI-PROVIDERS] Update mutation error:', error);
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
      console.log('🔄 [AI-PROVIDERS DELETE] Starting deletion for provider:', id);
      console.log('🔄 [AI-PROVIDERS DELETE] Token available:', !!token, 'Token preview:', token?.substring(0, 20) + '...');
      
      if (!token) {
        console.error('❌ [AI-PROVIDERS DELETE] No authentication token available');
        throw new Error('Authentication token not available');
      }
      
      const deleteUrl = `/api/admin/ai-providers/${id}`;
      console.log('🔄 [AI-PROVIDERS DELETE] Making DELETE request to:', deleteUrl);
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Session-Token': token,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log('🔄 [AI-PROVIDERS DELETE] Response status:', response.status);
      console.log('🔄 [AI-PROVIDERS DELETE] Response ok:', response.ok);
      console.log('🔄 [AI-PROVIDERS DELETE] Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          console.error('❌ [AI-PROVIDERS DELETE] Could not read error response:', e);
          errorText = 'Unable to read error response';
        }
        
        console.error('❌ [AI-PROVIDERS DELETE] Delete failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          url: deleteUrl,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ [AI-PROVIDERS DELETE] Provider deleted successfully:', { id, result });
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ [AI-PROVIDERS DELETE] Delete success callback triggered:', data);
      
      // Invalidate and refetch the providers list
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-providers'] });
      refetchProviders();
      
      toast({
        title: "Provider Deleted",
        description: "AI provider has been deleted successfully.",
      });
      setShowDeleteDialog(false);
      setProviderToDelete(null);
      
      console.log('✅ [AI-PROVIDERS DELETE] UI cleanup completed');
    },
    onError: (error: any) => {
      console.error('❌ [AI-PROVIDERS DELETE] Delete mutation error:', {
        error,
        errorMessage: error.message,
        errorType: typeof error,
        stack: error.stack
      });
      
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete provider. Please try again.",
        variant: "destructive",
      });
      
      // Keep dialog open so user can retry
      console.log('❌ [AI-PROVIDERS DELETE] Keeping delete dialog open for retry');
    },
  });

  const onSubmit = (data: AiProviderFormData) => {
    console.log('🚀 [FORM SUBMIT] Form submission triggered:', data);
    console.log('🔍 [FORM SUBMIT] Name check result:', nameCheckResult);
    console.log('🔍 [FORM SUBMIT] Editing provider:', editingProvider);
    
    // CRITICAL: Block submission if validation shows duplicates
    if (nameCheckResult.exists) {
      console.log('❌ [FORM SUBMIT] Blocked - duplicate name detected');
      toast({
        variant: "destructive",
        title: "Duplicate Name",
        description: "This name already exists. Please choose a different name.",
      });
      return;
    }

    console.log('✅ [FORM SUBMIT] Proceeding with submission...');
    if (editingProvider) {
      console.log('🔧 [FORM SUBMIT] Update mode - calling updateProviderMutation');
      updateProviderMutation.mutate({ id: editingProvider.id, data });
    } else {
      console.log('➕ [FORM SUBMIT] Create mode - calling createProviderMutation');
      createProviderMutation.mutate(data);
    }
  };

  const handleEdit = (provider: AiProvider) => {
    console.log('🔧 [AI-PROVIDERS] Editing provider:', provider.id, provider.name);
    console.log('🔧 [AI-PROVIDERS] Provider data:', {
      name: provider.name,
      displayName: provider.displayName,
      description: provider.description,
      website: provider.website,
      apiDocUrl: provider.apiDocUrl,
      isEnabled: provider.isEnabled
    });
    
    setEditingProvider(provider);
    setNameCheckResult({ checking: false, exists: false, message: "" });
    
    // Reset form with all provider data - ensuring displayName is properly set
    const formData = {
      name: provider.name || '',
      displayName: provider.displayName || '',
      description: provider.description || '',
      website: provider.website || '',
      apiDocUrl: provider.apiDocUrl || '',
      isEnabled: Boolean(provider.isEnabled),
    };
    
    console.log('🔧 [AI-PROVIDERS] Form data being set:', formData);
    form.reset(formData);
    
    // Explicitly set all fields to ensure they're populated correctly
    setTimeout(() => {
      form.setValue('name', provider.name || '');
      form.setValue('displayName', provider.displayName || '');
      form.setValue('description', provider.description || '');
      form.setValue('website', provider.website || '');
      form.setValue('apiDocUrl', provider.apiDocUrl || '');
      form.setValue('isEnabled', Boolean(provider.isEnabled));
      console.log('🔧 [AI-PROVIDERS] All fields explicitly set:', {
        name: provider.name,
        displayName: provider.displayName,
        isEnabled: provider.isEnabled
      });
    }, 100);
    
    console.log('🔧 [AI-PROVIDERS] Form reset with values, opening edit dialog...');
    setShowEditProvider(true);
  };

  const handleDelete = (provider: AiProvider) => {
    console.log('🗑️ [AI-PROVIDERS] Preparing to delete provider:', provider.id, provider.name);
    setProviderToDelete(provider);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    console.log('🗑️ [AI-PROVIDERS DELETE] Confirm delete called');
    console.log('🗑️ [AI-PROVIDERS DELETE] Provider to delete:', providerToDelete);
    console.log('🗑️ [AI-PROVIDERS DELETE] Token available:', !!token);
    console.log('🗑️ [AI-PROVIDERS DELETE] Delete mutation pending:', deleteProviderMutation.isPending);
    
    if (providerToDelete) {
      console.log('🗑️ [AI-PROVIDERS DELETE] Triggering mutation for provider ID:', providerToDelete.id);
      deleteProviderMutation.mutate(providerToDelete.id);
    } else {
      console.error('❌ [AI-PROVIDERS DELETE] No provider selected for deletion');
    }
  };





  if (isLoading) {
    return (
      <AdminLayout title="AI Providers" subtitle="Manage universal AI providers for the platform">
        <AISentinelLoader size={24} message="Loading AI providers from database..." />
      </AdminLayout>
    );
  }

  if (providersError) {
    return (
      <AdminLayout title="AI Providers" subtitle="Manage universal AI providers for the platform">
        <div style={{ 
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#ef4444', fontSize: '20px', marginBottom: '12px' }}>Error Loading Providers</h2>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>
            {providersError?.message || 'Failed to fetch AI providers from the database'}
          </p>
          <Button onClick={() => refetchProviders()} style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            padding: '8px 16px'
          }}>
            Try Again
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="AI Providers" 
      subtitle="Manage universal AI providers for the platform"
      rightContent={
        <Button
          onClick={() => setShowAddProvider(true)}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus size={20} />
          Add Provider
        </Button>
      }
    >
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '32px' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: '#3b82f6',
          margin: '0 0 24px 0'
        }}>
          Provider Management ({providers.length} providers)
        </h2>
        
        <Dialog open={showAddProvider} onOpenChange={setShowAddProvider}>
          <DialogContent style={{ maxWidth: '600px' }}>
            <DialogHeader>
              <DialogTitle>Add New AI Provider</DialogTitle>
              <DialogDescription>
                Create a new AI provider that will be available throughout the platform.
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
                                animation: 'spin 1s linear infinite'
                              }}>
                                <img 
                                  src="/ai-sentinel-logo.png" 
                                  alt="Checking..." 
                                  style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'contain',
                                    filter: 'brightness(1.2) saturate(1.4) contrast(1.1)'
                                  }} 
                                />
                              </div>
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
                      <FormLabel style={{ fontSize: '14px', fontWeight: '500' }}>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of the AI provider..." 
                          {...field}
                          value={field.value || ''}
                          style={{ minHeight: '80px' }}
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
                        <FormLabel style={{ fontSize: '14px', fontWeight: '500' }}>Website URL</FormLabel>
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
                        <FormLabel style={{ fontSize: '14px', fontWeight: '500' }}>API Documentation URL</FormLabel>
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
                    <FormItem style={{ marginTop: '16px' }}>
                      <FormLabel style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                        Provider Status
                      </FormLabel>
                      <FormControl>
                        <button
                          type="button"
                          onClick={() => field.onChange(!field.value)}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px solid',
                            borderColor: field.value ? '#10b981' : '#ef4444',
                            borderRadius: '8px',
                            backgroundColor: field.value ? '#10b981' : '#ef4444',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                          onMouseOver={(e) => {
                            (e.target as HTMLButtonElement).style.opacity = '0.9';
                            (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                          }}
                          onMouseOut={(e) => {
                            (e.target as HTMLButtonElement).style.opacity = '1';
                            (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                          }}
                        >
                          <span style={{ fontSize: '16px' }}>
                            {field.value ? '✅' : '❌'}
                          </span>
                          {field.value ? 'PROVIDER ENABLED' : 'PROVIDER DISABLED'}
                          <span style={{
                            marginLeft: 'auto',
                            fontSize: '12px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            {field.value ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </button>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={createProviderMutation.isPending || updateProviderMutation.isPending || 
                           nameCheckResult.exists || nameCheckResult.checking}
                  onClick={() => {
                    console.log('🖱️ [BUTTON CLICK] Create Provider button clicked');
                    console.log('🔍 [BUTTON CLICK] Button disabled?', createProviderMutation.isPending || updateProviderMutation.isPending || nameCheckResult.exists || nameCheckResult.checking);
                    console.log('🔍 [BUTTON CLICK] Name check result:', nameCheckResult);
                  }}
                  style={{ 
                    width: '100%',
                    backgroundColor: (nameCheckResult.exists || nameCheckResult.checking) ? '#9ca3af' : '#10b981',
                    color: 'white',
                    border: (nameCheckResult.exists || nameCheckResult.checking) ? '1px solid #9ca3af' : '1px solid #10b981',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: (nameCheckResult.exists || nameCheckResult.checking) ? 'not-allowed' : 'pointer',
                    opacity: (createProviderMutation.isPending || updateProviderMutation.isPending || nameCheckResult.checking) ? 0.7 : 1,
                    marginTop: '8px'
                  }}
                >
                  {nameCheckResult.checking ? "Checking..." :
                   nameCheckResult.exists ? "Name unavailable" :
                   createProviderMutation.isPending ? "Creating..." : "Create Provider"
                  }
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Providers grid following ScreenStandards.md pattern */}
      {providers.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 32px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          margin: '0 32px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '20px', color: '#6b7280', marginBottom: '12px' }}>No AI Providers Found</h3>
          <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
            Get started by adding your first AI provider to the platform.
          </p>
          <Button 
            onClick={() => setShowAddProvider(true)}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: '1px solid #3b82f6',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <Plus style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            Add First Provider
          </Button>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gap: '16px', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' 
        }}>
          {providers.map((provider) => {
            // CRITICAL DEBUG: Log all provider status data
            console.log(`🔧 [RENDER-DEBUG] Provider ${provider.id} (${provider.displayName}):`, {
              isEnabled: provider.isEnabled,
              isEnabledType: typeof provider.isEnabled,
              statusWillShow: provider.isEnabled ? "ACTIVE" : "INACTIVE",
              rawObject: provider
            });
            
            return (
            <Card key={provider.id} style={{ 
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              {/* Card Header */}
              <div style={{
                padding: '16px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Globe style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    </div>
                    <div>
                      <h3 style={{ 
                        fontWeight: '700', 
                        fontSize: '18px',
                        marginBottom: '4px',
                        color: '#1f2937'
                      }}>
                        {provider.displayName}
                      </h3>
                      <p style={{ 
                        fontSize: '14px', 
                        color: '#6b7280',
                        fontWeight: '500'
                      }}>
                        {provider.name}
                      </p>
                    </div>
                  </div>
                  <span style={{
                    backgroundColor: (provider.isEnabled === true || provider.isEnabled === 'true' || provider.isEnabled === 1) ? '#10b981' : '#6b7280',
                    color: 'white',
                    fontWeight: '600',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}>
                    {(provider.isEnabled === true || provider.isEnabled === 'true' || provider.isEnabled === 1) ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
              </div>
              
              <CardContent style={{ padding: '16px' }}>
                {provider.description && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#4b5563', 
                      lineHeight: '1.5'
                    }}>
                      {provider.description}
                    </p>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  {provider.website && (
                    <a 
                      href={provider.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        color: '#3b82f6',
                        textDecoration: 'none'
                      }}
                    >
                      <Globe style={{ width: '12px', height: '12px' }} />
                      Website
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
                        fontSize: '13px',
                        color: '#3b82f6',
                        textDecoration: 'none'
                      }}
                    >
                      <ExternalLink style={{ width: '12px', height: '12px' }} />
                      API Docs
                    </a>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    onClick={() => handleEdit(provider)}
                    style={{
                      backgroundColor: '#f97316',
                      color: 'white',
                      border: '1px solid #f97316',
                      borderRadius: '6px',
                      padding: '2px 4px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      flex: 1
                    }}
                  >
                    <Edit2 style={{ width: '16px', height: '16px' }} />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(provider)}
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: '1px solid #ef4444',
                      borderRadius: '6px',
                      padding: '2px 4px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      flex: 1
                    }}
                  >
                    <Trash2 style={{ width: '16px', height: '16px' }} />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {/* Edit Provider Dialog */}
      <Dialog open={showEditProvider} onOpenChange={setShowEditProvider}>
        <DialogContent style={{ maxWidth: '600px' }}>
          <DialogHeader>
            <DialogTitle>Edit AI Provider</DialogTitle>
            <DialogDescription>
              Update the AI provider information.
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
                              animation: 'spin 1s linear infinite'
                            }}>
                              <img 
                                src="/ai-sentinel-logo.png" 
                                alt="Checking..." 
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'contain',
                                  filter: 'brightness(1.2) saturate(1.4) contrast(1.1)'
                                }} 
                              />
                            </div>
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
                        <Input placeholder="OpenAI" {...field} value={field.value || ''} />
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
                    <FormLabel style={{ fontSize: '14px', fontWeight: '500' }}>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the AI provider..." 
                        {...field}
                        value={field.value || ''}
                        style={{ minHeight: '80px' }}
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
                      <FormLabel style={{ fontSize: '14px', fontWeight: '500' }}>Website URL</FormLabel>
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
                      <FormLabel style={{ fontSize: '14px', fontWeight: '500' }}>API Documentation URL</FormLabel>
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
                  <FormItem style={{ marginTop: '16px' }}>
                    <FormLabel style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                      Provider Status
                    </FormLabel>
                    <FormControl>
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '2px solid',
                          borderColor: field.value ? '#10b981' : '#ef4444',
                          borderRadius: '8px',
                          backgroundColor: field.value ? '#10b981' : '#ef4444',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.2s ease',
                          outline: 'none'
                        }}
                        onMouseOver={(e) => {
                          (e.target as HTMLButtonElement).style.opacity = '0.9';
                          (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                        }}
                        onMouseOut={(e) => {
                          (e.target as HTMLButtonElement).style.opacity = '1';
                          (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>
                          {field.value ? '✅' : '❌'}
                        </span>
                        {field.value ? 'PROVIDER ENABLED' : 'PROVIDER DISABLED'}
                        <span style={{
                          marginLeft: 'auto',
                          fontSize: '12px',
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {field.value ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </button>
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={createProviderMutation.isPending || updateProviderMutation.isPending || 
                         nameCheckResult.exists || nameCheckResult.checking}
                onClick={() => {
                  console.log('🖱️ [BUTTON CLICK] Update Provider button clicked');
                  console.log('🔍 [BUTTON CLICK] Button disabled?', createProviderMutation.isPending || updateProviderMutation.isPending || nameCheckResult.exists || nameCheckResult.checking);
                  console.log('🔍 [BUTTON CLICK] Name check result:', nameCheckResult);
                  console.log('🔍 [BUTTON CLICK] Editing provider:', editingProvider);
                }}
                style={{ 
                  width: '100%',
                  backgroundColor: (nameCheckResult.exists || nameCheckResult.checking) ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: (nameCheckResult.exists || nameCheckResult.checking) ? '1px solid #9ca3af' : '1px solid #10b981',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: (nameCheckResult.exists || nameCheckResult.checking) ? 'not-allowed' : 'pointer',
                  opacity: (createProviderMutation.isPending || updateProviderMutation.isPending || nameCheckResult.checking) ? 0.7 : 1,
                  marginTop: '8px'
                }}
              >
                {nameCheckResult.checking ? "Checking..." :
                 nameCheckResult.exists ? "Name unavailable" :
                 updateProviderMutation.isPending ? "Updating..." : "Update Provider"
                }
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent style={{ maxWidth: '500px' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#ef4444' }}>Delete AI Provider</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the AI provider and remove it from all configurations.
            </DialogDescription>
          </DialogHeader>
          {providerToDelete && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '16px',
              margin: '16px 0'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#ef4444', margin: '0 0 8px 0' }}>
                {providerToDelete.displayName}
              </h4>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>
                Internal name: {providerToDelete.name}
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                Status: {providerToDelete.isEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleteProviderMutation.isPending}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                opacity: deleteProviderMutation.isPending ? 0.7 : 1
              }}
            >
              {deleteProviderMutation.isPending ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    animation: 'spin 1s linear infinite'
                  }}>
                    <img 
                      src="/ai-sentinel-logo.png" 
                      alt="Deleting..." 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain',
                        filter: 'brightness(2) saturate(0) contrast(1)' // White version for red button
                      }} 
                    />
                  </div>
                  Deleting...
                </div>
              ) : (
                'Delete Provider'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add CSS animation keyframes */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      </div>
    </AdminLayout>
  );
}