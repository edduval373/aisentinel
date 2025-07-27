import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, AlertCircle, CheckCircle, Settings, Link, Trash2, Edit } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import DemoBanner from "@/components/DemoBanner";
import { isDemoModeActive } from "@/utils/demoMode";
import DemoInfoDialog from "@/components/demo/DemoInfoDialog";
import { useDemoDialog } from "@/hooks/useDemoDialog";
import type { ContextDocument, ActivityType } from "@shared/schema";

export default function ContextManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ContextDocument | null>(null);
  const [selectedActivityType, setSelectedActivityType] = useState<number | null>(null);
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    category: "policy",
    priority: 1,
    file: null as File | null
  });

  // Demo mode detection
  const isDemoMode = isDemoModeActive(user);
  const { showDialog, openDialog, closeDialog } = useDemoDialog('context-management');

  // Fetch context documents
  const { data: documents, isLoading: documentsLoading } = useQuery<ContextDocument[]>({
    queryKey: ['/api/context-documents'],
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  // Fetch activity types for linking
  const { data: activityTypes } = useQuery<ActivityType[]>({
    queryKey: ['/api/activity-types'],
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest("/api/context-documents", "POST", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/context-documents'] });
      setShowUploadDialog(false);
      setUploadForm({ name: "", description: "", category: "policy", priority: 1, file: null });
      toast({
        title: "Document Uploaded",
        description: "Context document uploaded successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        toast({
          title: "Upload Failed",
          description: "Failed to upload document",
          variant: "destructive",
        });
      }
    },
  });

  // Update document mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ContextDocument> }) => {
      return await apiRequest(`/api/context-documents/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/context-documents'] });
      toast({
        title: "Document Updated",
        description: "Context document updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update document",
          variant: "destructive",
        });
      }
    },
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/context-documents/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/context-documents'] });
      toast({
        title: "Document Deleted",
        description: "Context document deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        toast({
          title: "Delete Failed",
          description: "Failed to delete document",
          variant: "destructive",
        });
      }
    },
  });

  // Create activity context link mutation
  const createLinkMutation = useMutation({
    mutationFn: async ({ activityTypeId, documentId, usageType }: { activityTypeId: number; documentId: number; usageType: string }) => {
      return await apiRequest(`/api/activity-types/${activityTypeId}/context-links`, "POST", {
        documentId,
        usageType
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/activity-types'] });
      setShowLinkDialog(false);
      setSelectedDocument(null);
      setSelectedActivityType(null);
      toast({
        title: "Link Created",
        description: "Document linked to activity type successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        toast({
          title: "Link Failed",
          description: "Failed to link document to activity type",
          variant: "destructive",
        });
      }
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm(prev => ({ ...prev, file }));
    }
  };

  const handleUpload = () => {
    if (!uploadForm.file || !uploadForm.name || !uploadForm.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select a file",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('name', uploadForm.name);
    formData.append('description', uploadForm.description);
    formData.append('category', uploadForm.category);
    formData.append('priority', uploadForm.priority.toString());

    uploadMutation.mutate(formData);
  };

  const handleToggleEnabled = (document: ContextDocument) => {
    updateMutation.mutate({
      id: document.id,
      data: { isEnabled: !document.isEnabled }
    });
  };

  const handleDeleteDocument = (id: number) => {
    if (confirm("Are you sure you want to delete this document? This will also remove all links to activity types.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreateLink = () => {
    if (!selectedDocument || !selectedActivityType) {
      toast({
        title: "Missing Selection",
        description: "Please select both a document and an activity type",
        variant: "destructive",
      });
      return;
    }

    createLinkMutation.mutate({
      activityTypeId: selectedActivityType,
      documentId: selectedDocument.id,
      usageType: "optional"
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'policy': return 'bg-red-100 text-red-800';
      case 'procedure': return 'bg-blue-100 text-blue-800';
      case 'guideline': return 'bg-green-100 text-green-800';
      case 'knowledge': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (documentsLoading) {
    return (
      <AdminLayout title="Context Management" subtitle="Upload and manage company documents that AI can reference during conversations">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <img 
              src="/ai-sentinel-logo.png" 
              alt="Loading" 
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 16px auto',
                animation: 'spin 2s linear infinite',
                filter: 'brightness(1.1) saturate(1.3) contrast(1.2)'
              }}
            />
            <p style={{
              marginTop: '8px',
              color: '#64748b',
              fontSize: '16px'
            }}>
              Loading context documents...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Context Management" 
      subtitle="Upload and manage company documents that AI can reference during conversations"
      rightContent={<DemoBanner message="Demo Mode - Read Only View - Documents cannot be modified" />}
    >
      <div style={{ padding: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#111827',
            margin: 0
          }}>
            All Documents
          </h2>
          <button
            onClick={isDemoMode ? () => openDialog('upload-document') : () => setShowUploadDialog(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            <Upload style={{ width: '16px', height: '16px' }} />
            Upload Document
          </button>
        </div>

        <div style={{ width: '100%' }}>
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <button style={{
              padding: '12px 16px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              Documents
            </button>
            <button style={{
              padding: '12px 16px',
              backgroundColor: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              Activity Links
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {documents?.length === 0 ? (
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '48px 24px',
                textAlign: 'center',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}>
                <FileText style={{
                  width: '64px',
                  height: '64px',
                  color: '#9ca3af',
                  margin: '0 auto 16px auto'
                }} />
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  No Documents Yet
                </h3>
                <p style={{
                  color: '#6b7280',
                  textAlign: 'center',
                  marginBottom: '0',
                  lineHeight: '1.5'
                }}>
                  Upload your first company document to get started with context-aware AI responses
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {documents?.map((document) => (
                  <div key={document.id} style={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderLeft: '4px solid #2563eb',
                    borderRadius: '12px',
                    padding: '0',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    transition: 'box-shadow 0.2s'
                  }}>
                    <div style={{
                      padding: '16px 20px 12px 20px',
                      borderBottom: '1px solid #f3f4f6'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <FileText style={{
                            width: '20px',
                            height: '20px',
                            color: '#2563eb'
                          }} />
                          <div>
                            <h3 style={{
                              fontSize: '18px',
                              fontWeight: '600',
                              color: '#111827',
                              margin: 0
                            }}>
                              {document.name}
                            </h3>
                            <p style={{
                              fontSize: '14px',
                              color: '#6b7280',
                              margin: '4px 0 0 0'
                            }}>
                              {document.fileName}
                            </p>
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: document.category === 'policy' ? '#fef2f2' :
                                           document.category === 'procedure' ? '#eff6ff' :
                                           document.category === 'guideline' ? '#f0fdf4' :
                                           document.category === 'knowledge' ? '#faf5ff' : '#f9fafb',
                            color: document.category === 'policy' ? '#991b1b' :
                                   document.category === 'procedure' ? '#1e40af' :
                                   document.category === 'guideline' ? '#166534' :
                                   document.category === 'knowledge' ? '#6b21a8' : '#374151'
                          }}>
                            {document.category}
                          </span>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: 'white',
                            color: '#374151',
                            border: '1px solid #d1d5db'
                          }}>
                            Priority {document.priority}
                          </span>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {document.isEnabled ? (
                              <CheckCircle style={{
                                width: '16px',
                                height: '16px',
                                color: '#059669'
                              }} />
                            ) : (
                              <AlertCircle style={{
                                width: '16px',
                                height: '16px',
                                color: '#dc2626'
                              }} />
                            )}
                            <span style={{
                              fontSize: '14px',
                              color: '#6b7280'
                            }}>
                              {document.isEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {document.description && (
                          <p style={{
                            color: '#374151',
                            margin: 0,
                            lineHeight: '1.5'
                          }}>
                            {document.description}
                          </p>
                        )}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                          color: '#6b7280'
                        }}>
                          <span>Size: {formatFileSize(document.fileSize)}</span>
                          <span>Created: {new Date(document.createdAt!).toLocaleDateString()}</span>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <label style={{
                            position: 'relative',
                            display: 'inline-block',
                            width: '44px',
                            height: '24px'
                          }}>
                            <input
                              type="checkbox"
                              checked={document.isEnabled}
                              onChange={isDemoMode ? () => openDialog('toggle-document') : () => handleToggleEnabled(document)}
                              style={{
                                opacity: 0,
                                width: 0,
                                height: 0
                              }}
                            />
                            <span style={{
                              position: 'absolute',
                              cursor: 'pointer',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: document.isEnabled ? '#2563eb' : '#cbd5e1',
                              transition: '.4s',
                              borderRadius: '24px'
                            }}>
                              <span style={{
                                position: 'absolute',
                                content: '""',
                                height: '18px',
                                width: '18px',
                                left: document.isEnabled ? '23px' : '3px',
                                bottom: '3px',
                                backgroundColor: 'white',
                                transition: '.4s',
                                borderRadius: '50%'
                              }}></span>
                            </span>
                          </label>
                          <span style={{ fontSize: '14px', color: '#374151' }}>
                            Enable for AI reference
                          </span>
                          <div style={{ flex: 1 }}></div>
                          <button
                            onClick={isDemoMode ? () => openDialog('link-activity') : () => {
                              setSelectedDocument(document);
                              setShowLinkDialog(true);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '8px 12px',
                              backgroundColor: 'white',
                              color: '#374151',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#f9fafb';
                              e.currentTarget.style.borderColor = '#9ca3af';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.borderColor = '#d1d5db';
                            }}
                          >
                            <Link style={{ width: '16px', height: '16px' }} />
                            Link to Activity
                          </button>
                          <button
                            onClick={isDemoMode ? () => openDialog('delete-document') : () => handleDeleteDocument(document.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '8px',
                              backgroundColor: 'white',
                              color: '#dc2626',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#fef2f2';
                              e.currentTarget.style.borderColor = '#fca5a5';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.borderColor = '#d1d5db';
                            }}
                          >
                            <Trash2 style={{ width: '16px', height: '16px' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Context Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Document File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".txt,.md,.json,.pdf,.docx"
                  onChange={handleFileChange}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Supported formats: TXT, MD, JSON, PDF, DOCX
                </p>
              </div>
              <div>
                <Label htmlFor="name">Document Name</Label>
                <Input
                  id="name"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter document name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the document"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={uploadForm.category} onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="policy">Policy</SelectItem>
                    <SelectItem value="procedure">Procedure</SelectItem>
                    <SelectItem value="guideline">Guideline</SelectItem>
                    <SelectItem value="knowledge">Knowledge Base</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={uploadForm.priority.toString()} onValueChange={(value) => setUploadForm(prev => ({ ...prev, priority: parseInt(value) }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Low</SelectItem>
                    <SelectItem value="2">2 - Medium</SelectItem>
                    <SelectItem value="3">3 - High</SelectItem>
                    <SelectItem value="4">4 - Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Link Dialog */}
        <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Link Document to Activity Type</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Selected Document</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  <p className="font-medium">{selectedDocument?.name}</p>
                  <p className="text-sm text-gray-600">{selectedDocument?.description}</p>
                </div>
              </div>
              <div>
                <Label htmlFor="activityType">Activity Type</Label>
                <Select value={selectedActivityType?.toString()} onValueChange={(value) => setSelectedActivityType(parseInt(value))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select activity type" />
                  </SelectTrigger>
                  <SelectContent>
                    {activityTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateLink} disabled={createLinkMutation.isPending}>
                  {createLinkMutation.isPending ? "Creating Link..." : "Create Link"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Demo Info Dialog */}
        <DemoInfoDialog
          isOpen={showDialog}
          onClose={closeDialog}
          title="Context Management"
          description="This feature allows you to upload and manage company documents that AI can reference during conversations. Documents can be categorized, prioritized, and linked to specific activity types for contextual AI responses."
          features={[
            "Upload documents in multiple formats (TXT, MD, JSON, PDF, DOCX)",
            "Categorize documents by type (Policy, Procedure, Guideline, Knowledge)",
            "Set priority levels for document importance",
            "Enable/disable documents for AI reference",
            "Link documents to specific activity types",
            "Full document lifecycle management"
          ]}
        />
      </div>
    </AdminLayout>
  );
}