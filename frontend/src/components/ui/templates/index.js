/**
 * MOBILE-FIRST TEMPLATE LIBRARY
 * 
 * Comprehensive collection of professional, clean mobile-first component templates
 * designed to eliminate cramped layouts and provide exceptional user experiences
 * on mobile devices. All templates follow modern design principles and accessibility
 * standards.
 * 
 * Features:
 * - Mobile-first responsive design
 * - Touch-friendly interactions (44px+ targets)
 * - Smooth gesture support
 * - Accessibility-compliant (WCAG 2.1 AA)
 * - Performance optimized
 * - Dark mode support
 * - Haptic feedback integration
 * - Professional spacing and typography
 * 
 * Created by: Mobile Template Creator Agent
 * Coordinated by: Claude Flow Swarm System
 * Version: 1.0.0
 * Last Updated: 2025-08-26
 */

// ==================== CORE TEMPLATES ====================

// Modern Mobile Expense Card - The flagship template
export { default as MobileExpenseCardTemplate } from './MobileExpenseCardTemplate';

// Gesture-based interactions
export {
  SwipeActionTemplate,
  PullToRefreshTemplate,
  LongPressTemplate,
  DoubleTapTemplate,
  default as MobileGestureTemplates
} from './MobileGestureTemplate';

// Navigation patterns
export {
  BottomTabNavigationTemplate,
  DrawerNavigationTemplate,
  CollapsibleHeaderTemplate,
  FloatingTabBarTemplate,
  expenseAppTabs,
  expenseHeaderActions,
  default as MobileNavigationTemplates
} from './MobileNavigationTemplate';

// Touch-friendly UI elements
export {
  TouchButtonTemplate,
  TouchInputTemplate,
  TouchSwitchTemplate,
  TouchStepperTemplate,
  TouchActionSheetTemplate,
  default as TouchFriendlyElements
} from './TouchFriendlyElementsTemplate';

// Responsive design patterns
export {
  ResponsiveContainerTemplate,
  ResponsiveGridTemplate,
  ResponsiveTypographyTemplate,
  ResponsiveCardTemplate,
  ResponsiveLayoutTemplate,
  useResponsiveBreakpoints,
  useTouch,
  responsiveUtils,
  default as ResponsiveDesignTemplates
} from './ResponsiveDesignTemplate';

// Accessibility-compliant components
export {
  AccessibilityProvider,
  useAccessibility,
  AccessibleButtonTemplate,
  AccessibleInputTemplate,
  AccessibleModalTemplate,
  AccessibleAlertTemplate,
  default as AccessibilityTemplates
} from './AccessibilityTemplate';

// Performance-optimized lists
export {
  VirtualScrollListTemplate,
  PullToRefreshListTemplate,
  SkeletonListTemplate,
  SearchableListTemplate,
  default as MobileListTemplates
} from './MobileListTemplate';

// ==================== TEMPLATE CATEGORIES ====================

/**
 * CARD TEMPLATES
 * Professional card layouts with improved spacing
 */
export const CardTemplates = {
  MobileExpenseCard: MobileExpenseCardTemplate,
  ResponsiveCard: ResponsiveCardTemplate,
};

/**
 * INTERACTION TEMPLATES
 * Touch and gesture-based interactions
 */
export const InteractionTemplates = {
  SwipeAction: SwipeActionTemplate,
  PullToRefresh: PullToRefreshTemplate,
  LongPress: LongPressTemplate,
  DoubleTap: DoubleTapTemplate,
};

/**
 * NAVIGATION TEMPLATES
 * Mobile-first navigation patterns
 */
export const NavigationTemplates = {
  BottomTabs: BottomTabNavigationTemplate,
  Drawer: DrawerNavigationTemplate,
  CollapsibleHeader: CollapsibleHeaderTemplate,
  FloatingTabBar: FloatingTabBarTemplate,
};

/**
 * FORM TEMPLATES
 * Touch-optimized form elements
 */
export const FormTemplates = {
  Button: TouchButtonTemplate,
  Input: TouchInputTemplate,
  Switch: TouchSwitchTemplate,
  Stepper: TouchStepperTemplate,
  ActionSheet: TouchActionSheetTemplate,
  // Accessible variants
  AccessibleButton: AccessibleButtonTemplate,
  AccessibleInput: AccessibleInputTemplate,
};

/**
 * LAYOUT TEMPLATES
 * Responsive layout systems
 */
export const LayoutTemplates = {
  Container: ResponsiveContainerTemplate,
  Grid: ResponsiveGridTemplate,
  Layout: ResponsiveLayoutTemplate,
  Typography: ResponsiveTypographyTemplate,
};

/**
 * LIST TEMPLATES
 * High-performance list components
 */
export const ListTemplates = {
  VirtualScroll: VirtualScrollListTemplate,
  PullToRefresh: PullToRefreshListTemplate,
  Skeleton: SkeletonListTemplate,
  Searchable: SearchableListTemplate,
};

/**
 * ACCESSIBILITY TEMPLATES
 * WCAG 2.1 AA compliant components
 */
export const A11yTemplates = {
  Provider: AccessibilityProvider,
  Button: AccessibleButtonTemplate,
  Input: AccessibleInputTemplate,
  Modal: AccessibleModalTemplate,
  Alert: AccessibleAlertTemplate,
};

// ==================== QUICK START PRESETS ====================

/**
 * EXPENSE TRACKER PRESET
 * Pre-configured templates for expense tracking apps
 */
export const ExpenseTrackerPreset = {
  // Cards
  ExpenseCard: MobileExpenseCardTemplate,
  
  // Navigation
  BottomTabs: BottomTabNavigationTemplate,
  Header: CollapsibleHeaderTemplate,
  Drawer: DrawerNavigationTemplate,
  
  // Lists
  ExpenseList: VirtualScrollListTemplate,
  SearchableExpenses: SearchableListTemplate,
  
  // Forms
  AddExpenseButton: TouchButtonTemplate,
  AmountInput: TouchInputTemplate,
  CategorySelector: TouchActionSheetTemplate,
  
  // Layouts
  Container: ResponsiveContainerTemplate,
  Grid: ResponsiveGridTemplate,
  
  // Interactions
  SwipeActions: SwipeActionTemplate,
  PullRefresh: PullToRefreshTemplate,
  
  // Default configurations
  configs: {
    tabs: expenseAppTabs,
    headerActions: expenseHeaderActions,
    colors: {
      primary: '#3B82F6',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
  },
};

/**
 * ACCESSIBILITY-FIRST PRESET
 * Templates optimized for accessibility
 */
export const AccessibilityFirstPreset = {
  Provider: AccessibilityProvider,
  Button: AccessibleButtonTemplate,
  Input: AccessibleInputTemplate,
  Modal: AccessibleModalTemplate,
  Alert: AccessibleAlertTemplate,
  useA11y: useAccessibility,
};

/**
 * PERFORMANCE PRESET
 * High-performance templates for large datasets
 */
export const PerformancePreset = {
  VirtualList: VirtualScrollListTemplate,
  SkeletonLoader: SkeletonListTemplate,
  LazyCard: MobileExpenseCardTemplate,
  OptimizedGrid: ResponsiveGridTemplate,
};

// ==================== HOOKS AND UTILITIES ====================

/**
 * RESPONSIVE HOOKS
 */
export const ResponsiveHooks = {
  useBreakpoints: useResponsiveBreakpoints,
  useTouch: useTouch,
};

/**
 * ACCESSIBILITY HOOKS
 */
export const AccessibilityHooks = {
  useAccessibility: useAccessibility,
};

/**
 * UTILITY FUNCTIONS
 */
export const Utils = {
  responsive: responsiveUtils,
};

// ==================== TEMPLATE METADATA ====================

export const TemplateInfo = {
  version: '1.0.0',
  created: '2025-08-26',
  author: 'Mobile Template Creator Agent',
  coordinator: 'Claude Flow Swarm System',
  
  features: [
    'Mobile-first responsive design',
    'Touch-friendly interactions (44px+ targets)',
    'Smooth gesture support',
    'WCAG 2.1 AA accessibility compliance',
    'Performance optimized',
    'Dark mode support',
    'Haptic feedback integration',
    'Professional spacing and typography',
  ],
  
  categories: [
    'Card Templates',
    'Interaction Templates', 
    'Navigation Templates',
    'Form Templates',
    'Layout Templates',
    'List Templates',
    'Accessibility Templates',
  ],
  
  compatibility: {
    react: '>=16.8.0',
    'framer-motion': '>=6.0.0',
    tailwindcss: '>=3.0.0',
  },
  
  usage: {
    quickStart: 'import { ExpenseTrackerPreset } from "./templates"',
    individual: 'import { MobileExpenseCardTemplate } from "./templates"',
    accessibility: 'import { AccessibilityFirstPreset } from "./templates"',
  },
};

// ==================== DEFAULT EXPORT ====================

const MobileTemplates = {
  // Core templates
  Card: CardTemplates,
  Interaction: InteractionTemplates,
  Navigation: NavigationTemplates,
  Form: FormTemplates,
  Layout: LayoutTemplates,
  List: ListTemplates,
  Accessibility: A11yTemplates,
  
  // Presets
  Presets: {
    ExpenseTracker: ExpenseTrackerPreset,
    AccessibilityFirst: AccessibilityFirstPreset,
    Performance: PerformancePreset,
  },
  
  // Hooks and utilities
  Hooks: {
    ...ResponsiveHooks,
    ...AccessibilityHooks,
  },
  Utils,
  
  // Metadata
  Info: TemplateInfo,
};

export default MobileTemplates;

/**
 * ==================== USAGE EXAMPLES ====================
 * 
 * // Quick Start - Expense Tracker App
 * import { ExpenseTrackerPreset } from './components/ui/templates';
 * 
 * function ExpenseApp() {
 *   const { ExpenseCard, BottomTabs, Container } = ExpenseTrackerPreset;
 *   
 *   return (
 *     <Container variant="default" padding="responsive">
 *       {expenses.map(expense => (
 *         <ExpenseCard 
 *           key={expense.id}
 *           expense={expense}
 *           onEdit={handleEdit}
 *           onDelete={handleDelete}
 *         />
 *       ))}
 *       <BottomTabs
 *         tabs={ExpenseTrackerPreset.configs.tabs}
 *         activeTab={currentTab}
 *         onTabChange={setCurrentTab}
 *       />
 *     </Container>
 *   );
 * }
 * 
 * // Individual Template Usage
 * import { 
 *   MobileExpenseCardTemplate,
 *   TouchButtonTemplate,
 *   SwipeActionTemplate
 * } from './components/ui/templates';
 * 
 * function ExpenseList() {
 *   return (
 *     <div>
 *       {expenses.map(expense => (
 *         <SwipeActionTemplate
 *           key={expense.id}
 *           leftActions={[{ icon: Edit, onClick: () => edit(expense) }]}
 *           rightActions={[{ icon: Trash2, onClick: () => delete(expense) }]}
 *         >
 *           <MobileExpenseCardTemplate 
 *             expense={expense}
 *             variant="default"
 *             swipeEnabled={false}
 *           />
 *         </SwipeActionTemplate>
 *       ))}
 *     </div>
 *   );
 * }
 * 
 * // Accessibility-First Usage
 * import { AccessibilityFirstPreset } from './components/ui/templates';
 * 
 * function App() {
 *   return (
 *     <AccessibilityFirstPreset.Provider>
 *       <MyApp />
 *     </AccessibilityFirstPreset.Provider>
 *   );
 * }
 * 
 * function MyForm() {
 *   const { Button, Input, Modal } = AccessibilityFirstPreset;
 *   
 *   return (
 *     <form>
 *       <Input
 *         id="amount"
 *         label="Amount"
 *         type="number"
 *         required
 *         ariaDescribedBy="amount-help"
 *       />
 *       <Button
 *         variant="primary"
 *         ariaLabel="Save expense"
 *         onClick={handleSave}
 *       >
 *         Save
 *       </Button>
 *     </form>
 *   );
 * }
 * 
 * // Performance-Optimized Lists
 * import { PerformancePreset } from './components/ui/templates';
 * 
 * function LargeExpenseList() {
 *   const { VirtualList, SkeletonLoader } = PerformancePreset;
 *   
 *   if (loading) {
 *     return <SkeletonLoader count={10} variant="card" />;
 *   }
 *   
 *   return (
 *     <VirtualList
 *       items={expenses}
 *       itemHeight={120}
 *       renderItem={(expense) => (
 *         <MobileExpenseCardTemplate expense={expense} />
 *       )}
 *       onLoadMore={loadMoreExpenses}
 *       hasMore={hasMore}
 *     />
 *   );
 * }
 * 
 * // Responsive Design Utilities
 * import { ResponsiveHooks } from './components/ui/templates';
 * 
 * function ResponsiveComponent() {
 *   const { isMobile, isTablet, isDesktop } = ResponsiveHooks.useBreakpoints();
 *   const { isTouch, hasHover } = ResponsiveHooks.useTouch();
 *   
 *   return (
 *     <div>
 *       {isMobile && <MobileLayout />}
 *       {isTablet && <TabletLayout />}
 *       {isDesktop && <DesktopLayout />}
 *       {isTouch && <TouchControls />}
 *       {hasHover && <HoverEffects />}
 *     </div>
 *   );
 * }
 */