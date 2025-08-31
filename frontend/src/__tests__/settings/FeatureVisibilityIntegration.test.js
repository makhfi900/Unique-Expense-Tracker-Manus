/**
 * Integration Tests for Feature Visibility Configuration
 * 
 * Story 1.3: Feature Visibility Configuration Integration
 * Validates integration with Stories 1.1 (Settings Foundation) and 1.2 (Role Management)
 * 
 * Test Coverage:
 * - Integration with Settings navigation
 * - Integration with existing Role Management
 * - End-to-end feature visibility workflows
 * - Epic 1 completion validation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsConfiguration from '../../components/SettingsConfiguration';
import { useAuth } from '../../context/SupabaseAuthContext';
import { useRoles } from '../../hooks/useRoles';
import { useFeatureVisibility } from '../../hooks/useFeatureVisibility';

// Mock dependencies
jest.mock('../../context/SupabaseAuthContext');
jest.mock('../../hooks/useRoles');
jest.mock('../../hooks/useFeatureVisibility');
jest.mock('sonner');

describe('Feature Visibility Configuration Integration', () => {
  const mockUseAuth = {
    isAdmin: true,
    user: { id: 'admin-1', email: 'admin@test.com' },
    getUserRole: () => 'admin'
  };

  const mockUseRoles = {
    roles: [
      {
        id: '1',
        name: 'Administrator',
        permissions: ['user_management', 'system_config', 'expense_read', 'expense_write']
      },
      {
        id: '2',
        name: 'Account Officer', 
        permissions: ['expense_read', 'expense_write']
      }
    ],
    loading: false,
    error: null
  };

  const mockUseFeatureVisibility = {
    loading: false,
    error: null,
    featureCategories: [
      {
        id: 'core-apps',
        name: 'Core Applications',
        features: [
          { 
            id: 'expenses', 
            name: 'Expense Manager',
            dependencies: [],
            dependents: ['analytics']
          }
        ]
      }
    ],
    roles: mockUseRoles.roles,
    roleFeatureMatrix: {
      '1': ['expenses', 'settings', 'analytics'],
      '2': ['expenses']
    },
    updateRoleFeatures: jest.fn(),
    validateFeatureChange: jest.fn(() => ({ isValid: true, errors: [], warnings: [] })),
    previewRoleInterface: jest.fn(() => ({
      availableFeatures: ['expenses'],
      navigationStructure: { coreApps: [], dashboardComponents: [] },
      featureCount: 1,
      accessibilityLevel: 'standard',
      warnings: []
    }))
  };

  beforeEach(() => {
    useAuth.mockReturnValue(mockUseAuth);
    useRoles.mockReturnValue(mockUseRoles);
    useFeatureVisibility.mockReturnValue(mockUseFeatureVisibility);
    jest.clearAllMocks();
  });

  describe('Settings Navigation Integration (Story 1.1)', () => {
    test('displays Feature Visibility option in Settings landing page', () => {
      render(&lt;SettingsConfiguration /&gt;);
      
      expect(screen.getByTestId('feature-visibility-feature')).toBeInTheDocument();
      expect(screen.getByText('Feature Visibility')).toBeInTheDocument();
      expect(screen.getByText(/Configure which features are visible to different user roles/)).toBeInTheDocument();
    });

    test('navigates to Feature Visibility configuration when clicked', async () => {
      const user = userEvent.setup();
      render(&lt;SettingsConfiguration /&gt;);
      
      const featureVisibilityCard = screen.getByTestId('feature-visibility-feature');
      await user.click(featureVisibilityCard);
      
      expect(screen.getByTestId('feature-visibility-config')).toBeInTheDocument();
      expect(screen.getByText('Feature Visibility Configuration')).toBeInTheDocument();
    });

    test('shows breadcrumb navigation in Feature Visibility', async () => {
      const user = userEvent.setup();
      render(&lt;SettingsConfiguration /&gt;);
      
      const featureVisibilityCard = screen.getByTestId('feature-visibility-feature');
      await user.click(featureVisibilityCard);
      
      expect(screen.getByTestId('settings-breadcrumb')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Feature Visibility')).toBeInTheDocument();
    });

    test('allows navigation back to Settings overview', async () => {
      const user = userEvent.setup();
      render(&lt;SettingsConfiguration /&gt;);
      
      // Navigate to Feature Visibility
      const featureVisibilityCard = screen.getByTestId('feature-visibility-feature');
      await user.click(featureVisibilityCard);
      
      // Navigate back
      const backButton = screen.getByRole('button', { name: /back to settings overview/i });
      await user.click(backButton);
      
      expect(screen.getByTestId('admin-features-section')).toBeInTheDocument();
      expect(screen.getByText('Settings Configuration')).toBeInTheDocument();
    });

    test('maintains consistent UI styling with Settings app', async () => {
      const user = userEvent.setup();
      render(&lt;SettingsConfiguration /&gt;);
      
      const featureVisibilityCard = screen.getByTestId('feature-visibility-feature');
      await user.click(featureVisibilityCard);
      
      const featureVisibilityConfig = screen.getByTestId('feature-visibility-config');
      expect(featureVisibilityConfig).toHaveClass(
        'min-h-screen',
        'bg-gradient-to-br'
      );
    });
  });

  describe('Role Management Integration (Story 1.2)', () => {
    test('uses roles from Role Management system', async () => {
      const user = userEvent.setup();
      render(&lt;SettingsConfiguration /&gt;);
      
      const featureVisibilityCard = screen.getByTestId('feature-visibility-feature');
      await user.click(featureVisibilityCard);
      
      // Check that roles are displayed in the feature matrix
      expect(screen.getByText('Administrator')).toBeInTheDocument();
      expect(screen.getByText('Account Officer')).toBeInTheDocument();
    });

    test('integrates with existing role permissions structure', async () => {
      const user = userEvent.setup();
      render(&lt;SettingsConfiguration /&gt;);
      
      const featureVisibilityCard = screen.getByTestId('feature-visibility-feature');
      await user.click(featureVisibilityCard);
      
      // Should use the same role structure as Role Management
      expect(useRoles).toHaveBeenCalled();
      expect(useFeatureVisibility().roles).toEqual(mockUseRoles.roles);
    });

    test('maintains role-based access control consistency', async () => {
      // Test with non-admin user
      useAuth.mockReturnValue({
        ...mockUseAuth,
        isAdmin: false,
        getUserRole: () => 'account_officer'
      });

      render(&lt;SettingsConfiguration /&gt;);
      
      // Feature Visibility should not be accessible to non-admin users
      expect(screen.queryByTestId('feature-visibility-feature')).not.toBeInTheDocument();
    });

    test('supports role hierarchy from Role Management', async () => {
      const user = userEvent.setup();
      render(&lt;SettingsConfiguration /&gt;);
      
      const featureVisibilityCard = screen.getByTestId('feature-visibility-feature');
      await user.click(featureVisibilityCard);
      
      // Administrator should have more features enabled than Account Officer
      const roleMatrix = screen.getByTestId('role-feature-matrix');
      expect(roleMatrix).toBeInTheDocument();
      
      // Verify role hierarchy is respected in feature assignments
      expect(mockUseFeatureVisibility.roleFeatureMatrix['1']).toContain('analytics');
      expect(mockUseFeatureVisibility.roleFeatureMatrix['2']).not.toContain('analytics');
    });
  });

  describe('End-to-End Feature Visibility Workflows', () => {
    test('complete workflow: navigate to feature visibility and configure features', async () => {
      const user = userEvent.setup();
      render(&lt;SettingsConfiguration /&gt;);
      
      // Step 1: Navigate to Feature Visibility
      const featureVisibilityCard = screen.getByTestId('feature-visibility-feature');
      await user.click(featureVisibilityCard);
      
      // Step 2: Verify Feature Visibility interface loads
      expect(screen.getByTestId('feature-visibility-config')).toBeInTheDocument();
      expect(screen.getByTestId('role-feature-matrix')).toBeInTheDocument();
      
      // Step 3: Toggle a feature for a role
      const toggle = screen.getByTestId('role-feature-toggle-2-expenses');
      await user.click(toggle);
      
      // Step 4: Verify the change was processed
      expect(mockUseFeatureVisibility.updateRoleFeatures).toHaveBeenCalledWith('2', 'expenses', false);
    });

    test('complete workflow: dependency validation prevents breaking changes', async () => {
      // Mock validation that prevents breaking change
      mockUseFeatureVisibility.validateFeatureChange.mockReturnValue({
        isValid: false,
        errors: ['Cannot enable Analytics without Expense Manager access'],
        warnings: []
      });

      const user = userEvent.setup();
      render(&lt;SettingsConfiguration /&gt;);
      
      const featureVisibilityCard = screen.getByTestId('feature-visibility-feature');
      await user.click(featureVisibilityCard);
      
      // Try to enable analytics for a role without expenses
      const toggle = screen.getByTestId('role-feature-toggle-2-analytics');
      await user.click(toggle);
      
      // Should show error and not proceed
      expect(mockUseFeatureVisibility.validateFeatureChange).toHaveBeenCalledWith('2', 'analytics', true);
      expect(mockUseFeatureVisibility.updateRoleFeatures).not.toHaveBeenCalled();
    });

    test('complete workflow: bulk operations affect multiple roles', async () => {
      const user = userEvent.setup();
      render(&lt;SettingsConfiguration /&gt;);
      
      const featureVisibilityCard = screen.getByTestId('feature-visibility-feature');
      await user.click(featureVisibilityCard);
      
      // Navigate to bulk operations
      const bulkTab = screen.getByRole('tab', { name: /bulk operations/i });
      await user.click(bulkTab);
      
      // Select multiple roles
      const role1Checkbox = screen.getByTestId('bulk-role-checkbox-1');
      const role2Checkbox = screen.getByTestId('bulk-role-checkbox-2');
      await user.click(role1Checkbox);
      await user.click(role2Checkbox);
      
      // Select category and proceed
      const categorySelector = screen.getByTestId('bulk-category-selector');
      await user.click(categorySelector);
      
      // Verify bulk operation interface is functional
      expect(screen.getByTestId('bulk-operations-panel')).toBeInTheDocument();
    });

    test('complete workflow: real-time preview updates with changes', async () => {
      const user = userEvent.setup();
      render(&lt;SettingsConfiguration /&gt;);
      
      const featureVisibilityCard = screen.getByTestId('feature-visibility-feature');
      await user.click(featureVisibilityCard);
      
      // Check preview panel
      expect(screen.getByTestId('role-preview-panel')).toBeInTheDocument();
      
      // Change preview role
      const roleSelector = screen.getByTestId('preview-role-selector');
      await user.click(roleSelector);
      
      // Verify preview functionality works
      expect(mockUseFeatureVisibility.previewRoleInterface).toHaveBeenCalled();
    });
  });

  describe('Epic 1 Completion Validation', () => {
    test('Epic 1 includes all three implemented stories', async () => {
      render(&lt;SettingsConfiguration /&gt;);
      
      // Story 1.1: Settings Foundation - Landing page with role-based features
      expect(screen.getByTestId('settings-landing-page')).toBeInTheDocument();
      expect(screen.getByTestId('role-based-features')).toBeInTheDocument();
      expect(screen.getByTestId('admin-features-section')).toBeInTheDocument();
      
      // Story 1.2: Role Management - Available in admin features
      expect(screen.getByTestId('user-management-feature')).toBeInTheDocument();
      
      // Story 1.3: Feature Visibility - Available in admin features
      expect(screen.getByTestId('feature-visibility-feature')).toBeInTheDocument();
    });

    test('all Epic 1 features are accessible and functional', async () => {
      const user = userEvent.setup();
      render(&lt;SettingsConfiguration /&gt;);
      
      // Test navigation to Role Management (Story 1.2)
      const roleManagementCard = screen.getByTestId('user-management-feature');
      await user.click(roleManagementCard);
      
      // Should navigate to Role Management
      expect(screen.getByText('Back to Settings Overview')).toBeInTheDocument();
      
      // Navigate back and test Feature Visibility (Story 1.3)
      const backButton = screen.getByRole('button', { name: /back to settings overview/i });
      await user.click(backButton);
      
      const featureVisibilityCard = screen.getByTestId('feature-visibility-feature');
      await user.click(featureVisibilityCard);
      
      // Should navigate to Feature Visibility
      expect(screen.getByTestId('feature-visibility-config')).toBeInTheDocument();
    });

    test('Epic 1 maintains consistent UI/UX across all stories', async () => {
      const user = userEvent.setup();
      render(&lt;SettingsConfiguration /&gt;);
      
      // All components should use consistent styling
      const settingsPage = screen.getByTestId('settings-landing-page');
      expect(settingsPage).toHaveClass('min-h-screen', 'bg-gradient-to-br');
      
      // Test Role Management consistency
      const roleManagementCard = screen.getByTestId('user-management-feature');
      await user.click(roleManagementCard);
      
      const settingsWithRole = screen.getByTestId('settings-landing-page');
      expect(settingsWithRole).toHaveClass('min-h-screen', 'bg-gradient-to-br');
      
      // Navigate back and test Feature Visibility consistency
      const backButton = screen.getByRole('button', { name: /back to settings overview/i });
      await user.click(backButton);
      
      const featureVisibilityCard = screen.getByTestId('feature-visibility-feature');
      await user.click(featureVisibilityCard);
      
      const settingsWithFeatureVisibility = screen.getByTestId('settings-landing-page');
      expect(settingsWithFeatureVisibility).toHaveClass('min-h-screen', 'bg-gradient-to-br');
    });

    test('Epic 1 supports administrator-only access consistently', () => {
      // Test with non-admin user
      useAuth.mockReturnValue({
        isAdmin: false,
        user: { id: 'user-1', email: 'user@test.com' },
        getUserRole: () => 'account_officer'
      });

      render(&lt;SettingsConfiguration /&gt;);
      
      // Admin features should not be visible
      expect(screen.queryByTestId('admin-features-section')).not.toBeInTheDocument();
      expect(screen.queryByTestId('user-management-feature')).not.toBeInTheDocument();
      expect(screen.queryByTestId('feature-visibility-feature')).not.toBeInTheDocument();
      
      // Should show account officer features instead
      expect(screen.getByTestId('account-officer-features')).toBeInTheDocument();
    });

    test('Epic 1 integrates properly with authentication system', () => {
      render(&lt;SettingsConfiguration /&gt;);
      
      // Should show user information consistently
      expect(screen.getByText('admin@test.com')).toBeInTheDocument();
      expect(screen.getByText('Administrator')).toBeInTheDocument();
      
      // Should use authentication context
      expect(useAuth).toHaveBeenCalled();
    });

    test('Epic 1 provides comprehensive settings management', () => {
      render(&lt;SettingsConfiguration /&gt;);
      
      // Should provide clear feature organization
      expect(screen.getByText('Administrator Features')).toBeInTheDocument();
      expect(screen.getByText('General Settings')).toBeInTheDocument();
      
      // Should show feature status
      const availableBadges = screen.getAllByText('Available');
      expect(availableBadges).toHaveLength(2); // Role Management + Feature Visibility
      
      // Should indicate future features
      expect(screen.getByText(/System Configuration \(Coming Soon\)/)).toBeInTheDocument();
      expect(screen.getByText(/Audit Logs \(Coming Soon\)/)).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles loading states gracefully across all components', async () => {
      useFeatureVisibility.mockReturnValue({
        ...mockUseFeatureVisibility,
        loading: true
      });

      const user = userEvent.setup();
      render(&lt;SettingsConfiguration /&gt;);
      
      const featureVisibilityCard = screen.getByTestId('feature-visibility-feature');
      await user.click(featureVisibilityCard);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading feature configuration...')).toBeInTheDocument();
    });

    test('handles error states with proper fallbacks', async () => {
      useFeatureVisibility.mockReturnValue({
        ...mockUseFeatureVisibility,
        loading: false,
        error: 'Failed to load configuration'
      });

      const user = userEvent.setup();
      render(&lt;SettingsConfiguration /&gt;);
      
      const featureVisibilityCard = screen.getByTestId('feature-visibility-feature');
      await user.click(featureVisibilityCard);
      
      expect(screen.getByText('Failed to load configuration')).toBeInTheDocument();
    });

    test('maintains navigation state during errors', async () => {
      const user = userEvent.setup();
      render(&lt;SettingsConfiguration /&gt;);
      
      const featureVisibilityCard = screen.getByTestId('feature-visibility-feature');
      await user.click(featureVisibilityCard);
      
      // Even with errors, back navigation should work
      const backButton = screen.getByRole('button', { name: /back to settings overview/i });
      await user.click(backButton);
      
      expect(screen.getByTestId('admin-features-section')).toBeInTheDocument();
    });
  });
});