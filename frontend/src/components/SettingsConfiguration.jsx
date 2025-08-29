import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '../context/NavigationContext';
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  Settings,
  Shield,
  Users,
  DollarSign,
  GraduationCap,
  Check,
  X,
  AlertTriangle,
  Info,
  Save,
  RotateCcw,
  Crown,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const SettingsConfiguration = () => {
  const { 
    apps, 
    featureConfig, 
    updateFeatureConfig, 
    featureDependencies,
    roleFeatures 
  } = useNavigation();
  const { isAdministrator, currentRole } = useRoleBasedAccess();
  const [expandedApps, setExpandedApps] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDependencyWarning, setShowDependencyWarning] = useState(null);

  // Only administrators can access settings
  if (!isAdministrator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-indigo-950">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <Shield className="h-5 w-5 mr-2" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Only administrators can access system settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get role configuration matrix
  const roleConfigMatrix = useMemo(() => {
    const roles = ['admin', 'manager', 'teacher', 'account_officer'];
    const matrix = {};

    Object.values(apps).forEach(app => {
      if (app.id === 'settings') return; // Skip settings app

      matrix[app.id] = {
        app: app,
        features: app.features.map(feature => {
          const roleAccess = {};
          roles.forEach(role => {
            roleAccess[role] = roleFeatures[role]?.[app.id]?.includes(feature) || false;
          });

          return {
            id: feature,
            name: formatFeatureName(feature),
            description: getFeatureDescription(feature),
            roleAccess,
            dependencies: featureDependencies[feature] || [],
            isEnabled: featureConfig[app.id]?.[feature] !== false
          };
        })
      };
    });

    return matrix;
  }, [apps, roleFeatures, featureDependencies, featureConfig]);

  const formatFeatureName = (feature) => {
    return feature.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getFeatureDescription = (feature) => {
    const descriptions = {
      view_expenses: 'View and browse expense records',
      add_expense: 'Create new expense entries',
      edit_expense: 'Modify existing expense records',
      delete_expense: 'Remove expense entries permanently',
      export_data: 'Export data to external formats',
      import_data: 'Import data from external sources',
      analytics: 'Access analytical reports and insights',
      categories: 'Manage expense categories',
      view_exams: 'View examination records',
      create_exam: 'Create new examinations',
      grade_exam: 'Grade and evaluate exams',
      view_results: 'View examination results',
      generate_reports: 'Generate academic reports',
      student_management: 'Manage student information',
      user_management: 'Manage system users',
      role_configuration: 'Configure user roles',
      feature_toggles: 'Control feature availability',
      system_configuration: 'System-wide settings',
      backup_restore: 'Backup and restore data'
    };
    return descriptions[feature] || 'Feature configuration option';
  };

  const handleFeatureToggle = (appId, feature, enabled) => {
    // Check if disabling this feature would affect dependencies
    if (!enabled) {
      const dependentFeatures = Object.keys(featureDependencies).filter(depFeature =>
        featureDependencies[depFeature].includes(feature)
      );

      if (dependentFeatures.length > 0) {
        setShowDependencyWarning({
          feature,
          dependentFeatures,
          appId,
          action: () => {
            updateFeatureConfig(appId, feature, enabled);
            setHasUnsavedChanges(true);
            setShowDependencyWarning(null);
          }
        });
        return;
      }
    }

    updateFeatureConfig(appId, feature, enabled);
    setHasUnsavedChanges(true);
  };

  const toggleAppExpansion = (appId) => {
    setExpandedApps(prev => ({
      ...prev,
      [appId]: !prev[appId]
    }));
  };

  const resetToDefaults = () => {
    Object.keys(roleConfigMatrix).forEach(appId => {
      roleConfigMatrix[appId].features.forEach(feature => {
        updateFeatureConfig(appId, feature.id, true);
      });
    });
    setHasUnsavedChanges(false);
  };

  const getAppIcon = (appId) => {
    const icons = {
      expenses: DollarSign,
      exams: GraduationCap,
      settings: Settings
    };
    return icons[appId] || Settings;
  };

  const getRoleIcon = (role) => {
    const icons = {
      admin: Crown,
      manager: Users,
      teacher: GraduationCap,
      account_officer: DollarSign
    };
    return icons[role] || Users;
  };

  const getRoleBadgeVariant = (role) => {
    const variants = {
      admin: 'default',
      manager: 'secondary',
      teacher: 'outline',
      account_officer: 'outline'
    };
    return variants[role] || 'outline';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">
                System Settings
              </h1>
              <p className="text-muted-foreground mt-2">
                Configure feature availability and role-based access control
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={resetToDefaults}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button disabled={!hasUnsavedChanges}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="features" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="features">Feature Matrix</TabsTrigger>
            <TabsTrigger value="roles">Role Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-6">
            {/* Feature Configuration Matrix */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {Object.entries(roleConfigMatrix).map(([appId, appData]) => {
                const AppIcon = getAppIcon(appId);
                const isExpanded = expandedApps[appId];

                return (
                  <Card key={appId} className="overflow-hidden">
                    <CardHeader 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleAppExpansion(appId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-blue-500/10">
                            <AppIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <CardTitle className="flex items-center">
                              {appData.app.name}
                              <Badge variant="outline" className="ml-2">
                                {appData.features.length} features
                              </Badge>
                            </CardTitle>
                            <CardDescription>{appData.app.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isExpanded ? 
                            <ChevronUp className="h-5 w-5 text-muted-foreground" /> : 
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          }
                        </div>
                      </div>
                    </CardHeader>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CardContent className="pt-0">
                            <div className="space-y-4">
                              {/* Role Header */}
                              <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-muted-foreground border-b pb-2">
                                <div className="col-span-5">Feature</div>
                                <div className="col-span-2 text-center">Admin</div>
                                <div className="col-span-2 text-center">Manager</div>
                                <div className="col-span-2 text-center">Teacher</div>
                                <div className="col-span-1 text-center">Account Officer</div>
                              </div>

                              {/* Features */}
                              {appData.features.map((feature) => (
                                <div key={feature.id} className="grid grid-cols-12 gap-4 items-center py-2">
                                  <div className="col-span-5">
                                    <div>
                                      <div className="font-medium text-sm">{feature.name}</div>
                                      <div className="text-xs text-muted-foreground">{feature.description}</div>
                                      {feature.dependencies.length > 0 && (
                                        <div className="flex items-center mt-1">
                                          <AlertTriangle className="h-3 w-3 text-amber-500 mr-1" />
                                          <span className="text-xs text-amber-600 dark:text-amber-400">
                                            Requires: {feature.dependencies.map(formatFeatureName).join(', ')}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Role Access Indicators */}
                                  {['admin', 'manager', 'teacher', 'account_officer'].map((role, index) => (
                                    <div key={role} className={`${index === 3 ? 'col-span-1' : 'col-span-2'} flex justify-center`}>
                                      {feature.roleAccess[role] ? (
                                        <div className="flex items-center space-x-2">
                                          <Check className="h-4 w-4 text-green-600" />
                                          {role === 'admin' && (
                                            <Switch
                                              checked={feature.isEnabled}
                                              onCheckedChange={(checked) => 
                                                handleFeatureToggle(appId, feature.id, checked)
                                              }
                                              size="sm"
                                            />
                                          )}
                                        </div>
                                      ) : (
                                        <X className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                );
              })}
            </motion.div>
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            {/* Role Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {['admin', 'manager', 'teacher', 'account_officer'].map((role) => {
                const RoleIcon = getRoleIcon(role);
                const badgeVariant = getRoleBadgeVariant(role);
                
                return (
                  <Card key={role} className="relative overflow-hidden">
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <RoleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <Badge variant={badgeVariant}>
                          {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(roleFeatures[role] || {}).map(([appId, features]) => {
                          if (features.length === 0) return null;
                          
                          const AppIcon = getAppIcon(appId);
                          
                          return (
                            <div key={appId} className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <AppIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium capitalize">{appId}</span>
                              </div>
                              <div className="space-y-1 ml-6">
                                {features.map(feature => (
                                  <div key={feature} className="text-xs text-muted-foreground">
                                    • {formatFeatureName(feature)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Dependency Warning Dialog */}
        <AnimatePresence>
          {showDependencyWarning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setShowDependencyWarning(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-background p-6 rounded-lg shadow-lg max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Dependency Warning</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>
                      Disabling "{formatFeatureName(showDependencyWarning.feature)}" will also disable:
                    </p>
                    <ul className="list-disc list-inside text-sm">
                      {showDependencyWarning.dependentFeatures.map(feature => (
                        <li key={feature}>{formatFeatureName(feature)}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={() => setShowDependencyWarning(null)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={showDependencyWarning.action}>
                    Continue
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unsaved Changes Indicator */}
        <AnimatePresence>
          {hasUnsavedChanges && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-4 right-4"
            >
              <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You have unsaved changes. Click "Save Changes" to apply them.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SettingsConfiguration;