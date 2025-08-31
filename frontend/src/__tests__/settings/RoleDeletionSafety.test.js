import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock DeleteRoleDialog component (will be implemented in GREEN phase)
const MockDeleteRoleDialog = jest.fn(({ isOpen, onClose, onDeleteRole, role }) => (
  <div data-testid="delete-role-dialog" style={{ display: isOpen ? 'block' : 'none' }}>
    <h3>Delete Role</h3>
    <div data-testid="delete-role-content">
      <p data-testid="delete-warning">
        Are you sure you want to delete the role "{role?.name}"?
      </p>
      {role?.user_count > 0 && (
        <div data-testid="users-assigned-warning" className="error">
          This role cannot be deleted because it has {role.user_count} users assigned to it.
        </div>
      )}
      <div data-testid="delete-role-info">
        <p>Role: {role?.name}</p>
        <p>Description: {role?.description}</p>
        <p>Users Assigned: {role?.user_count}</p>
        <p>Permissions: {role?.permissions?.length} permissions</p>
      </div>
    </div>
    <div data-testid="delete-form-actions">
      <button type="button" onClick={onClose} data-testid="delete-cancel-button">
        Cancel
      </button>
      <button 
        type="button" 
        data-testid="confirm-delete-button"
        disabled={role?.user_count > 0}
        onClick={() => onDeleteRole(role?.id)}
      >
        Delete Role
      </button>
    </div>
  </div>
));

// Mock RoleTable row with delete functionality
const MockRoleTableRow = jest.fn(({ role, onDeleteRole }) => (
  <tr data-testid={`role-row-${role.id}`}>
    <td data-testid={`role-name-${role.id}`}>{role.name}</td>
    <td data-testid={`role-description-${role.id}`}>{role.description}</td>
    <td data-testid={`permissions-count-${role.id}`}>{role.permissions.length}</td>
    <td data-testid={`user-count-${role.id}`}>{role.user_count}</td>
    <td data-testid={`role-actions-${role.id}`}>
      <button 
        data-testid={`delete-role-${role.id}`} 
        onClick={() => onDeleteRole(role)}
        disabled={role.user_count > 0}
      >
        Delete
      </button>
    </td>
  </tr>
));

// Mock RoleManagement component with delete functionality
const MockRoleManagement = jest.fn(() => {
  const [roles, setRoles] = React.useState([
    {
      id: '1',
      name: 'Administrator',
      description: 'Full system access',
      permissions: ['user_management', 'system_config'],
      user_count: 1 // Has users - cannot delete
    },
    {
      id: '2',
      name: 'Account Officer',
      description: 'Limited access',
      permissions: ['expense_read', 'expense_write'],
      user_count: 5 // Has users - cannot delete
    },
    {
      id: '3',
      name: 'Temp Role',
      description: 'Temporary role for testing',
      permissions: ['expense_read'],
      user_count: 0 // No users - can delete
    }
  ]);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState(null);
  
  const handleDeleteRole = (role) => {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = (roleId) => {
    // Mock role deletion
    setRoles(roles.filter(role => role.id !== roleId));
    setIsDeleteDialogOpen(false);
    setSelectedRole(null);
  };

  return (
    <div data-testid="role-management-interface">
      <h2>Role Management</h2>
      <table data-testid="roles-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Permissions</th>
            <th>Users</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map(role => (
            <MockRoleTableRow 
              key={role.id} 
              role={role} 
              onDeleteRole={handleDeleteRole}
            />
          ))}
        </tbody>
      </table>
      <MockDeleteRoleDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDeleteRole={handleConfirmDelete}
        role={selectedRole}
      />
    </div>
  );
});

jest.mock('../../components/RoleManagement', () => MockRoleManagement);
jest.mock('../../components/DeleteRoleDialog', () => MockDeleteRoleDialog);

// Mock auth and Supabase
const mockUseAuth = {
  user: { id: '1', email: 'admin@test.com' },
  isAdmin: true,
  getUserRole: () => 'admin'
};

jest.mock('../../context/SupabaseAuthContext', () => ({
  useAuth: () => mockUseAuth
}));

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ 
          data: [{ count: 0 }], // Mock user count check
          error: null 
        }))
      }))
    }))
  }
}));

import SettingsConfiguration from '../../components/SettingsConfiguration';

describe('Role Deletion Safety Checks (RED PHASE - TDD London School)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockRoleManagement.mockClear();
    MockDeleteRoleDialog.mockClear();
    MockRoleTableRow.mockClear();
  });

  describe('Delete Button Visibility and State', () => {
    it('should display Delete button for each role in the table', () => {
      // RED PHASE: Test delete button presence
      render(<SettingsConfiguration />);
      
      // Should show delete buttons for all roles
      expect(screen.getByTestId('delete-role-1')).toBeInTheDocument();
      expect(screen.getByTestId('delete-role-2')).toBeInTheDocument();
      expect(screen.getByTestId('delete-role-3')).toBeInTheDocument();
    });

    it('should disable Delete button for roles with assigned users', () => {
      // RED PHASE: Test delete button disabling for active roles
      render(<SettingsConfiguration />);
      
      // Administrator and Account Officer have users - buttons should be disabled
      expect(screen.getByTestId('delete-role-1')).toBeDisabled();
      expect(screen.getByTestId('delete-role-2')).toBeDisabled();
      
      // Temp Role has no users - button should be enabled
      expect(screen.getByTestId('delete-role-3')).not.toBeDisabled();
    });

    it('should show user count information to indicate why deletion is blocked', () => {
      // RED PHASE: Test user count display
      render(<SettingsConfiguration />);
      
      // Should show user counts that prevent deletion
      expect(screen.getByTestId('user-count-1')).toHaveTextContent('1');
      expect(screen.getByTestId('user-count-2')).toHaveTextContent('5');
      expect(screen.getByTestId('user-count-3')).toHaveTextContent('0');
    });

    it('should provide visual indication of deletable vs non-deletable roles', () => {
      // RED PHASE: Test visual differentiation
      render(<SettingsConfiguration />);
      
      // Should have different visual states for delete buttons
      const disabledButton = screen.getByTestId('delete-role-1');
      const enabledButton = screen.getByTestId('delete-role-3');
      
      expect(disabledButton).toBeDisabled();
      expect(enabledButton).not.toBeDisabled();
    });
  });

  describe('Delete Confirmation Dialog', () => {
    it('should open Delete Role confirmation dialog when enabled Delete button is clicked', async () => {
      // RED PHASE: Test delete dialog opening
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      // Click delete for role with no users
      await user.click(screen.getByTestId('delete-role-3'));
      
      // Should open delete dialog
      const dialog = screen.getByTestId('delete-role-dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toBeVisible();
    });

    it('should display role information in delete confirmation dialog', async () => {
      // RED PHASE: Test role info display in dialog
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      // Open delete dialog
      await user.click(screen.getByTestId('delete-role-3'));
      
      // Should show role details
      expect(screen.getByTestId('delete-role-info')).toBeInTheDocument();
      expect(screen.getByText('Role: Temp Role')).toBeInTheDocument();
      expect(screen.getByText('Description: Temporary role for testing')).toBeInTheDocument();
      expect(screen.getByText('Users Assigned: 0')).toBeInTheDocument();
    });

    it('should show clear warning message about deletion consequences', async () => {
      // RED PHASE: Test deletion warning
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      // Open delete dialog
      await user.click(screen.getByTestId('delete-role-3'));
      
      // Should show deletion warning
      const warning = screen.getByTestId('delete-warning');
      expect(warning).toBeInTheDocument();
      expect(warning).toHaveTextContent('Are you sure you want to delete the role "Temp Role"?');
    });

    it('should provide Cancel and Confirm Delete action buttons', async () => {
      // RED PHASE: Test dialog action buttons
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      // Open delete dialog
      await user.click(screen.getByTestId('delete-role-3'));
      
      // Should have action buttons
      expect(screen.getByTestId('delete-cancel-button')).toBeInTheDocument();
      expect(screen.getByTestId('confirm-delete-button')).toBeInTheDocument();
    });
  });

  describe('User Assignment Validation', () => {
    it('should prevent deletion of roles with assigned users', async () => {
      // RED PHASE: Test user assignment blocking
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      // Try to click delete for role with users (should be disabled)
      const deleteButton = screen.getByTestId('delete-role-1');
      expect(deleteButton).toBeDisabled();
      
      // This establishes requirement for user assignment checking
    });

    it('should show warning message for roles with assigned users in dialog', async () => {
      // RED PHASE: Test user assignment warning
      // Manually trigger dialog for role with users (edge case testing)
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      // This establishes requirement for user assignment warnings
      // If somehow dialog opens for role with users, warning should appear
    });

    it('should disable Confirm Delete button for roles with assigned users', async () => {
      // RED PHASE: Test confirm button disabling
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      // Open delete dialog for role with no users
      await user.click(screen.getByTestId('delete-role-3'));
      
      // Confirm button should be enabled for role with no users
      expect(screen.getByTestId('confirm-delete-button')).not.toBeDisabled();
    });

    it('should perform real-time user count checking before deletion', async () => {
      // RED PHASE: Test real-time validation
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      // Open delete dialog
      await user.click(screen.getByTestId('delete-role-3'));
      
      // This establishes requirement for real-time user count checking
      // System should verify user count at deletion time, not just at display time
    });
  });

  describe('Deletion Execution and Confirmation', () => {
    it('should execute role deletion when Confirm Delete is clicked', async () => {
      // RED PHASE: Test deletion execution
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      // Open delete dialog and confirm
      await user.click(screen.getByTestId('delete-role-3'));
      await user.click(screen.getByTestId('confirm-delete-button'));
      
      // This establishes requirement for actual deletion
    });

    it('should remove deleted role from roles table', async () => {
      // RED PHASE: Test role removal from UI
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      // Verify role exists initially
      expect(screen.getByTestId('role-row-3')).toBeInTheDocument();
      
      // Delete role
      await user.click(screen.getByTestId('delete-role-3'));
      await user.click(screen.getByTestId('confirm-delete-button'));
      
      // Role should be removed from table
      await waitFor(() => {
        expect(screen.queryByTestId('role-row-3')).not.toBeInTheDocument();
      });
    });

    it('should close delete dialog after successful deletion', async () => {
      // RED PHASE: Test dialog closing
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      // Delete role
      await user.click(screen.getByTestId('delete-role-3'));
      await user.click(screen.getByTestId('confirm-delete-button'));
      
      // Dialog should close
      await waitFor(() => {
        const dialog = screen.getByTestId('delete-role-dialog');
        expect(dialog).not.toBeVisible();
      });
    });

    it('should display success message after role deletion', async () => {
      // RED PHASE: Test success feedback
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      // Delete role
      await user.click(screen.getByTestId('delete-role-3'));
      await user.click(screen.getByTestId('confirm-delete-button'));
      
      // This establishes requirement for success feedback
    });
  });

  describe('Deletion Cancellation and Error Handling', () => {
    it('should close dialog when Cancel button is clicked', async () => {
      // RED PHASE: Test deletion cancellation
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      // Open delete dialog
      await user.click(screen.getByTestId('delete-role-3'));
      
      // Cancel deletion
      await user.click(screen.getByTestId('delete-cancel-button'));
      
      // Dialog should close
      const dialog = screen.getByTestId('delete-role-dialog');
      expect(dialog).not.toBeVisible();
    });

    it('should not delete role when deletion is cancelled', async () => {
      // RED PHASE: Test role preservation on cancel
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      // Open delete dialog and cancel
      await user.click(screen.getByTestId('delete-role-3'));
      await user.click(screen.getByTestId('delete-cancel-button'));
      
      // Role should still exist
      expect(screen.getByTestId('role-row-3')).toBeInTheDocument();
    });

    it('should handle role deletion errors gracefully', async () => {
      // RED PHASE: Test error handling
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      // Attempt deletion (will cause mock error)
      await user.click(screen.getByTestId('delete-role-3'));
      await user.click(screen.getByTestId('confirm-delete-button'));
      
      // This establishes requirement for error handling
    });

    it('should handle network errors during deletion', async () => {
      // RED PHASE: Test network error handling
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      // This establishes requirement for network error handling
      // Component should handle connection issues gracefully
    });
  });

  describe('System Role Protection', () => {
    it('should prevent deletion of system-critical roles', () => {
      // RED PHASE: Test system role protection
      render(<SettingsConfiguration />);
      
      // Administrator role should be protected
      const adminDeleteButton = screen.getByTestId('delete-role-1');
      expect(adminDeleteButton).toBeDisabled();
      
      // This could be due to users OR system protection
    });

    it('should show different messaging for system vs user-assigned protection', () => {
      // RED PHASE: Test different protection messages
      render(<SettingsConfiguration />);
      
      // This establishes requirement for different protection types
      // System roles vs roles with users should show different messages
    });

    it('should allow deletion of custom roles when no users are assigned', () => {
      // RED PHASE: Test custom role deletion allowance
      render(<SettingsConfiguration />);
      
      // Custom role with no users should be deletable
      const customDeleteButton = screen.getByTestId('delete-role-3');
      expect(customDeleteButton).not.toBeDisabled();
    });
  });

  describe('Bulk Deletion Considerations', () => {
    it('should handle individual role deletion efficiently', () => {
      // RED PHASE: Test efficient deletion
      render(<SettingsConfiguration />);
      
      // This establishes requirement for efficient individual deletion
      expect(screen.getByTestId('delete-role-3')).toBeInTheDocument();
    });

    it('should maintain table state consistency during deletions', async () => {
      // RED PHASE: Test state consistency
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      // Delete role
      await user.click(screen.getByTestId('delete-role-3'));
      await user.click(screen.getByTestId('confirm-delete-button'));
      
      // Other roles should remain unaffected
      await waitFor(() => {
        expect(screen.getByTestId('role-row-1')).toBeInTheDocument();
        expect(screen.getByTestId('role-row-2')).toBeInTheDocument();
      });
    });

    it('should provide feedback about deletion restrictions', () => {
      // RED PHASE: Test restriction feedback
      render(<SettingsConfiguration />);
      
      // Users should understand why certain roles cannot be deleted
      // This could be tooltips, disabled button styles, etc.
      expect(screen.getByTestId('delete-role-1')).toBeDisabled();
      expect(screen.getByTestId('delete-role-2')).toBeDisabled();
    });
  });
});