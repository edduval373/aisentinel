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
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading context documents...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Context Management" subtitle="Upload and manage company documents that AI can reference during conversations">
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">All Documents</h2>
          <Button onClick={() => setShowUploadDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>

        <div className="w-full">
          <div className="flex space-x-4 mb-6">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              Documents
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">
              Activity Links
            </button>
          </div>

          <div className="space-y-4">
            {documents?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileText className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Yet</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Upload your first company document to get started with context-aware AI responses
                  </p>
                  <Button onClick={() => setShowUploadDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {documents?.map((document) => (
                  <Card key={document.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <CardTitle className="text-lg">{document.name}</CardTitle>
                            <p className="text-sm text-gray-600">{document.fileName}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getCategoryColor(document.category)}>
                            {document.category}
                          </Badge>
                          <Badge variant="outline">Priority {document.priority}</Badge>
                          <div className="flex items-center space-x-1">
                            {document.isEnabled ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-sm text-gray-600">
                              {document.isEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {document.description && (
                          <p className="text-gray-700">{document.description}</p>
                        )}
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Size: {formatFileSize(document.fileSize)}</span>
                          <span>Created: {new Date(document.createdAt!).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={document.isEnabled}
                            onCheckedChange={() => handleToggleEnabled(document)}
                          />
                          <span className="text-sm">Enable for AI reference</span>
                          <div className="flex-1"></div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDocument(document);
                              setShowLinkDialog(true);
                            }}
                          >
                            <Link className="w-4 h-4 mr-1" />
                            Link to Activity
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDocument(document.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
      </div>
    </AdminLayout>
  );
}