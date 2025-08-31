/**
 * Tests for useFeatureVisibility Hook
 * 
 * Story 1.3: Feature Visibility Configuration
 * TDD RED PHASE: These tests should initially FAIL
 * 
 * Test Coverage:
 * - Feature categories and structure management
 * - Role-feature matrix operations
 * - Feature dependency validation
 * - Bulk operations logic
 * - Real-time preview generation
 * - Integration with Supabase
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useFeatureVisibility } from '../../hooks/useFeatureVisibility';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/SupabaseAuthContext';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  }
}));

jest.mock('../../context/SupabaseAuthContext');
jest.mock('sonner');

describe('useFeatureVisibility Hook', () => {
  const mockAuth = {
    user: { id: 'admin-1' },
    isAdmin: true
  };

  const mockFeatureCategories = [
    {
      id: 'core-apps',
      name: 'Core Applications',
      description: 'Main application modules',
      features: [
        { 
          id: 'expenses', 
          name: 'Expense Manager',
          dependencies: [],
          dependents: ['analytics']
        },
        { 
          id: 'settings', 
          name: 'Settings',
          dependencies: [],
          dependents: []
        }
      ]
    },
    {
      id: 'dashboard-components',
      name: 'Dashboard Components',
      features: [
        { 
          id: 'analytics', 
          name: 'Analytics',
          dependencies: ['expenses'],
          dependents: []
        }
      ]
    }
  ];

  const mockRoles = [
    { id: '1', name: 'Administrator', permissions: ['*'] },
    { id: '2', name: 'Account Officer', permissions: ['expense_read', 'expense_write'] },
    { id: '3', name: 'Viewer', permissions: ['expense_read'] }
  ];

  const mockSupabaseChain = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis()
  };

  beforeEach(() => {
    useAuth.mockReturnValue(mockAuth);
    supabase.from.mockReturnValue(mockSupabaseChain);
    jest.clearAllMocks();
  });

  describe('Hook Initialization', () => {
    test('initializes with loading state', () => {
      const { result } = renderHook(() => useFeatureVisibility());
      
      expect(result.current.loading).toBe(true);
      expect(result.current.featureCategories).toEqual([]);
      expect(result.current.roles).toEqual([]);
      expect(result.current.roleFeatureMatrix).toEqual({});
    });

    test('loads feature categories on mount', async () => {
      mockSupabaseChain.select.mockResolvedValue({
        data: mockFeatureCategories,
        error: null
      });

      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.featureCategories).toEqual(mockFeatureCategories);
    });

    test('loads roles and builds feature matrix', async () => {
      mockSupabaseChain.select.mockResolvedValueOnce({
        data: mockFeatureCategories,
        error: null
      }).mockResolvedValueOnce({
        data: mockRoles,
        error: null
      });

      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        expect(result.current.roles).toEqual(mockRoles);
      });
    });

    test('handles initialization errors gracefully', async () => {
      mockSupabaseChain.select.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      });

      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load feature configuration');
      });

      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('Feature Categories Management', () => {
    test('provides feature categories with dependency information', async () => {
      mockSupabaseChain.select.mockResolvedValue({
        data: mockFeatureCategories,
        error: null
      });

      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        const categories = result.current.featureCategories;
        expect(categories).toHaveLength(2);
        
        const analyticsFeature = categories[1].features.find(f => f.id === 'analytics');
        expect(analyticsFeature.dependencies).toContain('expenses');
      });
    });

    test('calculates feature dependency tree correctly', async () => {
      mockSupabaseChain.select.mockResolvedValue({
        data: mockFeatureCategories,
        error: null
      });

      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        const dependencyTree = result.current.getFeatureDependencies();
        expect(dependencyTree).toHaveProperty('expenses');
        expect(dependencyTree.expenses.dependents).toContain('analytics');
      });
    });

    test('identifies circular dependencies', async () => {
      const circularCategories = [
        {
          id: 'test',
          features: [
            { id: 'featureA', dependencies: ['featureB'] },
            { id: 'featureB', dependencies: ['featureA'] }
          ]
        }
      ];

      mockSupabaseChain.select.mockResolvedValue({
        data: circularCategories,
        error: null
      });

      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        const validation = result.current.validateFeatureDependencies();
        expect(validation.hasCircularDependencies).toBe(true);
      });
    });
  });

  describe('Role Feature Matrix Operations', () => {
    test('updates single role feature correctly', async () => {
      mockSupabaseChain.select.mockResolvedValue({
        data: mockFeatureCategories,
        error: null
      });
      mockSupabaseChain.update.mockResolvedValue({
        data: { id: '2' },
        error: null
      });

      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateRoleFeatures('2', 'analytics', true);
      });

      expect(mockSupabaseChain.update).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Feature visibility updated')
      );
    });

    test('validates dependencies before updating role features', async () => {
      mockSupabaseChain.select.mockResolvedValue({
        data: mockFeatureCategories,
        error: null
      });

      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const validation = result.current.validateFeatureChange('3', 'analytics', true);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        expect.stringContaining('requires Expense Manager access')
      );
    });

    test('prevents breaking core functionality', async () => {
      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const validation = result.current.validateFeatureChange('1', 'expenses', false);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        expect.stringContaining('Cannot disable core functionality')
      );
    });

    test('tracks affected users when making changes', async () => {
      mockSupabaseChain.select.mockResolvedValueOnce({
        data: [{ count: 5 }],
        error: null
      });

      const { result } = renderHook(() => useFeatureVisibility());
      
      const affectedUsers = await result.current.getAffectedUsers('2', 'analytics');
      expect(affectedUsers.count).toBe(5);
    });
  });

  describe('Bulk Operations', () => {
    test('performs bulk feature updates for multiple roles', async () => {
      mockSupabaseChain.update.mockResolvedValue({
        data: [{ id: '2' }, { id: '3' }],
        error: null
      });

      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.bulkUpdateFeatures({
          roleIds: ['2', '3'],
          categoryId: 'dashboard-components',
          action: 'enable'
        });
      });

      expect(mockSupabaseChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          features: expect.arrayContaining(['analytics'])
        })
      );
    });

    test('validates bulk operations before applying', async () => {
      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const validation = result.current.validateBulkOperation({
        roleIds: ['1', '2', '3'],
        categoryId: 'core-apps',
        action: 'disable'
      });
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        expect.stringContaining('Cannot disable core features for all users')
      );
    });

    test('calculates bulk operation impact', async () => {
      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const impact = await result.current.calculateBulkOperationImpact({
        roleIds: ['2', '3'],
        categoryId: 'dashboard-components',
        action: 'enable'
      });
      
      expect(impact).toHaveProperty('affectedUsers');
      expect(impact).toHaveProperty('featuresChanged');
      expect(impact).toHaveProperty('warnings');
    });
  });

  describe('Real-time Preview Generation', () => {
    test('generates interface preview for role', async () => {
      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const preview = result.current.previewRoleInterface('2');
      
      expect(preview).toHaveProperty('availableFeatures');
      expect(preview).toHaveProperty('navigationStructure');
      expect(preview).toHaveProperty('accessibleApps');
    });

    test('updates preview with pending changes', async () => {
      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate pending change
      act(() => {
        result.current.addPendingChange('2', 'analytics', true);
      });

      const preview = result.current.previewRoleInterface('2');
      expect(preview.availableFeatures).toContain('analytics');
    });

    test('shows feature count and accessibility in preview', async () => {
      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const preview = result.current.previewRoleInterface('1');
      
      expect(preview).toHaveProperty('featureCount');
      expect(preview).toHaveProperty('accessibilityLevel');
      expect(preview.accessibilityLevel).toBe('full');
    });

    test('identifies potential user experience issues in preview', async () => {
      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Preview with limited features
      const preview = result.current.previewRoleInterface('3');
      
      expect(preview.warnings).toContain(
        expect.stringContaining('Limited feature access may impact user experience')
      );
    });
  });

  describe('Feature Dependency Validation', () => {
    test('validates feature dependencies correctly', async () => {
      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Try to enable analytics without expenses
      const validation = result.current.validateFeatureChange(
        '3', // Viewer role
        'analytics',
        true
      );
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        expect.stringContaining('Analytics requires Expense Manager')
      );
    });

    test('shows warnings for dependency breaking changes', async () => {
      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Try to disable expenses when analytics is enabled
      const validation = result.current.validateFeatureChange(
        '2', // Account Officer with analytics
        'expenses',
        false
      );
      
      expect(validation.warnings).toContain(
        expect.stringContaining('will also disable Analytics')
      );
    });

    test('handles complex dependency chains', async () => {
      const complexCategories = [
        {
          id: 'complex',
          features: [
            { id: 'base', dependencies: [] },
            { id: 'level1', dependencies: ['base'] },
            { id: 'level2', dependencies: ['level1'] },
            { id: 'level3', dependencies: ['level2'] }
          ]
        }
      ];

      mockSupabaseChain.select.mockResolvedValue({
        data: complexCategories,
        error: null
      });

      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const validation = result.current.validateFeatureChange('2', 'level3', true);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Integration and Data Persistence', () => {
    test('persists feature visibility changes to database', async () => {
      mockSupabaseChain.update.mockResolvedValue({
        data: { id: '2', enabled_features: ['expenses', 'analytics'] },
        error: null
      });

      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateRoleFeatures('2', 'analytics', true);
      });

      expect(mockSupabaseChain.update).toHaveBeenCalledWith({
        enabled_features: expect.arrayContaining(['analytics'])
      });
    });

    test('handles database errors during updates', async () => {
      mockSupabaseChain.update.mockResolvedValue({
        data: null,
        error: new Error('Database constraint violation')
      });

      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.updateRoleFeatures('2', 'analytics', true);
        } catch (error) {
          expect(error.message).toContain('Failed to update');
        }
      });

      expect(toast.error).toHaveBeenCalled();
    });

    test('synchronizes with other components after updates', async () => {
      mockSupabaseChain.update.mockResolvedValue({
        data: { id: '2' },
        error: null
      });

      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const onUpdate = jest.fn();
      result.current.subscribe('roleUpdate', onUpdate);

      await act(async () => {
        await result.current.updateRoleFeatures('2', 'analytics', true);
      });

      expect(onUpdate).toHaveBeenCalledWith({
        roleId: '2',
        feature: 'analytics',
        enabled: true
      });
    });
  });

  describe('Performance and Optimization', () => {
    test('memoizes expensive calculations', async () => {
      const { result, rerender } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const firstDependencies = result.current.getFeatureDependencies();
      
      rerender();
      
      const secondDependencies = result.current.getFeatureDependencies();
      expect(firstDependencies).toBe(secondDependencies); // Should be memoized
    });

    test('debounces rapid feature toggle changes', async () => {
      jest.useFakeTimers();
      
      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Rapid toggles
      act(() => {
        result.current.toggleFeature('2', 'analytics');
        result.current.toggleFeature('2', 'analytics');
        result.current.toggleFeature('2', 'analytics');
      });

      expect(mockSupabaseChain.update).not.toHaveBeenCalled();
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockSupabaseChain.update).toHaveBeenCalledTimes(1);
      
      jest.useRealTimers();
    });

    test('batches multiple simultaneous updates', async () => {
      const { result } = renderHook(() => useFeatureVisibility());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const updates = [
          result.current.updateRoleFeatures('2', 'analytics', true),
          result.current.updateRoleFeatures('2', 'charts', true),
          result.current.updateRoleFeatures('3', 'analytics', true)
        ];
        
        await Promise.all(updates);
      });

      // Should batch updates for the same role
      expect(mockSupabaseChain.update).toHaveBeenCalledTimes(2); // Once for role 2, once for role 3
    });
  });
});