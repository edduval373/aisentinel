import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Tag, Calendar, User, GitBranch, Star, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";

interface VersionRelease {
  id: number;
  majorVersion: number;
  minorVersion: number;
  patchVersion: number;
  title: string;
  description: string;
  isStable: boolean;
  isCurrentVersion: boolean;
  releaseDate: string;
  developerId: string;
  releaseNotes: string;
}

interface VersionFeature {
  id: number;
  versionId: number;
  title: string;
  description: string;
  category: string;
  importance: string;
}

export default function VersionManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [newVersion, setNewVersion] = useState({
    majorVersion: 1,
    minorVersion: 0,
    patchVersion: 0,
    title: '',
    description: '',
    isStable: false,
    releaseNotes: ''
  });
  const [newFeature, setNewFeature] = useState({
    title: '',
    description: '',
    category: 'enhancement',
    importance: 'medium'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch version releases
  const { data: releases = [], isLoading: isLoadingReleases } = useQuery({
    queryKey: ['/api/version/releases'],
    queryFn: async () => {
      const response = await fetch('/api/version/releases', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch releases');
      return response.json();
    }
  });

  // Fetch version features for selected version
  const { data: features = [] } = useQuery({
    queryKey: ['/api/version', selectedVersionId, 'features'],
    queryFn: async () => {
      const response = await fetch(`/api/version/${selectedVersionId}/features`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch features');
      return response.json();
    },
    enabled: !!selectedVersionId
  });

  // Create version release mutation
  const createReleaseMutation = useMutation({
    mutationFn: async (releaseData: any) => {
      const response = await fetch('/api/version/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(releaseData)
      });
      if (!response.ok) throw new Error('Failed to create release');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/version/releases'] });
      setIsCreateDialogOpen(false);
      setNewVersion({
        majorVersion: 1,
        minorVersion: 0,
        patchVersion: 0,
        title: '',
        description: '',
        isStable: false,
        releaseNotes: ''
      });
      toast({ title: "Version created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create version", variant: "destructive" });
    }
  });

  // Create feature mutation
  const createFeatureMutation = useMutation({
    mutationFn: async (featureData: any) => {
      const response = await fetch('/api/version/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...featureData, versionId: selectedVersionId })
      });
      if (!response.ok) throw new Error('Failed to create feature');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/version', selectedVersionId, 'features'] });
      setIsFeatureDialogOpen(false);
      setNewFeature({
        title: '',
        description: '',
        category: 'enhancement',
        importance: 'medium'
      });
      toast({ title: "Feature added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add feature", variant: "destructive" });
    }
  });

  const formatVersion = (release: VersionRelease) => 
    `${release.majorVersion}.${release.minorVersion}.${release.patchVersion}`;

  const getCategoryColor = (category: string) => {
    const colors = {
      'enhancement': 'bg-blue-100 text-blue-800',
      'bugfix': 'bg-red-100 text-red-800',
      'security': 'bg-orange-100 text-orange-800',
      'integration': 'bg-green-100 text-green-800',
      'ai': 'bg-purple-100 text-purple-800',
      'ui': 'bg-pink-100 text-pink-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getImportanceIcon = (importance: string) => {
    if (importance === 'high') return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (importance === 'medium') return <CheckCircle className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  return (
    <AdminLayout title="Version Management" subtitle="Manage application versions, releases, and features">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Version Management</h1>
            <p className="text-gray-600">Track and manage application versions and features</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Version
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Version</DialogTitle>
                <DialogDescription>
                  Add a new version release to track features and changes
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="major">Major</Label>
                    <Input
                      id="major"
                      type="number"
                      value={newVersion.majorVersion}
                      onChange={(e) => setNewVersion({...newVersion, majorVersion: parseInt(e.target.value)})}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="minor">Minor</Label>
                    <Input
                      id="minor"
                      type="number"
                      value={newVersion.minorVersion}
                      onChange={(e) => setNewVersion({...newVersion, minorVersion: parseInt(e.target.value)})}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="patch">Patch</Label>
                    <Input
                      id="patch"
                      type="number"
                      value={newVersion.patchVersion}
                      onChange={(e) => setNewVersion({...newVersion, patchVersion: parseInt(e.target.value)})}
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newVersion.title}
                    onChange={(e) => setNewVersion({...newVersion, title: e.target.value})}
                    placeholder="Version title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newVersion.description}
                    onChange={(e) => setNewVersion({...newVersion, description: e.target.value})}
                    placeholder="Version description"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="stable"
                    checked={newVersion.isStable}
                    onCheckedChange={(checked) => setNewVersion({...newVersion, isStable: checked})}
                  />
                  <Label htmlFor="stable">Mark as stable release</Label>
                </div>
                <div>
                  <Label htmlFor="notes">Release Notes</Label>
                  <Textarea
                    id="notes"
                    value={newVersion.releaseNotes}
                    onChange={(e) => setNewVersion({...newVersion, releaseNotes: e.target.value})}
                    placeholder="Detailed release notes"
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createReleaseMutation.mutate(newVersion)}
                  disabled={createReleaseMutation.isPending}
                >
                  {createReleaseMutation.isPending ? 'Creating...' : 'Create Version'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Version Releases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoadingReleases ? (
            <div className="col-span-2 text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading versions...</p>
            </div>
          ) : releases.length === 0 ? (
            <div className="col-span-2 text-center py-8">
              <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No versions found. Create your first version to get started.</p>
            </div>
          ) : (
            releases.map((release: VersionRelease) => (
              <Card 
                key={release.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedVersionId === release.id ? 'ring-2 ring-blue-500' : ''
                } ${release.isCurrentVersion ? 'border-green-500' : ''}`}
                onClick={() => setSelectedVersionId(release.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <GitBranch className="w-5 h-5" />
                        Version {formatVersion(release)}
                        {release.isCurrentVersion && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <Star className="w-3 h-3 mr-1" />
                            Current
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{release.title}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      {release.isStable && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Stable
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{release.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(release.releaseDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {release.developerId}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Features Section */}
        {selectedVersionId && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Version Features</CardTitle>
                  <CardDescription>
                    Features and changes for version {formatVersion(releases.find((r: VersionRelease) => r.id === selectedVersionId) || {} as VersionRelease)}
                  </CardDescription>
                </div>
                <Dialog open={isFeatureDialogOpen} onOpenChange={setIsFeatureDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Feature
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Feature</DialogTitle>
                      <DialogDescription>
                        Add a new feature or change to this version
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="feature-title">Title</Label>
                        <Input
                          id="feature-title"
                          value={newFeature.title}
                          onChange={(e) => setNewFeature({...newFeature, title: e.target.value})}
                          placeholder="Feature title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="feature-description">Description</Label>
                        <Textarea
                          id="feature-description"
                          value={newFeature.description}
                          onChange={(e) => setNewFeature({...newFeature, description: e.target.value})}
                          placeholder="Feature description"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select 
                          value={newFeature.category} 
                          onValueChange={(value) => setNewFeature({...newFeature, category: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enhancement">Enhancement</SelectItem>
                            <SelectItem value="bugfix">Bug Fix</SelectItem>
                            <SelectItem value="security">Security</SelectItem>
                            <SelectItem value="integration">Integration</SelectItem>
                            <SelectItem value="ai">AI</SelectItem>
                            <SelectItem value="ui">UI/UX</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="importance">Importance</Label>
                        <Select 
                          value={newFeature.importance} 
                          onValueChange={(value) => setNewFeature({...newFeature, importance: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select importance" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => createFeatureMutation.mutate(newFeature)}
                        disabled={createFeatureMutation.isPending}
                      >
                        {createFeatureMutation.isPending ? 'Adding...' : 'Add Feature'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {features.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No features added yet. Click "Add Feature" to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {features.map((feature: VersionFeature) => (
                    <div 
                      key={feature.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      {getImportanceIcon(feature.importance)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{feature.title}</h4>
                          <Badge className={getCategoryColor(feature.category)}>
                            {feature.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}