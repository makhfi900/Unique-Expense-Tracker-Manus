/**
 * Tests for Feature Visibility Configuration Component
 * 
 * Story 1.3: Feature Visibility Configuration
 * TDD RED PHASE: These tests should initially FAIL
 * 
 * Test Coverage:
 * - Component rendering and basic structure
 * - Feature category display and organization
 * - Feature dependency matrix display
 * - Role-based feature visibility toggles
 * - Real-time preview functionality
 * - Bulk operations interface
 * - Validation prevents breaking core functionality
 * - Changes apply immediately with notifications
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import FeatureVisibilityConfiguration from '../../components/settings/FeatureVisibilityConfiguration';
import { useAuth } from '../../context/SupabaseAuthContext';
import { useFeatureVisibility } from '../../hooks/useFeatureVisibility';

// Mock dependencies
jest.mock('../../context/SupabaseAuthContext');
jest.mock('../../hooks/useFeatureVisibility');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  }
}));

describe('FeatureVisibilityConfiguration Component', () => {
  const mockUseAuth = {
    isAdmin: true,
    user: { id: 'admin-1', email: 'admin@test.com' }
  };

  const mockRoles = [
    {
      id: '1',
      name: 'Administrator',
      permissions: ['user_management', 'system_config', 'expense_read', 'expense_write', 'report_access']
    },
    {
      id: '2', 
      name: 'Account Officer',
      permissions: ['expense_read', 'expense_write']
    },
    {
      id: '3',
      name: 'Viewer',
      permissions: ['expense_read']
    }
  ];

  const mockFeatureCategories = [
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
          dependents: ['analytics']
        },
        { 
          id: 'settings', 
          name: 'Settings', 
          description: 'System configuration and user management',
          dependencies: [],
          dependents: []
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
    }
  ];

  const mockUseFeatureVisibility = {
    featureCategories: mockFeatureCategories,
    roles: mockRoles,
    roleFeatureMatrix: {
      '1': ['expenses', 'settings', 'analytics', 'charts'],
      '2': ['expenses', 'analytics', 'charts'], 
      '3': ['expenses']
    },
    loading: false,
    error: null,
    updateRoleFeatures: jest.fn(),
    bulkUpdateFeatures: jest.fn(),
    validateFeatureChange: jest.fn(),
    previewRoleInterface: jest.fn()
  };

  beforeEach(() => {
    useAuth.mockReturnValue(mockUseAuth);
    useFeatureVisibility.mockReturnValue(mockUseFeatureVisibility);
    jest.clearAllMocks();
  });

  describe('Component Structure and Rendering', () => {
    test('renders feature visibility configuration interface', () => {
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      expect(screen.getByTestId('feature-visibility-config')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /feature visibility configuration/i })).toBeInTheDocument();
    });

    test('displays feature categories with proper organization', () => {
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      expect(screen.getByTestId('feature-categories')).toBeInTheDocument();
      expect(screen.getByText('Core Applications')).toBeInTheDocument();
      expect(screen.getByText('Dashboard Components')).toBeInTheDocument();
    });

    test('shows feature dependency relationships', () => {
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      const dependencyMatrix = screen.getByTestId('feature-dependency-matrix');
      expect(dependencyMatrix).toBeInTheDocument();
      
      // Analytics should show dependency on Expenses
      const analyticsRow = within(dependencyMatrix).getByTestId('feature-analytics');
      expect(within(analyticsRow).getByText('expenses')).toBeInTheDocument();
    });

    test('displays role-based feature matrix', () => {
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      const roleMatrix = screen.getByTestId('role-feature-matrix');
      expect(roleMatrix).toBeInTheDocument();
      
      // Should show all roles as columns
      expect(within(roleMatrix).getByText('Administrator')).toBeInTheDocument();
      expect(within(roleMatrix).getByText('Account Officer')).toBeInTheDocument();
      expect(within(roleMatrix).getByText('Viewer')).toBeInTheDocument();
    });
  });

  describe('Feature Dependency Matrix', () => {
    test('shows feature dependencies correctly', () => {
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      const dependencyMatrix = screen.getByTestId('feature-dependency-matrix');
      
      // Analytics depends on Expenses
      const analyticsItem = within(dependencyMatrix).getByTestId('dependency-analytics-expenses');
      expect(analyticsItem).toBeInTheDocument();
      expect(within(analyticsItem).getByLabelText(/analytics depends on expenses/i)).toBeInTheDocument();
    });

    test('highlights dependent features when hovering', async () => {
      const user = userEvent.setup();
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      const expenseFeature = screen.getByTestId('feature-item-expenses');
      await user.hover(expenseFeature);
      
      // Dependents should be highlighted
      expect(screen.getByTestId('feature-item-analytics')).toHaveClass('dependency-highlight');
    });

    test('shows dependency direction with visual indicators', () => {
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      const dependencyArrow = screen.getByTestId('dependency-arrow-expenses-analytics');
      expect(dependencyArrow).toBeInTheDocument();
      expect(dependencyArrow).toHaveClass('dependency-arrow');
    });
  });

  describe('Role-Based Feature Visibility', () => {
    test('displays feature toggle switches for each role', () => {
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      // Administrator should have all features enabled
      const adminExpenseToggle = screen.getByTestId('role-feature-toggle-1-expenses');
      expect(adminExpenseToggle).toBeChecked();
      
      // Viewer should only have expense reading enabled
      const viewerAnalyticsToggle = screen.getByTestId('role-feature-toggle-3-analytics');
      expect(viewerAnalyticsToggle).not.toBeChecked();
    });

    test('allows toggling feature visibility for roles', async () => {
      const user = userEvent.setup();
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      const toggle = screen.getByTestId('role-feature-toggle-2-analytics');
      await user.click(toggle);
      
      expect(mockUseFeatureVisibility.updateRoleFeatures).toHaveBeenCalledWith(
        '2', // Account Officer role ID
        'analytics',
        true // Enable analytics for Account Officer
      );
    });

    test('validates dependency constraints when toggling', async () => {
      mockUseFeatureVisibility.validateFeatureChange.mockReturnValue({
        isValid: false,
        errors: ['Cannot enable Analytics without Expense Manager access'],
        warnings: []
      });

      const user = userEvent.setup();
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      const toggle = screen.getByTestId('role-feature-toggle-3-analytics');
      await user.click(toggle);
      
      expect(screen.getByText('Cannot enable Analytics without Expense Manager access')).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalled();
    });

    test('shows warning for dependency breaking changes', async () => {
      mockUseFeatureVisibility.validateFeatureChange.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: ['Disabling Expense Manager will also disable Analytics dashboard']
      });

      const user = userEvent.setup();
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      const toggle = screen.getByTestId('role-feature-toggle-2-expenses');
      await user.click(toggle);
      
      expect(screen.getByText(/disabling expense manager will also disable analytics/i)).toBeInTheDocument();
    });
  });

  describe('Real-time Preview Functionality', () => {
    test('displays role interface preview panel', () => {
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      expect(screen.getByTestId('role-preview-panel')).toBeInTheDocument();
      expect(screen.getByText('Interface Preview')).toBeInTheDocument();
    });

    test('updates preview when role selection changes', async () => {
      const user = userEvent.setup();
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      const roleSelector = screen.getByTestId('preview-role-selector');
      await user.selectOptions(roleSelector, '2'); // Account Officer
      
      expect(mockUseFeatureVisibility.previewRoleInterface).toHaveBeenCalledWith('2');
    });

    test('shows live preview of changes before applying', async () => {
      const user = userEvent.setup();
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      const toggle = screen.getByTestId('role-feature-toggle-3-analytics');
      await user.click(toggle);
      
      // Preview should update immediately
      const previewPanel = screen.getByTestId('role-preview-panel');
      expect(within(previewPanel).getByText('Analytics Dashboard')).toBeInTheDocument();
    });

    test('displays feature count and accessibility info in preview', () => {
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      const previewPanel = screen.getByTestId('role-preview-panel');
      expect(within(previewPanel).getByTestId('feature-count')).toBeInTheDocument();
      expect(within(previewPanel).getByTestId('accessibility-summary')).toBeInTheDocument();
    });
  });

  describe('Bulk Operations Interface', () => {
    test('displays bulk operation controls', () => {
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      expect(screen.getByTestId('bulk-operations-panel')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /bulk enable/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /bulk disable/i })).toBeInTheDocument();
    });

    test('allows selecting feature category for bulk operations', async () => {
      const user = userEvent.setup();
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      const categorySelector = screen.getByTestId('bulk-category-selector');
      await user.selectOptions(categorySelector, 'dashboard-components');
      
      expect(screen.getByDisplayValue('dashboard-components')).toBeInTheDocument();
    });

    test('enables bulk feature category for selected roles', async () => {
      const user = userEvent.setup();
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      // Select multiple roles
      const role1Checkbox = screen.getByTestId('bulk-role-checkbox-2');
      const role2Checkbox = screen.getByTestId('bulk-role-checkbox-3');
      await user.click(role1Checkbox);
      await user.click(role2Checkbox);
      
      // Select category and apply
      const categorySelector = screen.getByTestId('bulk-category-selector');
      await user.selectOptions(categorySelector, 'dashboard-components');
      
      const bulkEnableBtn = screen.getByRole('button', { name: /bulk enable/i });
      await user.click(bulkEnableBtn);
      
      expect(mockUseFeatureVisibility.bulkUpdateFeatures).toHaveBeenCalledWith({
        roleIds: ['2', '3'],
        categoryId: 'dashboard-components',
        action: 'enable'
      });
    });

    test('validates bulk operations before applying', async () => {
      mockUseFeatureVisibility.validateFeatureChange.mockReturnValue({
        isValid: false,
        errors: ['Cannot disable core features for all users'],
        warnings: []
      });

      const user = userEvent.setup();
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      const bulkDisableBtn = screen.getByRole('button', { name: /bulk disable/i });
      await user.click(bulkDisableBtn);
      
      expect(screen.getByText('Cannot disable core features for all users')).toBeInTheDocument();
    });
  });

  describe('Validation and Safety Checks', () => {
    test('prevents disabling core functionality', async () => {
      mockUseFeatureVisibility.validateFeatureChange.mockReturnValue({
        isValid: false,
        errors: ['Cannot disable core expense functionality'],
        warnings: []
      });

      const user = userEvent.setup();
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      const coreFeatureToggle = screen.getByTestId('role-feature-toggle-1-expenses');
      await user.click(coreFeatureToggle);
      
      expect(mockUseFeatureVisibility.validateFeatureChange).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Cannot disable core expense functionality');
    });

    test('shows confirmation dialog for breaking changes', async () => {
      mockUseFeatureVisibility.validateFeatureChange.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: ['This will affect 5 users'],
        requiresConfirmation: true
      });

      const user = userEvent.setup();
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      const toggle = screen.getByTestId('role-feature-toggle-2-expenses');
      await user.click(toggle);
      
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
      expect(screen.getByText('This will affect 5 users')).toBeInTheDocument();
    });

    test('validates feature dependencies are maintained', async () => {
      const user = userEvent.setup();
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      // Try to disable expenses while analytics is enabled
      const expenseToggle = screen.getByTestId('role-feature-toggle-2-expenses');
      await user.click(expenseToggle);
      
      expect(mockUseFeatureVisibility.validateFeatureChange).toHaveBeenCalledWith(
        '2',
        'expenses',
        false,
        expect.objectContaining({
          checkDependencies: true
        })
      );
    });
  });

  describe('Immediate Application and Notifications', () => {
    test('applies changes immediately after confirmation', async () => {
      const user = userEvent.setup();
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      const toggle = screen.getByTestId('role-feature-toggle-2-analytics');
      await user.click(toggle);
      
      await waitFor(() => {
        expect(mockUseFeatureVisibility.updateRoleFeatures).toHaveBeenCalled();
      });
    });

    test('shows success notification when changes are applied', async () => {
      mockUseFeatureVisibility.updateRoleFeatures.mockResolvedValue({
        success: true,
        affectedUsers: 3
      });

      const user = userEvent.setup();
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      const toggle = screen.getByTestId('role-feature-toggle-2-analytics');
      await user.click(toggle);
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining('Feature visibility updated')
        );
      });
    });

    test('displays user notification about interface changes', async () => {
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      expect(screen.getByTestId('user-notification-banner')).toBeInTheDocument();
      expect(screen.getByText(/changes apply immediately/i)).toBeInTheDocument();
    });

    test('shows loading state during feature updates', async () => {
      mockUseFeatureVisibility.updateRoleFeatures.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const user = userEvent.setup();
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      const toggle = screen.getByTestId('role-feature-toggle-2-analytics');
      await user.click(toggle);
      
      expect(screen.getByTestId('update-loading-indicator')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('displays error message when feature update fails', async () => {
      mockUseFeatureVisibility.updateRoleFeatures.mockRejectedValue(
        new Error('Network error')
      );

      const user = userEvent.setup();
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      const toggle = screen.getByTestId('role-feature-toggle-2-analytics');
      await user.click(toggle);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to update feature visibility')
        );
      });
    });

    test('handles empty roles list gracefully', () => {
      useFeatureVisibility.mockReturnValue({
        ...mockUseFeatureVisibility,
        roles: []
      });

      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      expect(screen.getByText(/no roles configured/i)).toBeInTheDocument();
    });

    test('shows loading state while fetching data', () => {
      useFeatureVisibility.mockReturnValue({
        ...mockUseFeatureVisibility,
        loading: true
      });

      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    test('restricts access to non-admin users', () => {
      useAuth.mockReturnValue({
        ...mockUseAuth,
        isAdmin: false
      });

      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      expect(screen.queryByTestId('feature-visibility-config')).not.toBeInTheDocument();
    });
  });

  describe('Integration with Existing Settings', () => {
    test('integrates with Settings navigation structure', () => {
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      expect(screen.getByTestId('settings-breadcrumb')).toBeInTheDocument();
      expect(screen.getByText(/settings/i)).toBeInTheDocument();
      expect(screen.getByText(/feature visibility/i)).toBeInTheDocument();
    });

    test('maintains consistent UI with existing Settings components', () => {
      render(&lt;FeatureVisibilityConfiguration /&gt;);
      
      // Should use same shadcn/ui components as other Settings pages
      expect(screen.getByTestId('feature-visibility-config')).toHaveClass(
        'min-h-screen',
        'bg-gradient-to-br'
      );
    });
  });
});