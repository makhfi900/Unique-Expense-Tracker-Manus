import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './SupabaseAuthContext';

const NavigationContext = createContext();

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

// App definitions with role-based access
const APP_DEFINITIONS = {
  expenses: {
    id: 'expenses',
    name: 'Expense Tracker',
    description: 'Manage institutional expenses and financial records',
    icon: 'DollarSign',
    color: 'blue',
    path: '/expenses',
    roles: ['admin', 'manager', 'account_officer'],
    features: [
      'view_expenses',
      'add_expense', 
      'edit_expense',
      'delete_expense',
      'export_data',
      'import_data',
      'analytics',
      'categories'
    ]
  },
  exams: {
    id: 'exams',
    name: 'Exam Management',
    description: 'Handle examinations, results, and academic records',
    icon: 'GraduationCap',
    color: 'green',
    path: '/exams',
    roles: ['admin', 'manager', 'teacher'],
    features: [
      'view_exams',
      'create_exam',
      'grade_exam',
      'view_results',
      'generate_reports',
      'student_management'
    ]
  },
  settings: {
    id: 'settings',
    name: 'System Settings',
    description: 'Configure system features and user permissions',
    icon: 'Settings',
    color: 'purple',
    path: '/settings',
    roles: ['admin'],
    features: [
      'user_management',
      'role_configuration',
      'feature_toggles',
      'system_configuration',
      'backup_restore'
    ]
  }
};

// Feature dependency matrix
const FEATURE_DEPENDENCIES = {
  'edit_expense': ['view_expenses'],
  'delete_expense': ['view_expenses', 'edit_expense'],
  'analytics': ['view_expenses'],
  'export_data': ['view_expenses'],
  'grade_exam': ['view_exams'],
  'generate_reports': ['view_results'],
  'feature_toggles': ['user_management'],
  'system_configuration': ['user_management', 'role_configuration']
};

// Role-based feature matrix
const ROLE_FEATURES = {
  admin: {
    expenses: ['view_expenses', 'add_expense', 'edit_expense', 'delete_expense', 'export_data', 'import_data', 'analytics', 'categories'],
    exams: ['view_exams', 'create_exam', 'grade_exam', 'view_results', 'generate_reports', 'student_management'],
    settings: ['user_management', 'role_configuration', 'feature_toggles', 'system_configuration', 'backup_restore']
  },
  manager: {
    expenses: ['view_expenses', 'add_expense', 'edit_expense', 'export_data', 'analytics', 'categories'],
    exams: ['view_exams', 'create_exam', 'view_results', 'generate_reports', 'student_management'],
    settings: []
  },
  teacher: {
    expenses: [],
    exams: ['view_exams', 'grade_exam', 'view_results'],
    settings: []
  },
  account_officer: {
    expenses: ['view_expenses', 'add_expense', 'edit_expense', 'export_data', 'categories'],
    exams: [],
    settings: []
  }
};

export const NavigationProvider = ({ children }) => {
  const { userProfile, user } = useAuth();
  const [currentApp, setCurrentApp] = useState('hub');
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [featureConfig, setFeatureConfig] = useState(() => {
    // Load from localStorage or use defaults
    const saved = localStorage.getItem('navigationFeatureConfig');
    return saved ? JSON.parse(saved) : {};
  });

  // Get user role
  const userRole = useMemo(() => {
    return userProfile?.role || user?.user_metadata?.role || 'account_officer';
  }, [userProfile?.role, user?.user_metadata?.role]);

  // Get accessible apps for current user
  const accessibleApps = useMemo(() => {
    return Object.values(APP_DEFINITIONS).filter(app => 
      app.roles.includes(userRole)
    );
  }, [userRole]);

  // Get enabled features for current user and app
  const getEnabledFeatures = (appId) => {
    const roleFeatures = ROLE_FEATURES[userRole]?.[appId] || [];
    const configuredFeatures = featureConfig[appId] || {};
    
    return roleFeatures.filter(feature => {
      // Check if feature is enabled in configuration (default true)
      const isEnabled = configuredFeatures[feature] !== false;
      
      // Check dependencies
      const dependencies = FEATURE_DEPENDENCIES[feature] || [];
      const dependenciesMet = dependencies.every(dep => 
        roleFeatures.includes(dep) && configuredFeatures[dep] !== false
      );
      
      return isEnabled && dependenciesMet;
    });
  };

  // Update feature configuration
  const updateFeatureConfig = (appId, feature, enabled) => {
    setFeatureConfig(prev => {
      const newConfig = {
        ...prev,
        [appId]: {
          ...prev[appId],
          [feature]: enabled
        }
      };
      
      // If disabling a feature, also disable dependent features
      if (!enabled) {
        Object.keys(FEATURE_DEPENDENCIES).forEach(dependentFeature => {
          if (FEATURE_DEPENDENCIES[dependentFeature].includes(feature)) {
            newConfig[appId][dependentFeature] = false;
          }
        });
      }
      
      localStorage.setItem('navigationFeatureConfig', JSON.stringify(newConfig));
      return newConfig;
    });
  };

  // Navigate to app
  const navigateToApp = (appId, section = null) => {
    setCurrentApp(appId);
    
    if (appId === 'hub') {
      setBreadcrumb([{ label: 'Dashboard', path: '/dashboard' }]);
    } else {
      const app = APP_DEFINITIONS[appId];
      const newBreadcrumb = [
        { label: 'Dashboard', path: '/dashboard' },
        { label: app?.name || appId, path: app?.path || `/${appId}` }
      ];
      
      if (section) {
        newBreadcrumb.push({ label: section, path: `${app?.path}/${section}` });
      }
      
      setBreadcrumb(newBreadcrumb);
    }
  };

  // Add breadcrumb item
  const addBreadcrumb = (label, path) => {
    setBreadcrumb(prev => [...prev, { label, path }]);
  };

  // Remove breadcrumb items from specific index
  const removeBreadcrumb = (fromIndex) => {
    setBreadcrumb(prev => prev.slice(0, fromIndex));
  };

  // Check if user has access to specific feature
  const hasFeatureAccess = (appId, feature) => {
    const enabledFeatures = getEnabledFeatures(appId);
    return enabledFeatures.includes(feature);
  };

  // Check if user can access app
  const hasAppAccess = (appId) => {
    const app = APP_DEFINITIONS[appId];
    return app && app.roles.includes(userRole);
  };

  // Save navigation state to localStorage
  useEffect(() => {
    localStorage.setItem('navigationCurrentApp', currentApp);
  }, [currentApp]);

  // Load navigation state from localStorage
  useEffect(() => {
    const savedApp = localStorage.getItem('navigationCurrentApp');
    if (savedApp && hasAppAccess(savedApp)) {
      setCurrentApp(savedApp);
    }
  }, [userRole]);

  const contextValue = {
    // Current state
    currentApp,
    breadcrumb,
    userRole,
    featureConfig,
    
    // App definitions
    apps: APP_DEFINITIONS,
    accessibleApps,
    
    // Navigation functions
    navigateToApp,
    addBreadcrumb,
    removeBreadcrumb,
    
    // Feature management
    getEnabledFeatures,
    updateFeatureConfig,
    hasFeatureAccess,
    hasAppAccess,
    
    // Dependencies
    featureDependencies: FEATURE_DEPENDENCIES,
    roleFeatures: ROLE_FEATURES
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

export default NavigationProvider;