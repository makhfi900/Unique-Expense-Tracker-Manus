import { useMemo } from 'react';
import { useAuth } from '../context/SupabaseAuthContext';
import { useNavigation } from '../context/NavigationContext';

/**
 * Custom hook for role-based access control
 * Provides utility functions to check permissions and feature access
 */
export const useRoleBasedAccess = () => {
  const { userProfile, user, isAdmin } = useAuth();
  const { hasFeatureAccess, hasAppAccess, userRole, getEnabledFeatures } = useNavigation();

  // Get current user role with fallback
  const currentRole = useMemo(() => {
    return userProfile?.role || user?.user_metadata?.role || 'account_officer';
  }, [userProfile?.role, user?.user_metadata?.role]);

  // Role hierarchy for permissions
  const roleHierarchy = useMemo(() => ({
    admin: 4,
    manager: 3, 
    teacher: 2,
    account_officer: 1
  }), []);

  // Check if user has minimum role level
  const hasMinimumRole = (minimumRole) => {
    const currentLevel = roleHierarchy[currentRole] || 0;
    const requiredLevel = roleHierarchy[minimumRole] || 0;
    return currentLevel >= requiredLevel;
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return currentRole === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(currentRole);
  };

  // Check if user is admin (convenience method)
  const isAdministrator = useMemo(() => {
    return currentRole === 'admin' || isAdmin;
  }, [currentRole, isAdmin]);

  // Check if user is manager or higher
  const isManagerOrHigher = useMemo(() => {
    return hasMinimumRole('manager');
  }, [currentRole]);

  // Check if user is teacher
  const isTeacher = useMemo(() => {
    return currentRole === 'teacher';
  }, [currentRole]);

  // Check if user is account officer
  const isAccountOfficer = useMemo(() => {
    return currentRole === 'account_officer';
  }, [currentRole]);

  // Get accessible features for specific app
  const getAccessibleFeatures = (appId) => {
    return getEnabledFeatures(appId);
  };

  // Check if feature is accessible in specific app
  const canAccessFeature = (appId, feature) => {
    return hasFeatureAccess(appId, feature);
  };

  // Check if app is accessible
  const canAccessApp = (appId) => {
    return hasAppAccess(appId);
  };

  // Get role-specific navigation configuration
  const getRoleNavigation = () => {
    switch (currentRole) {
      case 'admin':
        return {
          primaryApps: ['expenses', 'exams', 'settings'],
          defaultApp: 'expenses',
          canManageUsers: true,
          canConfigureSystem: true,
          canViewAllData: true
        };
      case 'manager':
        return {
          primaryApps: ['expenses', 'exams'],
          defaultApp: 'expenses',
          canManageUsers: false,
          canConfigureSystem: false,
          canViewAllData: true
        };
      case 'teacher':
        return {
          primaryApps: ['exams'],
          defaultApp: 'exams',
          canManageUsers: false,
          canConfigureSystem: false,
          canViewAllData: false
        };
      case 'account_officer':
        return {
          primaryApps: ['expenses'],
          defaultApp: 'expenses',
          canManageUsers: false,
          canConfigureSystem: false,
          canViewAllData: false
        };
      default:
        return {
          primaryApps: [],
          defaultApp: null,
          canManageUsers: false,
          canConfigureSystem: false,
          canViewAllData: false
        };
    }
  };

  // Get role display information
  const getRoleDisplay = () => {
    const roleDisplayMap = {
      admin: {
        label: 'Administrator',
        description: 'Full system access and user management',
        badgeVariant: 'default',
        icon: 'Crown'
      },
      manager: {
        label: 'Manager', 
        description: 'Access to expenses and exam management',
        badgeVariant: 'secondary',
        icon: 'Users'
      },
      teacher: {
        label: 'Teacher',
        description: 'Access to exam management and grading',
        badgeVariant: 'outline',
        icon: 'GraduationCap'
      },
      account_officer: {
        label: 'Account Officer',
        description: 'Access to expense management only',
        badgeVariant: 'outline', 
        icon: 'Calculator'
      }
    };

    return roleDisplayMap[currentRole] || {
      label: 'User',
      description: 'Basic access',
      badgeVariant: 'outline',
      icon: 'User'
    };
  };

  // Check if user can perform CRUD operations
  const canCreate = (resource) => {
    switch (resource) {
      case 'expense':
        return canAccessFeature('expenses', 'add_expense');
      case 'exam':
        return canAccessFeature('exams', 'create_exam');
      case 'user':
        return canAccessFeature('settings', 'user_management');
      default:
        return false;
    }
  };

  const canEdit = (resource) => {
    switch (resource) {
      case 'expense':
        return canAccessFeature('expenses', 'edit_expense');
      case 'exam':
        return canAccessFeature('exams', 'grade_exam');
      case 'user':
        return canAccessFeature('settings', 'user_management');
      default:
        return false;
    }
  };

  const canDelete = (resource) => {
    switch (resource) {
      case 'expense':
        return canAccessFeature('expenses', 'delete_expense');
      case 'exam':
        return hasMinimumRole('manager') && canAccessFeature('exams', 'create_exam');
      case 'user':
        return canAccessFeature('settings', 'user_management');
      default:
        return false;
    }
  };

  const canView = (resource) => {
    switch (resource) {
      case 'expense':
        return canAccessFeature('expenses', 'view_expenses');
      case 'exam':
        return canAccessFeature('exams', 'view_exams');
      case 'user':
        return canAccessFeature('settings', 'user_management');
      case 'analytics':
        return canAccessFeature('expenses', 'analytics');
      default:
        return false;
    }
  };

  return {
    // Current role info
    currentRole,
    userRole: currentRole, // Alias for compatibility
    
    // Role checking functions
    hasRole,
    hasAnyRole,
    hasMinimumRole,
    
    // Convenience role checks
    isAdministrator,
    isManagerOrHigher,
    isTeacher,
    isAccountOfficer,
    
    // App and feature access
    canAccessApp,
    canAccessFeature,
    getAccessibleFeatures,
    
    // CRUD permissions
    canCreate,
    canEdit,
    canDelete,
    canView,
    
    // Configuration
    getRoleNavigation,
    getRoleDisplay,
    roleHierarchy
  };
};

export default useRoleBasedAccess;