import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/SupabaseAuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { 
  Plus, 
  Edit, 
  UserCheck, 
  UserX,
  Users,
  Mail,
  Calendar,
  Loader2
} from 'lucide-react';

// UserForm component extracted outside to prevent recreation on every render
const UserForm = React.memo(({ 
  formData, 
  setFormData, 
  handleSubmit, 
  formLoading, 
  formError, 
  formSuccess, 
  editingUser,
  onCancel
}) => {
  // Use useCallback to prevent function recreation on every render
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, [setFormData]);

  const handleEmailChange = useCallback((e) => {
    handleInputChange('email', e.target.value);
  }, [handleInputChange]);

  const handleFullNameChange = useCallback((e) => {
    handleInputChange('full_name', e.target.value);
  }, [handleInputChange]);

  const handlePasswordChange = useCallback((e) => {
    handleInputChange('password', e.target.value);
  }, [handleInputChange]);

  const handleRoleChange = useCallback((value) => {
    handleInputChange('role', value);
  }, [handleInputChange]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <Alert variant="destructive">
          <AlertDescription id="error-message" role="alert">
            {formError}
          </AlertDescription>
        </Alert>
      )}

      {formSuccess && (
        <Alert>
          <AlertDescription>{formSuccess}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          placeholder="user@example.com"
          value={formData.email}
          onChange={handleEmailChange}
          required
          disabled={formLoading || editingUser} // Disable email editing for existing users
          aria-describedby={formError ? "error-message" : undefined}
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name *</Label>
        <Input
          id="full_name"
          type="text"
          placeholder="Enter full name"
          value={formData.full_name}
          onChange={handleFullNameChange}
          required
          disabled={formLoading}
          aria-describedby={formError ? "error-message" : undefined}
          autoComplete="name"
        />
      </div>

      {!editingUser && (
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter password (minimum 6 characters)"
            value={formData.password}
            onChange={handlePasswordChange}
            required
            disabled={formLoading}
            aria-describedby={formError ? "error-message" : undefined}
            autoComplete="new-password"
            minLength="6"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="role">Role *</Label>
        <Select 
          value={formData.role} 
          onValueChange={handleRoleChange}
          disabled={formLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrator</SelectItem>
            <SelectItem value="account_officer">Account Officer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={formLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={formLoading}>
          {formLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {editingUser ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Users className="h-4 w-4 mr-2" />
              {editingUser ? 'Update User' : 'Create User'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
});

// Add display name for debugging purposes
UserForm.displayName = 'UserForm';

const UserManager = () => {
  const { apiCall, register, isAdmin, getUserRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'account_officer',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  // Admin authorization check
  useEffect(() => {
    if (!isAdmin) {
      setError('Access denied: Admin privileges required for user management');
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiCall('/users');
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: 'account_officer',
    });
    setFormError('');
    setFormSuccess('');
  };

  const handleCreate = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const handleEdit = (user) => {
    setFormData({
      email: user.email,
      password: '', // Don't populate password for editing
      full_name: user.full_name,
      role: user.role,
    });
    setEditingUser(user);
    setFormError('');
    setFormSuccess('');
    setShowEditDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    try {
      // Enhanced validation
      if (!formData.email.trim()) {
        throw new Error('Email is required');
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        throw new Error('Please enter a valid email address');
      }

      if (!formData.full_name.trim()) {
        throw new Error('Full name is required');
      }

      // Full name validation - minimum 2 characters
      if (formData.full_name.trim().length < 2) {
        throw new Error('Full name must be at least 2 characters long');
      }

      if (!editingUser) {
        if (!formData.password.trim()) {
          throw new Error('Password is required for new users');
        }

        // Password strength validation
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }
      }

      // Role validation
      if (!formData.role || !['admin', 'account_officer'].includes(formData.role)) {
        throw new Error('Please select a valid role');
      }

      if (editingUser) {
        // Update existing user
        const updateData = {
          full_name: formData.full_name,
          role: formData.role,
        };

        await apiCall(`/users/${editingUser.id}`, {
          method: 'PUT',
          body: updateData,
        });

        setFormSuccess('User updated successfully!');
      } else {
        // Create new user via register function
        const result = await register(formData);
        
        if (!result.success) {
          throw new Error(result.error);
        }

        setFormSuccess('User created successfully!');
      }
      
      // Refresh users list
      await fetchUsers();

      // Close dialog after a short delay
      setTimeout(() => {
        setShowCreateDialog(false);
        setShowEditDialog(false);
        setEditingUser(null);
        resetForm();
      }, 1000);

    } catch (err) {
      // Handle different types of errors with user-friendly messages
      let errorMessage = err.message;
      
      if (err.message.includes('already registered') || err.message.includes('already exists')) {
        errorMessage = 'This email address is already registered. Please use a different email.';
      } else if (err.message.includes('authentication') || err.message.includes('Unauthorized')) {
        errorMessage = 'You do not have permission to create users. Please contact an administrator.';
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      }
      
      setFormError(errorMessage);
      
      // Log the original error for debugging
      console.error('User creation/update error:', {
        originalError: err,
        userFriendlyMessage: errorMessage,
        formData: { ...formData, password: '[REDACTED]' }
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await apiCall(`/users/${userId}`, {
        method: 'PUT',
        body: { is_active: !currentStatus },
      });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  // Use useCallback for cancel handler to prevent function recreation
  const handleCancel = useCallback(() => {
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setEditingUser(null);
    resetForm();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show access denied message for non-admin users
  if (!isAdmin) {
    return (
      <div className="flex justify-center items-center h-64">
        <Alert variant="destructive">
          <AlertDescription>
            Access denied: Administrator privileges required to manage users.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Users</h3>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the expense tracking system.
              </DialogDescription>
            </DialogHeader>
            <UserForm 
              formData={formData}
              setFormData={setFormData}
              handleSubmit={handleSubmit}
              formLoading={formLoading}
              formError={formError}
              formSuccess={formSuccess}
              editingUser={editingUser}
              onCancel={handleCancel}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">
                Create your first user to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">{user.full_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-gray-400 mr-2" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? 'Administrator' : 'Account Officer'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'destructive'}>
                          {user.is_active ? (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          {formatDate(user.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(user.id, user.is_active)}
                          >
                            {user.is_active ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
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

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update the user details below.
            </DialogDescription>
          </DialogHeader>
          <UserForm 
            formData={formData}
            setFormData={setFormData}
            handleSubmit={handleSubmit}
            formLoading={formLoading}
            formError={formError}
            formSuccess={formSuccess}
            editingUser={editingUser}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManager;

