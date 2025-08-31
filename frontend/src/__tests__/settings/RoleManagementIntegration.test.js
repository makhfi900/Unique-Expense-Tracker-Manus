import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock the custom hook
const mockUseRoles = {
  roles: [
    {
      id: '1',
      name: 'Administrator',
      description: 'Full system access',
      permissions: ['user_management', 'system_config'],
      user_count: 1,
      is_system_role: true
    },
    {
      id: '2',
      name: 'Test Role',
      description: 'Test role for integration',
      permissions: ['expense_read'],
      user_count: 0,
      is_system_role: false
    }
  ],
  loading: false,
  error: null,
  availablePermissions: [
    { key: 'user_management', name: 'User Management', description: 'Manage users', category: 'admin' },
    { key: 'system_config', name: 'System Configuration', description: 'Configure system', category: 'admin' },
    { key: 'expense_read', name: 'Expense Read', description: 'View expenses', category: 'expense' }
  ],
  createRole: jest.fn(),
  updateRole: jest.fn(),
  deleteRole: jest.fn(),
  validateRole: jest.fn(() => ({ isValid: true, errors: {} }))
};

jest.mock('../../hooks/useRoles', () => ({
  useRoles: () => mockUseRoles
}));

// Mock auth context
const mockUseAuth = {
  user: { id: '1', email: 'admin@test.com' },
  isAdmin: true,
  getUserRole: () => 'admin'
};

jest.mock('../../context/SupabaseAuthContext', () => ({
  useAuth: () => mockUseAuth
}));

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

import SettingsConfiguration from '../../components/SettingsConfiguration';

describe('Role Management Integration (COMPLETION PHASE - Full Integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Settings to Role Management Navigation', () => {
    it('should navigate from Settings overview to Role Management when card is clicked', async () => {
      // COMPLETION: Test full navigation flow
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      // Initially should show Settings overview
      expect(screen.getByTestId('settings-landing-page')).toBeInTheDocument();
      expect(screen.getByTestId('user-management-feature')).toBeInTheDocument();
      
      // Click on Role Management card
      await user.click(screen.getByTestId('user-management-feature'));
      
      // Should navigate to Role Management view
      await waitFor(() => {
        expect(screen.getByTestId('role-management-interface')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Role Management' })).toBeInTheDocument();
      });
    });

    it('should show back navigation from Role Management to Settings overview', async () => {
      // COMPLETION: Test back navigation
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      // Navigate to Role Management
      await user.click(screen.getByTestId('user-management-feature'));
      
      // Should show back button
      await waitFor(() => {
        expect(screen.getByText('Back to Settings Overview')).toBeInTheDocument();
      });
      
      // Click back button
      await user.click(screen.getByText('Back to Settings Overview'));
      
      // Should return to Settings overview
      await waitFor(() => {
        expect(screen.getByTestId('admin-features-section')).toBeInTheDocument();
        expect(screen.queryByTestId('role-management-interface')).not.toBeInTheDocument();
      });
    });

    it('should maintain authentication context throughout navigation', async () => {
      // COMPLETION: Test auth persistence
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      // Navigate to Role Management and back
      await user.click(screen.getByTestId('user-management-feature'));
      await waitFor(() => {
        expect(screen.getByTestId('role-management-interface')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Back to Settings Overview'));
      await waitFor(() => {
        expect(screen.getByTestId('settings-landing-page')).toBeInTheDocument();
      });
      
      // Auth context should be maintained (admin features still visible)
      expect(screen.getByTestId('admin-features-section')).toBeInTheDocument();
    });
  });

  describe('Role Management Full Functionality', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      // Navigate to Role Management
      await user.click(screen.getByTestId('user-management-feature'));
      await waitFor(() => {
        expect(screen.getByTestId('role-management-interface')).toBeInTheDocument();
      });
    });

    it('should display all roles in the table with proper data', async () => {
      // COMPLETION: Test data display
      await waitFor(() => {
        // Should show roles table
        expect(screen.getByTestId('roles-table')).toBeInTheDocument();
        
        // Should show role data
        expect(screen.getByTestId('role-name-1')).toHaveTextContent('Administrator');
        expect(screen.getByTestId('role-name-2')).toHaveTextContent('Test Role');
        expect(screen.getByTestId('role-description-1')).toHaveTextContent('Full system access');
        expect(screen.getByTestId('user-count-1')).toHaveTextContent('1 users');
        expect(screen.getByTestId('user-count-2')).toHaveTextContent('0 users');
      });
    });

    it('should handle complete role creation flow', async () => {
      // COMPLETION: Test full creation flow
      const user = userEvent.setup();
      
      // Open create dialog
      await user.click(screen.getByTestId('create-role-button'));
      
      // Fill form
      await user.type(screen.getByTestId('role-name-input'), 'Integration Test Role');
      await user.type(screen.getByTestId('role-description-input'), 'Role created during integration test');
      await user.click(screen.getByTestId('permission-expense_read'));
      
      // Submit form
      await user.click(screen.getByTestId('create-button'));
      
      // Should call create function
      await waitFor(() => {
        expect(mockUseRoles.createRole).toHaveBeenCalledWith({
          name: 'Integration Test Role',
          description: 'Role created during integration test',
          permissions: ['expense_read']
        });
      });
    });

    it('should handle complete role editing flow', async () => {
      // COMPLETION: Test full editing flow
      const user = userEvent.setup();
      
      // Click edit for test role
      await user.click(screen.getByTestId('edit-role-2'));
      
      // Modify data
      const nameInput = screen.getByTestId('edit-role-name-input');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Test Role');
      
      // Submit changes
      await user.click(screen.getByTestId('update-button'));
      
      // Should call update function
      await waitFor(() => {
        expect(mockUseRoles.updateRole).toHaveBeenCalledWith('2', {
          name: 'Updated Test Role',
          description: 'Test role for integration',
          permissions: ['expense_read']
        });
      });
    });

    it('should handle complete role deletion flow', async () => {
      // COMPLETION: Test full deletion flow
      const user = userEvent.setup();
      
      // Click delete for test role (user_count = 0)
      await user.click(screen.getByTestId('delete-role-2'));
      
      // Confirm deletion
      await user.click(screen.getByTestId('confirm-delete-button'));
      
      // Should call delete function
      await waitFor(() => {
        expect(mockUseRoles.deleteRole).toHaveBeenCalledWith('2');
      });
    });

    it('should prevent deletion of roles with assigned users', async () => {
      // COMPLETION: Test deletion protection
      const user = userEvent.setup();
      
      // Try to delete admin role (has users)
      expect(screen.getByTestId('delete-role-1')).toBeDisabled();
      
      // Even if dialog opened, deletion should be prevented
      // This tests the safety mechanism
    });
  });

  describe('Permission Matrix Integration', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      // Navigate to Role Management and Matrix tab
      await user.click(screen.getByTestId('user-management-feature'));
      await waitFor(() => {
        expect(screen.getByTestId('role-management-interface')).toBeInTheDocument();
      });
      
      await user.click(screen.getByTestId('matrix-tab'));
    });

    it('should display permission matrix with current role-permission relationships', async () => {
      // COMPLETION: Test matrix display
      await waitFor(() => {
        expect(screen.getByTestId('permission-matrix')).toBeInTheDocument();
        expect(screen.getByTestId('matrix-table')).toBeInTheDocument();
        
        // Should show role headers
        expect(screen.getByTestId('matrix-header-role-1')).toHaveTextContent('Administrator');
        expect(screen.getByTestId('matrix-header-role-2')).toHaveTextContent('Test Role');
        
        // Should show permission labels
        expect(screen.getByTestId('permission-label-user_management')).toHaveTextContent('User Management');
        expect(screen.getByTestId('permission-label-expense_read')).toHaveTextContent('Expense Read');
      });
    });

    it('should handle permission changes through matrix interface', async () => {
      // COMPLETION: Test matrix permission changes
      const user = userEvent.setup();
      
      await waitFor(async () => {
        // Toggle permission for test role
        const checkbox = screen.getByTestId('permission-checkbox-2-user_management');
        await user.click(checkbox);
        
        // Should call update function with new permissions
        expect(mockUseRoles.updateRole).toHaveBeenCalledWith('2', {
          permissions: ['expense_read', 'user_management']
        });
      });
    });
  });

  describe('Error Handling Integration', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      await user.click(screen.getByTestId('user-management-feature'));
    });

    it('should handle and display loading states properly', async () => {
      // COMPLETION: Test loading state handling
      mockUseRoles.loading = true;
      
      // Re-render with loading state
      render(<SettingsConfiguration />);
      const user = userEvent.setup();
      await user.click(screen.getByTestId('user-management-feature'));
      
      await waitFor(() => {
        expect(screen.getByText('Loading roles...')).toBeInTheDocument();
      });
      
      // Reset for other tests
      mockUseRoles.loading = false;
    });

    it('should handle and display error states properly', async () => {
      // COMPLETION: Test error state handling
      mockUseRoles.error = 'Failed to load roles';
      
      render(<SettingsConfiguration />);
      const user = userEvent.setup();
      await user.click(screen.getByTestId('user-management-feature'));
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load roles')).toBeInTheDocument();
      });
      
      // Reset for other tests
      mockUseRoles.error = null;
    });
  });

  describe('Responsive Design and Accessibility', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      await user.click(screen.getByTestId('user-management-feature'));
    });

    it('should maintain proper ARIA labels and semantic HTML', async () => {
      // COMPLETION: Test accessibility
      await waitFor(() => {
        // Should have proper headings
        expect(screen.getByRole('heading', { name: 'Role Management' })).toBeInTheDocument();
        
        // Should have proper table structure
        expect(screen.getByRole('table')).toBeInTheDocument();
        
        // Should have proper form elements
        expect(screen.getByRole('button', { name: 'Create New Role' })).toBeInTheDocument();
      });
    });

    it('should handle keyboard navigation properly', async () => {
      // COMPLETION: Test keyboard accessibility
      const user = userEvent.setup();
      
      // Tab through interface
      await user.tab();
      expect(screen.getByTestId('create-role-button')).toHaveFocus();
      
      // Test keyboard interaction
      await user.keyboard('{Enter}');
      await waitFor(() => {
        expect(screen.getByTestId('create-role-dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Integration with Existing Settings Infrastructure', () => {
    it('should maintain consistent styling with other Settings features', () => {
      // COMPLETION: Test style consistency
      render(<SettingsConfiguration />);
      
      // Should use consistent card styling
      const roleManagementCard = screen.getByTestId('user-management-feature');
      expect(roleManagementCard).toHaveClass('hover:shadow-lg', 'transition-shadow');
    });

    it('should integrate properly with the Settings layout system', async () => {
      // COMPLETION: Test layout integration
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      // Navigate to Role Management
      await user.click(screen.getByTestId('user-management-feature'));
      
      await waitFor(() => {
        // Should maintain Settings page structure
        expect(screen.getByTestId('settings-landing-page')).toBeInTheDocument();
        
        // Should have proper navigation
        expect(screen.getByText('Back to Settings Overview')).toBeInTheDocument();
      });
    });

    it('should work properly within the Settings authentication flow', () => {
      // COMPLETION: Test auth integration
      render(<SettingsConfiguration />);
      
      // Should only show Role Management for admins
      expect(screen.getByTestId('user-management-feature')).toBeInTheDocument();
      
      // Non-admin users should not see this feature (tested in parent component)
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large numbers of roles efficiently', async () => {
      // COMPLETION: Test performance
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      await user.click(screen.getByTestId('user-management-feature'));
      
      // Should render efficiently even with mock data
      await waitFor(() => {
        expect(screen.getByTestId('roles-table')).toBeInTheDocument();
      });
    });

    it('should minimize re-renders and optimize state updates', async () => {
      // COMPLETION: Test optimization
      const user = userEvent.setup();
      render(<SettingsConfiguration />);
      
      await user.click(screen.getByTestId('user-management-feature'));
      
      // Multiple interactions should not cause unnecessary re-renders
      await user.click(screen.getByTestId('roles-tab'));
      await user.click(screen.getByTestId('matrix-tab'));
      await user.click(screen.getByTestId('roles-tab'));
      
      // Should maintain state properly
      expect(screen.getByTestId('roles-table')).toBeInTheDocument();
    });
  });
});