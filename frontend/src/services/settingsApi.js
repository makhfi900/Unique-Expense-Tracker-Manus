/**
 * Settings API Service
 * Handles all Settings app backend integration
 */

import { supabase } from '../lib/supabase';

/**
 * Role Management API
 */
export class RoleManagementAPI {
  
  /**
   * Get all roles with their permissions
   */
  static async getRoles() {
    try {
      const { data: roles, error } = await supabase
        .from('roles')
        .select(`
          *,
          role_permissions (
            id,
            permission_name,
            resource_type,
            resource_id,
            granted
          ),
          user_roles (
            user_id,
            assigned_at
          )
        `)
        .eq('is_active', true)
        .order('created_at');

      if (error) throw error;

      // Transform data for frontend
      return roles.map(role => ({
        id: role.id,
        name: role.name,
        displayName: role.display_name,
        description: role.description,
        isSystemRole: role.is_system_role,
        permissions: role.role_permissions?.map(p => ({
          id: p.id,
          name: p.permission_name,
          resourceType: p.resource_type,
          resourceId: p.resource_id,
          granted: p.granted
        })) || [],
        userCount: role.user_roles?.length || 0,
        createdAt: role.created_at,
        updatedAt: role.updated_at
      }));

    } catch (error) {
      console.error('Error fetching roles:', error);
      throw new Error(`Failed to fetch roles: ${error.message}`);
    }
  }

  /**
   * Create a new role
   */
  static async createRole(roleData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: role, error } = await supabase
        .from('roles')
        .insert([{
          name: roleData.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: roleData.displayName,
          description: roleData.description,
          is_system_role: false,
          is_active: true,
          created_by: user.id,
          updated_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Add permissions if provided
      if (roleData.permissions && roleData.permissions.length > 0) {
        await this.updateRolePermissions(role.id, roleData.permissions);
      }

      return {
        id: role.id,
        name: role.name,
        displayName: role.display_name,
        description: role.description,
        isSystemRole: role.is_system_role,
        permissions: [],
        userCount: 0
      };

    } catch (error) {
      console.error('Error creating role:', error);
      throw new Error(`Failed to create role: ${error.message}`);
    }
  }

  /**
   * Update an existing role
   */
  static async updateRole(roleId, updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update role basic info
      const { error: roleError } = await supabase
        .from('roles')
        .update({
          display_name: updates.displayName,
          description: updates.description,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', roleId);

      if (roleError) throw roleError;

      // Update permissions if provided
      if (updates.permissions) {
        await this.updateRolePermissions(roleId, updates.permissions);
      }

      return { success: true, message: 'Role updated successfully' };

    } catch (error) {
      console.error('Error updating role:', error);
      throw new Error(`Failed to update role: ${error.message}`);
    }
  }

  /**
   * Delete a role (only if no users assigned)
   */
  static async deleteRole(roleId) {
    try {
      // Check if role has assigned users
      const { data: userRoles, error: checkError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role_id', roleId);

      if (checkError) throw checkError;

      if (userRoles && userRoles.length > 0) {
        throw new Error('Cannot delete role with assigned users. Please reassign users first.');
      }

      // Check if it's a system role
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('is_system_role')
        .eq('id', roleId)
        .single();

      if (roleError) throw roleError;

      if (role.is_system_role) {
        throw new Error('System roles cannot be deleted.');
      }

      // Delete the role (cascade will handle permissions)
      const { error: deleteError } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (deleteError) throw deleteError;

      return { success: true, message: 'Role deleted successfully' };

    } catch (error) {
      console.error('Error deleting role:', error);
      throw new Error(`Failed to delete role: ${error.message}`);
    }
  }

  /**
   * Update role permissions
   */
  static async updateRolePermissions(roleId, permissions) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Delete existing permissions
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);

      // Insert new permissions
      if (permissions.length > 0) {
        const permissionData = permissions.map(permission => ({
          role_id: roleId,
          permission_name: permission.name,
          resource_type: permission.resourceType,
          resource_id: permission.resourceId,
          granted: permission.granted !== false,
          created_by: user.id
        }));

        const { error } = await supabase
          .from('role_permissions')
          .insert(permissionData);

        if (error) throw error;
      }

      return { success: true };

    } catch (error) {
      console.error('Error updating role permissions:', error);
      throw error;
    }
  }
}

/**
 * Feature Visibility API
 */
export class FeatureVisibilityAPI {

  /**
   * Get feature visibility configuration for all roles
   */
  static async getFeatureVisibility() {
    try {
      const { data, error } = await supabase
        .from('feature_visibility')
        .select(`
          *,
          roles (
            name,
            display_name
          )
        `);

      if (error) throw error;

      // Transform data for frontend
      const visibilityMatrix = {};
      data?.forEach(item => {
        if (!visibilityMatrix[item.role_id]) {
          visibilityMatrix[item.role_id] = {
            roleName: item.roles?.name,
            roleDisplayName: item.roles?.display_name,
            features: {}
          };
        }
        visibilityMatrix[item.role_id].features[item.feature_id] = {
          appId: item.app_id,
          isVisible: item.is_visible,
          isEnabled: item.is_enabled,
          configuration: item.configuration
        };
      });

      return visibilityMatrix;

    } catch (error) {
      console.error('Error fetching feature visibility:', error);
      throw new Error(`Failed to fetch feature visibility: ${error.message}`);
    }
  }

  /**
   * Update feature visibility for a role
   */
  static async updateFeatureVisibility(roleId, appId, featureId, visibility) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('feature_visibility')
        .upsert({
          role_id: roleId,
          app_id: appId,
          feature_id: featureId,
          is_visible: visibility.isVisible !== false,
          is_enabled: visibility.isEnabled !== false,
          configuration: visibility.configuration || {},
          updated_by: user.id,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      return { success: true };

    } catch (error) {
      console.error('Error updating feature visibility:', error);
      throw new Error(`Failed to update feature visibility: ${error.message}`);
    }
  }

  /**
   * Bulk update feature visibility
   */
  static async bulkUpdateFeatureVisibility(updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const upsertData = updates.map(update => ({
        role_id: update.roleId,
        app_id: update.appId,
        feature_id: update.featureId,
        is_visible: update.isVisible !== false,
        is_enabled: update.isEnabled !== false,
        configuration: update.configuration || {},
        updated_by: user.id,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('feature_visibility')
        .upsert(upsertData);

      if (error) throw error;

      return { success: true, updatedCount: upsertData.length };

    } catch (error) {
      console.error('Error bulk updating feature visibility:', error);
      throw new Error(`Failed to bulk update feature visibility: ${error.message}`);
    }
  }
}

/**
 * Settings Audit API
 */
export class SettingsAuditAPI {

  /**
   * Get audit log entries
   */
  static async getAuditLog(filters = {}) {
    try {
      let query = supabase
        .from('settings_audit_log')
        .select(`
          *,
          auth.users (
            email,
            raw_user_meta_data
          )
        `)
        .order('timestamp', { ascending: false });

      // Apply filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.map(entry => ({
        id: entry.id,
        userId: entry.user_id,
        userEmail: entry.auth?.users?.email,
        action: entry.action,
        resourceType: entry.resource_type,
        resourceId: entry.resource_id,
        oldValues: entry.old_values,
        newValues: entry.new_values,
        timestamp: entry.timestamp,
        ipAddress: entry.ip_address,
        userAgent: entry.user_agent
      })) || [];

    } catch (error) {
      console.error('Error fetching audit log:', error);
      throw new Error(`Failed to fetch audit log: ${error.message}`);
    }
  }
}

export default {
  RoleManagementAPI,
  FeatureVisibilityAPI,
  SettingsAuditAPI
};