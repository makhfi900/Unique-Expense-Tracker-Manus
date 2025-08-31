import { useState, useEffect, useCallback, useMemo } from 'react';
import { FeatureVisibilityAPI } from '../services/settingsApi';
import { useAuth } from '../context/SupabaseAuthContext';
import { toast } from 'sonner';

/**
 * Custom hook for feature visibility management
 * 
 * Story 1.3: Feature Visibility Configuration
 * Provides comprehensive feature visibility control with dependency management
 */
export const useFeatureVisibility = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featureCategories, setFeatureCategories] = useState([]);
  const [roles, setRoles] = useState([]);
  const [roleFeatureMatrix, setRoleFeatureMatrix] = useState({});
  const [pendingChanges, setPendingChanges] = useState({});
  const [updateQueue, setUpdateQueue] = useState([]);
  const [subscribers, setSubscribers] = useState({});

  // Feature categories configuration with dependencies
  const defaultFeatureCategories = [
    {
      id: 'core-apps',
      name: 'Core Applications',
      description: 'Main application modules',
      features: [
        { 
          id: 'expenses', 
          name: 'Expense Manager', 
          description: 'Expense tracking and management',
          dependencies: [],
          dependents: ['analytics', 'charts'],
          isCore: true
        },
        { 
          id: 'settings', 
          name: 'Settings', 
          description: 'System configuration and user management',
          dependencies: [],
          dependents: [],
          isCore: true
        }
      ]
    },
    {
      id: 'dashboard-components',
      name: 'Dashboard Components', 
      description: 'Analytics and reporting features',
      features: [
        { 
          id: 'analytics', 
          name: 'Analytics Dashboard', 
          description: 'Expense analytics and insights',
          dependencies: ['expenses'],
          dependents: []
        },
        { 
          id: 'charts', 
          name: 'Charts & Graphs', 
          description: 'Visual data representation',
          dependencies: ['expenses'],
          dependents: []
        }
      ]
    },
    {
      id: 'user-interface',
      name: 'User Interface',
      description: 'UI components and navigation features',
      features: [
        {
          id: 'navigation',
          name: 'Navigation Menu',
          description: 'Main navigation and menu system',
          dependencies: [],
          dependents: [],
          isCore: true
        },
        {
          id: 'themes',
          name: 'Theme System',
          description: 'Dark/light theme switching',
          dependencies: [],
          dependents: []
        },
        {
          id: 'notifications',
          name: 'Notifications',
          description: 'Toast notifications and alerts',
          dependencies: [],
          dependents: []
        }
      ]
    },
    {
      id: 'administrative',
      name: 'Administrative',
      description: 'Admin-only features and system management',
      features: [
        {
          id: 'user_management',
          name: 'User Management',
          description: 'Manage users and role assignments',
          dependencies: ['settings'],
          dependents: [],
          adminOnly: true
        },
        {
          id: 'system_config',
          name: 'System Configuration',
          description: 'Advanced system settings',
          dependencies: ['settings'],
          dependents: [],
          adminOnly: true
        },
        {
          id: 'audit_logs',
          name: 'Audit Logs',
          description: 'System activity and security logs',
          dependencies: ['settings'],
          dependents: [],
          adminOnly: true
        }
      ]
    }
  ];

  // Initialize feature categories and roles
  const initializeData = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load feature categories (keep default configuration)
      setFeatureCategories(defaultFeatureCategories);

      // Load feature visibility configuration from database
      const featureVisibilityData = await FeatureVisibilityAPI.getFeatureVisibility();
      
      // Extract roles from the visibility data
      const rolesFromData = Object.keys(featureVisibilityData).map(roleId => ({
        id: roleId,
        name: featureVisibilityData[roleId].roleName,
        displayName: featureVisibilityData[roleId].roleDisplayName
      }));

      setRoles(rolesFromData);

      // Build role-feature matrix from database data
      const initialMatrix = {};
      Object.keys(featureVisibilityData).forEach(roleId => {
        initialMatrix[roleId] = [];
        const roleFeatures = featureVisibilityData[roleId].features;
        
        // Add features that are visible and enabled
        Object.keys(roleFeatures).forEach(featureId => {
          const feature = roleFeatures[featureId];
          if (feature.isVisible && feature.isEnabled) {
            initialMatrix[roleId].push(featureId);
          }
        });
      });

      setRoleFeatureMatrix(initialMatrix);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (err) {
      console.error('Error initializing feature visibility data:', err);
      setError('Failed to load feature configuration');
      toast.error('Failed to load feature configuration');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // Get feature dependencies tree
  const getFeatureDependencies = useCallback(() => {
    const dependencyTree = {};
    
    featureCategories.forEach(category => {
      category.features.forEach(feature => {
        dependencyTree[feature.id] = {
          ...feature,
          categoryId: category.id,
          categoryName: category.name
        };
      });
    });

    return dependencyTree;
  }, [featureCategories]);

  // Validate feature dependencies for circular references
  const validateFeatureDependencies = useCallback(() => {
    const visited = new Set();
    const recursionStack = new Set();
    let hasCircularDependencies = false;

    const dfs = (featureId, dependencyTree) => {
      if (recursionStack.has(featureId)) {
        hasCircularDependencies = true;
        return;
      }
      if (visited.has(featureId)) {
        return;
      }

      visited.add(featureId);
      recursionStack.add(featureId);

      const feature = dependencyTree[featureId];
      if (feature && feature.dependencies) {
        feature.dependencies.forEach(depId => {
          dfs(depId, dependencyTree);
        });
      }

      recursionStack.delete(featureId);
    };

    const dependencyTree = getFeatureDependencies();
    Object.keys(dependencyTree).forEach(featureId => {
      if (!visited.has(featureId)) {
        dfs(featureId, dependencyTree);
      }
    });

    return { hasCircularDependencies };
  }, [getFeatureDependencies]);

  // Validate feature change against dependencies and business rules
  const validateFeatureChange = useCallback((roleId, featureId, enabled, options = {}) => {
    const dependencyTree = getFeatureDependencies();
    const currentFeatures = roleFeatureMatrix[roleId] || [];
    const feature = dependencyTree[featureId];
    
    if (!feature) {
      return {
        isValid: false,
        errors: ['Feature not found'],
        warnings: []
      };
    }

    const errors = [];
    const warnings = [];
    let requiresConfirmation = false;

    // Check if trying to disable core functionality
    if (!enabled && feature.isCore) {
      errors.push('Cannot disable core functionality');
    }

    // Check if trying to enable admin-only features for non-admin roles
    if (enabled && feature.adminOnly) {
      const role = roles.find(r => r.id === roleId);
      if (role && role.name !== 'Administrator') {
        errors.push('Admin-only features cannot be enabled for non-administrator roles');
      }
    }

    if (enabled) {
      // Check if all dependencies are satisfied
      if (feature.dependencies && feature.dependencies.length > 0) {
        const missingDependencies = feature.dependencies.filter(depId => 
          !currentFeatures.includes(depId)
        );
        
        if (missingDependencies.length > 0) {
          const missingNames = missingDependencies.map(depId => 
            dependencyTree[depId]?.name || depId
          );
          errors.push(`${feature.name} requires ${missingNames.join(', ')} access`);
        }
      }
    } else {
      // Check if disabling will break dependents
      if (feature.dependents && feature.dependents.length > 0) {
        const affectedDependents = feature.dependents.filter(depId => 
          currentFeatures.includes(depId)
        );
        
        if (affectedDependents.length > 0) {
          const dependentNames = affectedDependents.map(depId => 
            dependencyTree[depId]?.name || depId
          );
          warnings.push(`Disabling ${feature.name} will also disable ${dependentNames.join(', ')}`);
          requiresConfirmation = true;
        }
      }
    }

    // Check if this affects other users
    if (options.checkAffectedUsers !== false) {
      // Mock affected user count - in real implementation would query database
      const affectedCount = Math.floor(Math.random() * 10) + 1;
      if (affectedCount > 1) {
        warnings.push(`This will affect ${affectedCount} users`);
        requiresConfirmation = true;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      requiresConfirmation
    };
  }, [getFeatureDependencies, roleFeatureMatrix, roles]);

  // Update role features
  const updateRoleFeatures = useCallback(async (roleId, featureId, enabled) => {
    try {
      // Validate the change first
      const validation = validateFeatureChange(roleId, featureId, enabled);
      if (!validation.isValid) {
        throw new Error(validation.errors[0]);
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
          toast.warning(warning);
        });
      }

      // Update local state immediately for UI responsiveness
      setRoleFeatureMatrix(prev => {
        const updated = { ...prev };
        const currentFeatures = updated[roleId] || [];
        
        if (enabled) {
          updated[roleId] = [...currentFeatures, featureId];
        } else {
          updated[roleId] = currentFeatures.filter(f => f !== featureId);
          
          // Also remove dependent features
          const dependencyTree = getFeatureDependencies();
          const feature = dependencyTree[featureId];
          if (feature && feature.dependents) {
            feature.dependents.forEach(depId => {
              updated[roleId] = updated[roleId].filter(f => f !== depId);
            });
          }
        }
        
        return updated;
      });

      // Update feature visibility in database
      await FeatureVisibilityAPI.updateFeatureVisibility(roleId, 'expenses', featureId, {
        isVisible: enabled,
        isEnabled: enabled,
        configuration: {}
      });

      // Notify subscribers
      const updateEvent = { roleId, feature: featureId, enabled };
      Object.values(subscribers.roleUpdate || []).forEach(callback => {
        callback(updateEvent);
      });

      const affectedUsers = await getAffectedUsers(roleId, featureId);
      toast.success(`Feature visibility updated successfully (${affectedUsers.count} users affected)`);

      return { success: true, affectedUsers: affectedUsers.count };

    } catch (error) {
      console.error('Error updating role features:', error);
      toast.error(`Failed to update feature visibility: ${error.message}`);
      throw error;
    }
  }, [validateFeatureChange, getFeatureDependencies, subscribers]);

  // Get affected users count from user_roles table
  const getAffectedUsers = useCallback(async (roleId, featureId) => {
    try {
      // For now, return a generic count since we need to query user_roles table
      // This would require adding a method to the SettingsAPI
      return { count: 1 }; // Simplified for now
    } catch (error) {
      console.error('Error getting affected users count:', error);
      return { count: 0 };
    }
  }, []);

  // Bulk update features
  const bulkUpdateFeatures = useCallback(async (operation) => {
    const { roleIds, categoryId, action } = operation;
    
    try {
      // Validate bulk operation first
      const validation = validateBulkOperation(operation);
      if (!validation.isValid) {
        throw new Error(validation.errors[0]);
      }

      // Get features in the category
      const category = featureCategories.find(cat => cat.id === categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      // Apply changes to each role
      const updates = roleIds.map(async (roleId) => {
        for (const feature of category.features) {
          const enabled = action === 'enable';
          await updateRoleFeatures(roleId, feature.id, enabled);
        }
      });

      await Promise.all(updates);

      toast.success(`Bulk ${action} operation completed successfully`);

    } catch (error) {
      console.error('Error in bulk operation:', error);
      toast.error(`Bulk operation failed: ${error.message}`);
      throw error;
    }
  }, [featureCategories, updateRoleFeatures]);

  // Validate bulk operation
  const validateBulkOperation = useCallback((operation) => {
    const { roleIds, categoryId, action } = operation;
    const errors = [];

    // Check if trying to disable core features for all users
    if (action === 'disable') {
      const category = featureCategories.find(cat => cat.id === categoryId);
      const hasCoreFeatures = category?.features.some(f => f.isCore);
      
      if (hasCoreFeatures && roleIds.length === roles.length) {
        errors.push('Cannot disable core features for all users');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }, [featureCategories, roles]);

  // Calculate bulk operation impact
  const calculateBulkOperationImpact = useCallback(async (operation) => {
    const { roleIds, categoryId } = operation;
    
    const category = featureCategories.find(cat => cat.id === categoryId);
    const featuresChanged = category?.features.map(f => f.id) || [];
    
    // Calculate total affected users
    let totalAffectedUsers = 0;
    for (const roleId of roleIds) {
      const result = await getAffectedUsers(roleId, 'bulk');
      totalAffectedUsers += result.count;
    }

    const warnings = [];
    if (totalAffectedUsers > 5) {
      warnings.push(`This will affect ${totalAffectedUsers} users across ${roleIds.length} roles`);
    }

    return {
      affectedUsers: totalAffectedUsers,
      featuresChanged: featuresChanged.length,
      warnings
    };
  }, [featureCategories, getAffectedUsers]);

  // Generate interface preview for role
  const previewRoleInterface = useCallback((roleId) => {
    const currentFeatures = roleFeatureMatrix[roleId] || [];
    const rolePendingChanges = pendingChanges[roleId] || {};
    
    // Apply pending changes to current features
    const previewFeatures = [...currentFeatures];
    Object.entries(rolePendingChanges).forEach(([featureId, enabled]) => {
      if (enabled && !previewFeatures.includes(featureId)) {
        previewFeatures.push(featureId);
      } else if (!enabled && previewFeatures.includes(featureId)) {
        const index = previewFeatures.indexOf(featureId);
        previewFeatures.splice(index, 1);
      }
    });

    // Build navigation structure
    const dependencyTree = getFeatureDependencies();
    const availableFeatures = previewFeatures.map(fId => dependencyTree[fId]).filter(Boolean);
    
    // Categorize features
    const coreApps = availableFeatures.filter(f => 
      featureCategories.find(cat => cat.id === 'core-apps')?.features.some(cf => cf.id === f.id)
    );
    
    const dashboardComponents = availableFeatures.filter(f => 
      featureCategories.find(cat => cat.id === 'dashboard-components')?.features.some(cf => cf.id === f.id)
    );

    // Determine accessibility level
    let accessibilityLevel = 'limited';
    if (previewFeatures.includes('expenses') && previewFeatures.includes('analytics')) {
      accessibilityLevel = 'full';
    } else if (previewFeatures.includes('expenses')) {
      accessibilityLevel = 'standard';
    }

    // Generate warnings
    const warnings = [];
    if (previewFeatures.length < 3) {
      warnings.push('Limited feature access may impact user experience');
    }
    if (!previewFeatures.includes('navigation')) {
      warnings.push('Navigation disabled - users may have difficulty accessing features');
    }

    return {
      availableFeatures: previewFeatures,
      navigationStructure: {
        coreApps: coreApps.map(f => ({ id: f.id, name: f.name })),
        dashboardComponents: dashboardComponents.map(f => ({ id: f.id, name: f.name }))
      },
      accessibleApps: coreApps.map(f => f.id),
      featureCount: previewFeatures.length,
      accessibilityLevel,
      warnings
    };
  }, [roleFeatureMatrix, pendingChanges, getFeatureDependencies, featureCategories]);

  // Add pending change (for real-time preview)
  const addPendingChange = useCallback((roleId, featureId, enabled) => {
    setPendingChanges(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [featureId]: enabled
      }
    }));
  }, []);

  // Subscribe to updates
  const subscribe = useCallback((event, callback) => {
    setSubscribers(prev => ({
      ...prev,
      [event]: {
        ...prev[event],
        [Date.now()]: callback
      }
    }));
  }, []);

  // Debounced feature toggle
  const toggleFeature = useCallback((roleId, featureId) => {
    const currentFeatures = roleFeatureMatrix[roleId] || [];
    const enabled = !currentFeatures.includes(featureId);
    
    // Add to update queue instead of immediate update
    setUpdateQueue(prev => [
      ...prev.filter(item => !(item.roleId === roleId && item.featureId === featureId)),
      { roleId, featureId, enabled, timestamp: Date.now() }
    ]);
  }, [roleFeatureMatrix]);

  // Process update queue with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (updateQueue.length > 0) {
        // Group updates by role
        const groupedUpdates = updateQueue.reduce((acc, update) => {
          if (!acc[update.roleId]) {
            acc[update.roleId] = [];
          }
          acc[update.roleId].push(update);
          return acc;
        }, {});

        // Process each role's updates
        Object.entries(groupedUpdates).forEach(([roleId, updates]) => {
          // Take only the latest update for each feature
          const latestUpdates = updates.reduce((acc, update) => {
            acc[update.featureId] = update;
            return acc;
          }, {});

          // Apply updates
          Object.values(latestUpdates).forEach(update => {
            updateRoleFeatures(update.roleId, update.featureId, update.enabled);
          });
        });

        setUpdateQueue([]);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [updateQueue, updateRoleFeatures]);

  // Memoized expensive calculations
  const memoizedDependencies = useMemo(() => getFeatureDependencies(), [getFeatureDependencies]);

  // Initialize on mount
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  return {
    // State
    loading,
    error,
    featureCategories,
    roles,
    roleFeatureMatrix,
    
    // Feature management
    updateRoleFeatures,
    bulkUpdateFeatures,
    toggleFeature,
    
    // Validation
    validateFeatureChange,
    validateBulkOperation,
    validateFeatureDependencies,
    
    // Preview and analysis  
    previewRoleInterface,
    calculateBulkOperationImpact,
    getAffectedUsers,
    
    // Utilities
    getFeatureDependencies: () => memoizedDependencies,
    addPendingChange,
    subscribe
  };
};