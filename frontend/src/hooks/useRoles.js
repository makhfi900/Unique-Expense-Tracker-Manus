import { useState, useEffect, useCallback } from 'react';
import { RoleManagementAPI } from '../services/settingsApi';
import { useAuth } from '../context/SupabaseAuthContext';
import { toast } from 'sonner';

/**
 * Custom hook for role management operations
 * Provides CRUD operations for roles with proper error handling
 */
export const useRoles = () => {
  const { user, isAdmin } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Available permissions configuration
  const availablePermissions = [
    { key: 'user_management', name: 'User Management', description: 'Manage user accounts and roles', category: 'admin' },
    { key: 'system_config', name: 'System Configuration', description: 'Configure system settings', category: 'admin' },
    { key: 'expense_read', name: 'Expense Read', description: 'View expense data', category: 'expense' },
    { key: 'expense_write', name: 'Expense Write', description: 'Create and edit expenses', category: 'expense' },
    { key: 'report_access', name: 'Report Access', description: 'Access financial reports', category: 'reporting' },
    { key: 'audit_logs', name: 'Audit Logs', description: 'View system audit logs', category: 'admin' }
  ];


  // Fetch roles from backend
  const fetchRoles = useCallback(async () => {
    if (!isAdmin) {
      setRoles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Real API call using Settings API
      const rolesData = await RoleManagementAPI.getRoles();
      setRoles(rolesData);
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError('Failed to load roles. Please try again.');
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user?.id]);

  // Create new role
  const createRole = useCallback(async (roleData) => {
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    try {
      // Validate input
      if (!roleData.name || !roleData.description || !roleData.permissions?.length) {
        throw new Error('Invalid role data: name, description, and permissions are required');
      }

      // Check for duplicate names
      const existingRole = roles.find(role => 
        role.name.toLowerCase() === roleData.name.trim().toLowerCase()
      );
      if (existingRole) {
        throw new Error('A role with this name already exists');
      }

      // Create role using Settings API
      const newRole = await RoleManagementAPI.createRole({
        name: roleData.name.trim(),
        displayName: roleData.name.trim(),
        description: roleData.description.trim(),
        permissions: roleData.permissions.map(permissionKey => ({
          name: permissionKey,
          resourceType: 'feature',
          resourceId: 'expense_tracker',
          granted: true
        }))
      });

      // Update local state
      setRoles(prev => [...prev, newRole]);
      toast.success('Role created successfully');
      
      return newRole;
    } catch (err) {
      console.error('Error creating role:', err);
      toast.error(err.message || 'Failed to create role');
      throw err;
    }
  }, [isAdmin, roles, user?.id]);

  // Update existing role
  const updateRole = useCallback(async (roleId, updates) => {
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    try {
      const roleToUpdate = roles.find(role => role.id === roleId);
      if (!roleToUpdate) {
        throw new Error('Role not found');
      }

      // Validate input
      if (updates.name !== undefined) {
        if (!updates.name || updates.name.trim().length === 0) {
          throw new Error('Role name cannot be empty');
        }

        // Check for duplicate names (excluding current role)
        const existingRole = roles.find(role => 
          role.id !== roleId && 
          role.name.toLowerCase() === updates.name.trim().toLowerCase()
        );
        if (existingRole) {
          throw new Error('A role with this name already exists');
        }
      }

      if (updates.permissions !== undefined && updates.permissions.length === 0) {
        throw new Error('At least one permission must be selected');
      }

      // Update role using Settings API
      const updateData = {};
      if (updates.name) updateData.displayName = updates.name.trim();
      if (updates.description) updateData.description = updates.description.trim();
      if (updates.permissions) {
        updateData.permissions = updates.permissions.map(permissionKey => ({
          name: permissionKey,
          resourceType: 'feature',
          resourceId: 'expense_tracker',
          granted: true
        }));
      }

      await RoleManagementAPI.updateRole(roleId, updateData);

      // Update local state
      setRoles(prev => 
        prev.map(role => 
          role.id === roleId 
            ? {
                ...role,
                ...(updates.name && { name: updates.name.trim() }),
                ...(updates.description && { description: updates.description.trim() }),
                ...(updates.permissions && { permissions: [...updates.permissions] }),
              }
            : role
        )
      );

      toast.success('Role updated successfully');
    } catch (err) {
      console.error('Error updating role:', err);
      toast.error(err.message || 'Failed to update role');
      throw err;
    }
  }, [isAdmin, roles]);

  // Delete role
  const deleteRole = useCallback(async (roleId) => {
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    try {
      const roleToDelete = roles.find(role => role.id === roleId);
      if (!roleToDelete) {
        throw new Error('Role not found');
      }

      // Check if role has users
      if (roleToDelete.user_count > 0) {
        throw new Error(`Cannot delete role with ${roleToDelete.user_count} assigned users`);
      }

      // Prevent deletion of system roles
      if (roleToDelete.is_system_role) {
        throw new Error('System roles cannot be deleted');
      }

      // Delete role using Settings API
      await RoleManagementAPI.deleteRole(roleId);

      // Update local state
      setRoles(prev => prev.filter(role => role.id !== roleId));
      toast.success('Role deleted successfully');
    } catch (err) {
      console.error('Error deleting role:', err);
      toast.error(err.message || 'Failed to delete role');
      throw err;
    }
  }, [isAdmin, roles]);

  // Update role permissions (for matrix operations)
  const updateRolePermissions = useCallback(async (roleId, permissionKey, granted) => {
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    try {
      const role = roles.find(r => r.id === roleId);
      if (!role) {
        throw new Error('Role not found');
      }

      const newPermissions = granted
        ? [...role.permissions, permissionKey]
        : role.permissions.filter(p => p !== permissionKey);

      if (newPermissions.length === 0) {
        throw new Error('At least one permission must remain assigned');
      }

      await updateRole(roleId, { permissions: newPermissions });
    } catch (err) {
      console.error('Error updating role permissions:', err);
      throw err;
    }
  }, [isAdmin, roles, updateRole]);

  // Initialize data on mount
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Role validation utility
  const validateRole = useCallback((roleData) => {
    const errors = {};
    
    if (!roleData.name || roleData.name.trim().length === 0) {
      errors.name = 'Role name is required';
    } else if (roleData.name.trim().length < 3) {
      errors.name = 'Role name must be at least 3 characters';
    } else if (roleData.name.trim().length > 50) {
      errors.name = 'Role name must be less than 50 characters';
    }
    
    if (!roleData.description || roleData.description.trim().length === 0) {
      errors.description = 'Role description is required';
    } else if (roleData.description.trim().length > 255) {
      errors.description = 'Role description must be less than 255 characters';
    }
    
    if (!roleData.permissions || roleData.permissions.length === 0) {
      errors.permissions = 'At least one permission must be selected';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, []);

  return {
    // State
    roles,
    loading,
    error,
    availablePermissions,
    
    // Operations
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    updateRolePermissions,
    
    // Utilities
    validateRole
  };
};