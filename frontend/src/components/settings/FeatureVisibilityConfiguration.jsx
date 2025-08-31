import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../../context/SupabaseAuthContext';
import { useFeatureVisibility } from '../../hooks/useFeatureVisibility';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';
import { 
  Settings, 
  Eye,
  EyeOff,
  Users, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  Info,
  Home,
  ChevronRight,
  Zap,
  Sparkles,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import './feature-visibility.css';

/**
 * FeatureVisibilityConfiguration Component
 * 
 * Story 1.3: Feature Visibility Configuration
 * - Administrator can configure which features are visible per role
 * - Interface shows feature dependency matrix (ExpenseViewer ↔ Analytics dependency)
 * - Real-time preview shows how changes affect each role's interface
 * - Bulk operations for enabling/disabling feature categories
 * - Validation prevents breaking core functionality
 * - Changes apply immediately with user notification
 */
const FeatureVisibilityConfiguration = () => {
  const { isAdmin, user } = useAuth();
  const {
    loading,
    error,
    featureCategories,
    roles,
    roleFeatureMatrix,
    updateRoleFeatures,
    bulkUpdateFeatures,
    validateFeatureChange,
    previewRoleInterface,
    calculateBulkOperationImpact,
    getFeatureDependencies
  } = useFeatureVisibility();

  // Local state
  const [selectedPreviewRole, setSelectedPreviewRole] = useState('2'); // Account Officer
  const [confirmationDialog, setConfirmationDialog] = useState(null);
  const [bulkSelection, setBulkSelection] = useState({
    roleIds: [],
    categoryId: '',
    action: 'enable'
  });
  const [showBulkImpact, setShowBulkImpact] = useState(false);
  const [bulkImpact, setBulkImpact] = useState(null);
  const [updatingFeatures, setUpdatingFeatures] = useState(new Set());
  const [recentlyChanged, setRecentlyChanged] = useState(new Set());
  const [highlightedFeatures, setHighlightedFeatures] = useState(new Set());
  const animationRef = useRef(new Map());

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  // Handle feature toggle
  const handleFeatureToggle = useCallback(async (roleId, featureId, enabled) => {
    try {
      const toggleKey = `${roleId}-${featureId}`;
      setUpdatingFeatures(prev => new Set([...prev, toggleKey]));
      
      // Add visual feedback with animation
      setHighlightedFeatures(prev => new Set([...prev, toggleKey]));
      
      // Validate the change
      const validation = validateFeatureChange(roleId, featureId, enabled);
      
      if (!validation.isValid) {
        toast.error(validation.errors[0]);
        // Add error animation
        const element = document.querySelector(`[data-testid="role-feature-toggle-${roleId}-${featureId}"]`);
        if (element) {
          element.classList.add('animate-shake');
          setTimeout(() => element.classList.remove('animate-shake'), 500);
        }
        return;
      }

      // Show confirmation dialog if required
      if (validation.requiresConfirmation) {
        setConfirmationDialog({
          roleId,
          featureId,
          enabled,
          warnings: validation.warnings,
          onConfirm: () => performFeatureUpdate(roleId, featureId, enabled),
          onCancel: () => setConfirmationDialog(null)
        });
        return;
      }

      // Apply change immediately with success animation
      await performFeatureUpdate(roleId, featureId, enabled);
      
      // Track recently changed for visual feedback
      setRecentlyChanged(prev => new Set([...prev, toggleKey]));
      setTimeout(() => {
        setRecentlyChanged(prev => {
          const updated = new Set(prev);
          updated.delete(toggleKey);
          return updated;
        });
      }, 2000);
      
    } catch (error) {
      toast.error(`Failed to update feature: ${error.message}`);
    } finally {
      setTimeout(() => {
        setUpdatingFeatures(prev => {
          const updated = new Set(prev);
          updated.delete(`${roleId}-${featureId}`);
          return updated;
        });
        setHighlightedFeatures(prev => {
          const updated = new Set(prev);
          updated.delete(`${roleId}-${featureId}`);
          return updated;
        });
      }, 300);
    }
  }, [validateFeatureChange]);

  const performFeatureUpdate = useCallback(async (roleId, featureId, enabled) => {
    await updateRoleFeatures(roleId, featureId, enabled);
    setConfirmationDialog(null);
  }, [updateRoleFeatures]);

  // Handle bulk operation
  const handleBulkOperation = useCallback(async () => {
    try {
      if (bulkSelection.roleIds.length === 0 || !bulkSelection.categoryId) {
        toast.error('Please select roles and a category');
        return;
      }

      // Calculate impact first
      const impact = await calculateBulkOperationImpact(bulkSelection);
      setBulkImpact(impact);
      setShowBulkImpact(true);
      
    } catch (error) {
      toast.error(`Failed to calculate impact: ${error.message}`);
    }
  }, [bulkSelection, calculateBulkOperationImpact]);

  const confirmBulkOperation = useCallback(async () => {
    try {
      await bulkUpdateFeatures(bulkSelection);
      setShowBulkImpact(false);
      setBulkSelection({ roleIds: [], categoryId: '', action: 'enable' });
    } catch (error) {
      toast.error(`Bulk operation failed: ${error.message}`);
    }
  }, [bulkSelection, bulkUpdateFeatures]);

  // Memoized preview data
  const previewData = useMemo(() => {
    if (!selectedPreviewRole) return null;
    return previewRoleInterface(selectedPreviewRole);
  }, [selectedPreviewRole, previewRoleInterface, roleFeatureMatrix]);

  // Get feature dependencies for display
  const featureDependencies = useMemo(() => getFeatureDependencies(), [getFeatureDependencies]);

  if (loading) {
    return (
      <div data-testid="loading-spinner" className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-indigo-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span className="text-lg">Loading feature configuration...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="feature-visibility-config" className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-indigo-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb Navigation */}
        <div data-testid="settings-breadcrumb" className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <Home className="h-4 w-4" />
          <span>Settings</span>
          <ChevronRight className="h-4 w-4" />
          <span>Feature Visibility</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500 text-white rounded-xl">
              <Eye className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Feature Visibility Configuration</h1>
              <p className="text-muted-foreground mt-1">
                Configure which features are visible to different user roles
              </p>
            </div>
          </div>
        </div>

        {/* User Notification Banner */}
        <Alert data-testid="user-notification-banner" className="mb-6 border-blue-200 bg-blue-50/50 animate-in slide-in-from-top duration-500">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Changes apply immediately and will affect users currently logged in. 
              Users will see the updated interface after their next page refresh.
            </div>
          </AlertDescription>
        </Alert>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
          
          {/* Left Column - Feature Configuration */}
          <div className="xl:col-span-3 min-w-0">
            <Tabs defaultValue="matrix" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="matrix">Role Matrix</TabsTrigger>
                <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
              </TabsList>

              {/* Role-Feature Matrix Tab */}
              <TabsContent value="matrix" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Role-Feature Matrix
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div data-testid="role-feature-matrix" className="overflow-x-auto">
                      <div className="min-w-full">
                        {/* Feature Categories */}
                        <div data-testid="feature-categories">
                          {featureCategories.map(category => (
                            <div key={category.id} className="mb-8">
                              <div className="flex items-center gap-3 mb-4">
                                <Badge variant="outline" className="text-sm font-medium">
                                  {category.name}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {category.description}
                                </span>
                              </div>
                              
                              {/* Features Table */}
                              <div className="bg-white dark:bg-slate-800 rounded-lg border">
                                <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-t-lg font-medium text-sm">
                                  <div className="col-span-4">Feature</div>
                                  {roles.map(role => (
                                    <div key={role.id} className="col-span-2 text-center">
                                      {role.name}
                                    </div>
                                  ))}
                                </div>
                                
                                {category.features.map(feature => {
                                  const featureHasDependencies = feature.dependencies && feature.dependencies.length > 0;
                                  const featureHasDependents = feature.dependents && feature.dependents.length > 0;
                                  
                                  return (
                                    <div 
                                      key={feature.id} 
                                      className={`grid grid-cols-12 gap-4 p-4 border-t transition-all duration-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 ${
                                        featureHasDependencies ? 'border-l-4 border-l-orange-200' : ''
                                      } ${
                                        featureHasDependents ? 'border-r-4 border-r-blue-200' : ''
                                      }`}
                                      onMouseEnter={() => {
                                        // Highlight dependent features
                                        if (feature.dependents) {
                                          const dependentElements = feature.dependents.map(depId => 
                                            document.querySelector(`[data-feature-id="${depId}"]`)
                                          ).filter(Boolean);
                                          dependentElements.forEach(el => el.classList.add('dependency-highlight'));
                                        }
                                      }}
                                      onMouseLeave={() => {
                                        // Remove highlight
                                        document.querySelectorAll('.dependency-highlight').forEach(el => 
                                          el.classList.remove('dependency-highlight')
                                        );
                                      }}
                                      data-feature-id={feature.id}
                                    >
                                      <div className="col-span-4">
                                        <div className="flex items-center gap-3">
                                          {featureHasDependencies && (
                                            <div className="w-2 h-2 bg-orange-400 rounded-full" title="Has dependencies" />
                                          )}
                                          {featureHasDependents && (
                                            <div className="w-2 h-2 bg-blue-400 rounded-full" title="Required by other features" />
                                          )}
                                          <div className="flex-1">
                                            <div className="font-medium flex items-center gap-2">
                                              {feature.name}
                                              {feature.isCore && <Zap className="h-3 w-3 text-yellow-500" title="Core Feature" />}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                              {feature.description}
                                            </div>
                                            <div className="flex gap-1 mt-1">
                                              {feature.isCore && (
                                                <Badge variant="secondary" className="text-xs">
                                                  <Zap className="h-3 w-3 mr-1" />
                                                  Core Feature
                                                </Badge>
                                              )}
                                              {feature.adminOnly && (
                                                <Badge variant="outline" className="text-xs">
                                                  <Shield className="h-3 w-3 mr-1" />
                                                  Admin Only
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {roles.map(role => {
                                        const toggleKey = `${role.id}-${feature.id}`;
                                        const isUpdating = updatingFeatures.has(toggleKey);
                                        const isHighlighted = highlightedFeatures.has(toggleKey);
                                        const isRecentlyChanged = recentlyChanged.has(toggleKey);
                                        const isChecked = roleFeatureMatrix[role.id]?.includes(feature.id) || false;
                                        
                                        return (
                                          <div 
                                            key={toggleKey} 
                                            className={`col-span-2 flex items-center justify-center transition-all duration-300 ${
                                              isHighlighted ? 'scale-110 bg-blue-100 dark:bg-blue-900/30 rounded-lg' : ''
                                            } ${
                                              isRecentlyChanged ? 'animate-pulse' : ''
                                            }`}
                                          >
                                            <div className="relative flex items-center">
                                              <Checkbox
                                                data-testid={`role-feature-toggle-${role.id}-${feature.id}`}
                                                checked={isChecked}
                                                onCheckedChange={(checked) => 
                                                  handleFeatureToggle(role.id, feature.id, checked)
                                                }
                                                disabled={isUpdating}
                                                className={`transition-all duration-200 ${
                                                  isRecentlyChanged ? 'shadow-md shadow-green-200' : ''
                                                }`}
                                                aria-label={`Toggle ${feature.name} for ${role.name}`}
                                              />
                                              {isUpdating && (
                                                <Loader2 
                                                  data-testid="update-loading-indicator" 
                                                  className="h-4 w-4 animate-spin ml-2 text-blue-500" 
                                                />
                                              )}
                                              {isRecentlyChanged && (
                                                <Sparkles 
                                                  className="h-3 w-3 absolute -top-1 -right-1 text-green-500 animate-bounce" 
                                                />
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Feature Dependencies Tab */}
              <TabsContent value="dependencies" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Feature Dependency Matrix
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div data-testid="feature-dependency-matrix" className="space-y-6">
                      {Object.entries(featureDependencies).map(([featureId, feature]) => (
                        <div 
                          key={featureId}
                          data-testid={`feature-${featureId}`}
                          className="feature-item p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          data-feature-id={featureId}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{feature.name}</h4>
                              <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </div>
                            <Badge variant="outline">{feature.categoryName}</Badge>
                          </div>
                          
                          {/* Dependencies */}
                          {feature.dependencies && feature.dependencies.length > 0 && (
                            <div className="mb-3">
                              <Label className="text-sm font-medium">Depends on:</Label>
                              <div className="flex items-center gap-2 mt-1">
                                {feature.dependencies.map(depId => (
                                  <div key={depId} className="flex items-center gap-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {featureDependencies[depId]?.name || depId}
                                    </Badge>
                                    <ArrowRight 
                                      data-testid={`dependency-arrow-${depId}-${featureId}`}
                                      className="h-3 w-3 text-muted-foreground dependency-arrow"
                                    />
                                  </div>
                                ))}
                                <Badge variant="outline" className="text-xs">
                                  {feature.name}
                                </Badge>
                              </div>
                            </div>
                          )}
                          
                          {/* Dependents */}
                          {feature.dependents && feature.dependents.length > 0 && (
                            <div>
                              <Label className="text-sm font-medium">Required by:</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {feature.name}
                                </Badge>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                {feature.dependents.map(depId => (
                                  <Badge key={depId} variant="secondary" className="text-xs">
                                    {featureDependencies[depId]?.name || depId}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Dependency indicators for Analytics ↔ Expenses */}
                          {featureId === 'analytics' && (
                            <div data-testid="dependency-analytics-expenses" className="mt-2">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span aria-label="Analytics depends on Expenses">
                                  Analytics Dashboard requires Expense Manager to function properly
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Bulk Operations Tab */}
              <TabsContent value="bulk" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Bulk Operations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div data-testid="bulk-operations-panel" className="space-y-6">
                      
                      {/* Role Selection */}
                      <div>
                        <Label className="text-sm font-medium mb-3 block">Select Roles</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {roles.map(role => (
                            <div key={role.id} className="flex items-center space-x-2">
                              <Checkbox
                                data-testid={`bulk-role-checkbox-${role.id}`}
                                id={`bulk-role-${role.id}`}
                                checked={bulkSelection.roleIds.includes(role.id)}
                                onCheckedChange={(checked) => {
                                  setBulkSelection(prev => ({
                                    ...prev,
                                    roleIds: checked 
                                      ? [...prev.roleIds, role.id]
                                      : prev.roleIds.filter(id => id !== role.id)
                                  }));
                                }}
                              />
                              <Label htmlFor={`bulk-role-${role.id}`} className="text-sm">
                                {role.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Category Selection */}
                      <div>
                        <Label className="text-sm font-medium mb-3 block">Feature Category</Label>
                        <Select
                          data-testid="bulk-category-selector"
                          value={bulkSelection.categoryId}
                          onValueChange={(value) => 
                            setBulkSelection(prev => ({ ...prev, categoryId: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a feature category" />
                          </SelectTrigger>
                          <SelectContent>
                            {featureCategories.map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name} ({category.features.length} features)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Action Selection */}
                      <div>
                        <Label className="text-sm font-medium mb-3 block">Action</Label>
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={bulkSelection.action === 'enable'}
                              onCheckedChange={(checked) => 
                                checked && setBulkSelection(prev => ({ ...prev, action: 'enable' }))
                              }
                            />
                            <Label className="text-sm">Bulk Enable</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={bulkSelection.action === 'disable'}
                              onCheckedChange={(checked) => 
                                checked && setBulkSelection(prev => ({ ...prev, action: 'disable' }))
                              }
                            />
                            <Label className="text-sm">Bulk Disable</Label>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button 
                          onClick={handleBulkOperation}
                          disabled={bulkSelection.roleIds.length === 0 || !bulkSelection.categoryId}
                        >
                          {bulkSelection.action === 'enable' ? 'Bulk Enable' : 'Bulk Disable'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Real-time Preview */}
          <div className="xl:col-span-1 min-w-0">
            <Card data-testid="role-preview-panel" className="sticky top-8 preview-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="h-5 w-5" />
                  Interface Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Role Selector */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Preview Role</Label>
                  <Select
                    data-testid="preview-role-selector"
                    value={selectedPreviewRole}
                    onValueChange={setSelectedPreviewRole}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {previewData && (
                  <>
                    {/* Feature Count */}
                    <div data-testid="feature-count" className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <span className="text-sm font-medium">Available Features</span>
                      <Badge variant="outline">{previewData.featureCount}</Badge>
                    </div>

                    {/* Accessibility Summary */}
                    <div data-testid="accessibility-summary" className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <span className="text-sm font-medium">Access Level</span>
                      <Badge 
                        variant={previewData.accessibilityLevel === 'full' ? 'default' : 'secondary'}
                      >
                        {previewData.accessibilityLevel}
                      </Badge>
                    </div>

                    {/* Available Features */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Available Features</Label>
                      <div className="space-y-2">
                        {previewData.navigationStructure.coreApps.map(app => (
                          <div key={app.id} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {app.name}
                          </div>
                        ))}
                        {previewData.navigationStructure.dashboardComponents.map(component => (
                          <div key={component.id} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                            {component.name}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Warnings */}
                    {previewData.warnings.length > 0 && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {previewData.warnings[0]}
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <Dialog 
          open={!!confirmationDialog} 
          onOpenChange={() => setConfirmationDialog(null)}
        >
          <DialogContent data-testid="confirmation-dialog">
            <DialogHeader>
              <DialogTitle>Confirm Feature Change</DialogTitle>
              <DialogDescription>
                This change may affect user experience. Please review the warnings below.
              </DialogDescription>
            </DialogHeader>
            
            {confirmationDialog?.warnings.map((warning, index) => (
              <Alert key={index} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{warning}</AlertDescription>
              </Alert>
            ))}
            
            <DialogFooter>
              <Button
                variant="outline" 
                onClick={confirmationDialog?.onCancel}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={confirmationDialog?.onConfirm}
              >
                Confirm Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Impact Dialog */}
        <Dialog open={showBulkImpact} onOpenChange={setShowBulkImpact}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Operation Impact</DialogTitle>
              <DialogDescription>
                Review the impact of this bulk operation before proceeding.
              </DialogDescription>
            </DialogHeader>
            
            {bulkImpact && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                    <div className="text-2xl font-bold">{bulkImpact.affectedUsers}</div>
                    <div className="text-sm text-muted-foreground">Users Affected</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                    <div className="text-2xl font-bold">{bulkImpact.featuresChanged}</div>
                    <div className="text-sm text-muted-foreground">Features Changed</div>
                  </div>
                </div>
                
                {bulkImpact.warnings.map((warning, index) => (
                  <Alert key={index}>
                    <Info className="h-4 w-4" />
                    <AlertDescription>{warning}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkImpact(false)}>
                Cancel
              </Button>
              <Button onClick={confirmBulkOperation}>
                Proceed with Bulk Operation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FeatureVisibilityConfiguration;