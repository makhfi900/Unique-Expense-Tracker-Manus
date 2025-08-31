import React, { useState } from 'react';
import { useAuth } from '../context/SupabaseAuthContext';
import { useRoles } from '../hooks/useRoles';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  AlertTriangle,
  Loader2,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * RoleManagement Component
 * 
 * Implements Story 1.2: Role Management Interface
 * - Administrator can view all user roles in a table format
 * - Administrator can create new roles with name, description, and permissions
 * - Administrator can edit existing role permissions and details
 * - Administrator can delete unused roles (with proper validation)
 * - Interface shows role-based feature visibility matrix
 * - All operations integrate with Supabase RLS and authentication
 */
const RoleManagement = () => {
  const { isAdmin } = useAuth();
  
  // Use custom hook for role management
  const {
    roles,
    loading,
    error,
    availablePermissions,
    createRole,
    updateRole,
    deleteRole,
    validateRole
  } = useRoles();
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);



  // Handle role creation
  const handleCreateRole = async (e) => {
    e.preventDefault();
    
    const validation = validateRole(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }
    
    try {
      setSubmitting(true);
      setFormErrors({});
      
      await createRole(formData);
      
      // Reset form and close dialog
      setFormData({ name: '', description: '', permissions: [] });
      setIsCreateDialogOpen(false);
    } catch (err) {
      // Error handling is done in the hook
    } finally {
      setSubmitting(false);
    }
  };

  // Handle role editing
  const handleEditRole = (role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions]
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  // Handle role update
  const handleUpdateRole = async (e) => {
    e.preventDefault();
    
    const validation = validateRole(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }
    
    try {
      setSubmitting(true);
      setFormErrors({});
      
      await updateRole(selectedRole.id, {
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions
      });
      
      setIsEditDialogOpen(false);
      setSelectedRole(null);
    } catch (err) {
      // Error handling is done in the hook
    } finally {
      setSubmitting(false);
    }
  };

  // Handle role deletion
  const handleDeleteRole = (role) => {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  // Confirm role deletion
  const handleConfirmDelete = async () => {
    if (!selectedRole) return;
    
    try {
      setSubmitting(true);
      
      await deleteRole(selectedRole.id);
      
      setIsDeleteDialogOpen(false);
      setSelectedRole(null);
    } catch (err) {
      // Error handling is done in the hook
    } finally {
      setSubmitting(false);
    }
  };

  // Handle permission toggle
  const handlePermissionToggle = (permissionKey, checked) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permissionKey]
        : prev.permissions.filter(p => p !== permissionKey)
    }));
  };

  // Permission Matrix component
  const PermissionMatrix = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Role-Permission Matrix
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table data-testid="matrix-table" className="w-full">
            <thead>
              <tr className="border-b">
                <th data-testid="matrix-header-permission" className="text-left p-2 font-medium">
                  Permission
                </th>
                {roles.map(role => (
                  <th key={role.id} data-testid={`matrix-header-role-${role.id}`} className="text-center p-2 font-medium min-w-[120px]">
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {availablePermissions.map(permission => (
                <tr key={permission.key} data-testid={`matrix-row-${permission.key}`} className="border-b">
                  <td data-testid={`permission-label-${permission.key}`} className="p-2">
                    <div>
                      <div className="font-medium">{permission.name}</div>
                      <div className="text-sm text-muted-foreground">{permission.description}</div>
                    </div>
                  </td>
                  {roles.map(role => (
                    <td key={`${role.id}-${permission.key}`} data-testid={`matrix-cell-${role.id}-${permission.key}`} className="p-2 text-center">
                      <Checkbox
                        data-testid={`permission-checkbox-${role.id}-${permission.key}`}
                        checked={role.permissions.includes(permission.key)}
                        onCheckedChange={(checked) => {
                          // Handle permission matrix changes
                          try {
                            updateRole(role.id, {
                              permissions: checked
                                ? [...role.permissions, permission.key]
                                : role.permissions.filter(p => p !== permission.key)
                            });
                          } catch (err) {
                            // Error will be handled by the hook
                          }
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  return (
    <div data-testid="role-management-interface" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Role Management</h2>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <Button 
          data-testid="create-role-button"
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create New Role
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList data-testid="role-management-tabs">
          <TabsTrigger data-testid="roles-tab" value="roles">Roles</TabsTrigger>
          <TabsTrigger data-testid="matrix-tab" value="matrix">Permission Matrix</TabsTrigger>
        </TabsList>

        {/* Roles Table Tab */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                System Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading roles...</span>
                </div>
              ) : (
                <div data-testid="roles-table">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Users</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.map(role => (
                        <TableRow key={role.id} data-testid={`role-row-${role.id}`}>
                          <TableCell>
                            <div data-testid={`role-name-${role.id}`} className="font-medium">
                              {role.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div data-testid={`role-description-${role.id}`} className="text-sm text-muted-foreground">
                              {role.description}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div data-testid={`permissions-count-${role.id}`}>
                              <Badge variant="outline">
                                {role.permissions.length} permissions
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div data-testid={`user-count-${role.id}`}>
                              <Badge variant={role.user_count > 0 ? "default" : "secondary"}>
                                {role.user_count} users
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div data-testid={`role-actions-${role.id}`} className="flex items-center gap-2">
                              <Button
                                data-testid={`edit-role-${role.id}`}
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditRole(role)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                data-testid={`delete-role-${role.id}`}
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteRole(role)}
                                disabled={role.user_count > 0}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permission Matrix Tab */}
        <TabsContent value="matrix" data-testid="permission-matrix">
          <PermissionMatrix />
        </TabsContent>
      </Tabs>

      {/* Create Role Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent data-testid="create-role-dialog">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Create a new role with specific permissions for users
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRole} data-testid="role-creation-form">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Role Name</Label>
                <Input
                  data-testid="role-name-input"
                  id="name"
                  placeholder="Enter role name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive mt-1">{formErrors.name}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  data-testid="role-description-input"
                  id="description"
                  placeholder="Enter role description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
                {formErrors.description && (
                  <p className="text-sm text-destructive mt-1">{formErrors.description}</p>
                )}
              </div>
              
              <div>
                <Label>Permissions</Label>
                <div data-testid="permissions-selector" className="space-y-3 mt-2">
                  {availablePermissions.map(permission => (
                    <div key={permission.key} className="flex items-start space-x-3">
                      <Checkbox
                        data-testid={`permission-${permission.key}`}
                        id={permission.key}
                        checked={formData.permissions.includes(permission.key)}
                        onCheckedChange={(checked) => handlePermissionToggle(permission.key, checked)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor={permission.key}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.name}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {formErrors.permissions && (
                  <p className="text-sm text-destructive mt-1">{formErrors.permissions}</p>
                )}
              </div>
            </div>
            
            <DialogFooter data-testid="form-actions" className="mt-6">
              <Button
                data-testid="cancel-button"
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setFormData({ name: '', description: '', permissions: [] });
                  setFormErrors({});
                }}
              >
                Cancel
              </Button>
              <Button
                data-testid="create-button"
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Role'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent data-testid="edit-role-dialog">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Modify role details and permissions
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateRole} data-testid="role-edit-form">
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Role Name</Label>
                <Input
                  data-testid="edit-role-name-input"
                  id="edit-name"
                  placeholder="Enter role name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive mt-1">{formErrors.name}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  data-testid="edit-role-description-input"
                  id="edit-description"
                  placeholder="Enter role description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
                {formErrors.description && (
                  <p className="text-sm text-destructive mt-1">{formErrors.description}</p>
                )}
              </div>
              
              <div>
                <Label>Permissions</Label>
                <div data-testid="edit-permissions-selector" className="space-y-3 mt-2">
                  {availablePermissions.map(permission => (
                    <div key={permission.key} className="flex items-start space-x-3">
                      <Checkbox
                        data-testid={`edit-permission-${permission.key}`}
                        id={`edit-${permission.key}`}
                        checked={formData.permissions.includes(permission.key)}
                        onCheckedChange={(checked) => handlePermissionToggle(permission.key, checked)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor={`edit-${permission.key}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.name}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {formErrors.permissions && (
                  <p className="text-sm text-destructive mt-1">{formErrors.permissions}</p>
                )}
              </div>
            </div>
            
            <DialogFooter data-testid="edit-form-actions" className="mt-6">
              <Button
                data-testid="edit-cancel-button"
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedRole(null);
                  setFormErrors({});
                }}
              >
                Cancel
              </Button>
              <Button
                data-testid="update-button"
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  'Update Role'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent data-testid="delete-role-dialog">
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please confirm role deletion.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRole && (
            <div data-testid="delete-role-content" className="space-y-4">
              <Alert variant={selectedRole.user_count > 0 ? "destructive" : "default"}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription data-testid="delete-warning">
                  Are you sure you want to delete the role "{selectedRole.name}"?
                </AlertDescription>
              </Alert>
              
              {selectedRole.user_count > 0 && (
                <Alert variant="destructive">
                  <X className="h-4 w-4" />
                  <AlertDescription data-testid="users-assigned-warning">
                    This role cannot be deleted because it has {selectedRole.user_count} users assigned to it.
                  </AlertDescription>
                </Alert>
              )}
              
              <div data-testid="delete-role-info" className="bg-muted p-4 rounded-lg">
                <p><strong>Role:</strong> {selectedRole.name}</p>
                <p><strong>Description:</strong> {selectedRole.description}</p>
                <p><strong>Users Assigned:</strong> {selectedRole.user_count}</p>
                <p><strong>Permissions:</strong> {selectedRole.permissions.length} permissions</p>
              </div>
            </div>
          )}
          
          <DialogFooter data-testid="delete-form-actions">
            <Button
              data-testid="delete-cancel-button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedRole(null);
              }}
            >
              Cancel
            </Button>
            <Button
              data-testid="confirm-delete-button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={submitting || (selectedRole && selectedRole.user_count > 0)}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManagement;