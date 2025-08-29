# Technical Implementation Specification
## Multi-App Educational Institution Management System

### 1. Core Architecture Components

#### 1.1 Application Registry
```typescript
// src/shared/registry/AppRegistry.ts
interface AppDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  icon: React.ComponentType;
  entryPoint: () => Promise<{ default: React.ComponentType }>;
  roles: Role[];
  permissions: Permission[];
  dependencies: string[];
  metadata: {
    category: 'financial' | 'academic' | 'administrative';
    priority: number;
    beta?: boolean;
    deprecated?: boolean;
  };
}

class AppRegistry {
  private apps = new Map<string, AppDefinition>();
  
  register(app: AppDefinition): void;
  getApp(id: string): AppDefinition | null;
  getAvailableApps(user: User): AppDefinition[];
  resolveAppDependencies(appId: string): AppDefinition[];
}

// App definitions
export const APPS: AppDefinition[] = [
  {
    id: 'expenses',
    name: 'expenses',
    displayName: 'Financial Management',
    description: 'Comprehensive expense tracking and financial oversight',
    version: '2.0.0',
    icon: DollarSign,
    entryPoint: () => import('../apps/expenses/ExpenseApp'),
    roles: ['administrator', 'manager', 'account_officer'],
    permissions: ['expense:read'],
    dependencies: [],
    metadata: {
      category: 'financial',
      priority: 1
    }
  },
  {
    id: 'exams',
    name: 'exams',
    displayName: 'Academic Management',
    description: 'Examination scheduling, grading, and academic oversight',
    version: '1.0.0',
    icon: GraduationCap,
    entryPoint: () => import('../apps/exams/ExamApp'),
    roles: ['administrator', 'manager', 'teacher'],
    permissions: ['exam:read'],
    dependencies: [],
    metadata: {
      category: 'academic',
      priority: 2
    }
  },
  {
    id: 'settings',
    name: 'settings',
    displayName: 'System Configuration',
    description: 'System settings, user preferences, and administrative tools',
    version: '1.0.0',
    icon: Settings,
    entryPoint: () => import('../apps/settings/SettingsApp'),
    roles: ['administrator', 'manager', 'teacher', 'account_officer'],
    permissions: ['settings:read'],
    dependencies: [],
    metadata: {
      category: 'administrative',
      priority: 3
    }
  }
];
```

#### 1.2 Enhanced Role and Permission System
```typescript
// src/shared/auth/RoleManager.ts
interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  conditions?: {
    ownership?: boolean;
    department?: string;
    status?: string[];
    timeRange?: [Date, Date];
  };
}

interface RoleDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: Permission[];
  inherits?: string[];
  metadata: {
    level: number;
    department?: string;
    canDelegate: boolean;
  };
}

const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: 'administrator',
    name: 'administrator',
    displayName: 'Administrator',
    description: 'Full system access with all administrative privileges',
    permissions: [
      { resource: '*', action: 'manage' }
    ],
    metadata: {
      level: 4,
      canDelegate: true
    }
  },
  {
    id: 'manager',
    name: 'manager', 
    displayName: 'Manager',
    description: 'Departmental oversight with management capabilities',
    permissions: [
      { resource: 'expense', action: 'manage', conditions: { department: 'own' } },
      { resource: 'exam', action: 'manage', conditions: { department: 'own' } },
      { resource: 'user', action: 'read', conditions: { department: 'own' } },
      { resource: 'report', action: 'read', conditions: { department: 'own' } }
    ],
    metadata: {
      level: 3,
      canDelegate: true
    }
  },
  {
    id: 'teacher',
    name: 'teacher',
    displayName: 'Teacher', 
    description: 'Academic focus with teaching and examination capabilities',
    permissions: [
      { resource: 'exam', action: 'manage', conditions: { ownership: true } },
      { resource: 'grade', action: 'manage', conditions: { ownership: true } },
      { resource: 'student', action: 'read' },
      { resource: 'expense', action: 'create', conditions: { ownership: true } },
      { resource: 'expense', action: 'read', conditions: { ownership: true } }
    ],
    metadata: {
      level: 2,
      canDelegate: false
    }
  },
  {
    id: 'account_officer',
    name: 'account_officer',
    displayName: 'Account Officer',
    description: 'Financial management with comprehensive expense capabilities', 
    permissions: [
      { resource: 'expense', action: 'manage' },
      { resource: 'budget', action: 'read' },
      { resource: 'report', action: 'read', conditions: { resource: 'financial' } },
      { resource: 'category', action: 'manage' },
      { resource: 'exam', action: 'read' }
    ],
    metadata: {
      level: 2,
      canDelegate: false
    }
  }
];

class RoleManager {
  private roles = new Map<string, RoleDefinition>();
  
  constructor() {
    ROLE_DEFINITIONS.forEach(role => this.roles.set(role.id, role));
  }
  
  hasPermission(user: User, resource: string, action: string, context?: any): boolean;
  getEffectivePermissions(user: User): Permission[];
  canAccessApp(user: User, appId: string): boolean;
  getAvailableActions(user: User, resource: string, context?: any): string[];
}
```

#### 1.3 Navigation and Routing System
```typescript
// src/shared/navigation/NavigationManager.ts
interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  path: string;
  appId?: string;
  roles: string[];
  permissions: string[];
  children?: NavigationItem[];
  metadata: {
    category: string;
    order: number;
    badge?: {
      text: string;
      variant: 'default' | 'secondary' | 'destructive';
    };
  };
}

class NavigationManager {
  private items: NavigationItem[] = [];
  private currentPath: string = '/';
  private user: User | null = null;
  
  setUser(user: User): void;
  getCurrentApp(): string | null;
  getVisibleNavigation(): NavigationItem[];
  canNavigateTo(path: string): boolean;
  navigateToApp(appId: string, subPath?: string): void;
  getBreadcrumb(): BreadcrumbItem[];
}

// Navigation configuration
export const NAVIGATION_CONFIG: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    path: '/',
    roles: ['administrator', 'manager', 'teacher', 'account_officer'],
    permissions: [],
    metadata: { category: 'main', order: 1 }
  },
  {
    id: 'financial',
    label: 'Financial',
    icon: DollarSign,
    path: '/financial',
    roles: ['administrator', 'manager', 'account_officer'],
    permissions: ['expense:read'],
    children: [
      {
        id: 'expenses',
        label: 'Expense Management',
        icon: Receipt,
        path: '/financial/expenses',
        appId: 'expenses',
        roles: ['administrator', 'manager', 'account_officer'],
        permissions: ['expense:read'],
        metadata: { category: 'financial', order: 1 }
      },
      {
        id: 'budgets',
        label: 'Budget Planning',
        icon: Target,
        path: '/financial/budgets', 
        appId: 'expenses',
        roles: ['administrator', 'manager'],
        permissions: ['budget:read'],
        metadata: { category: 'financial', order: 2 }
      }
    ],
    metadata: { category: 'main', order: 2 }
  },
  {
    id: 'academic',
    label: 'Academic',
    icon: GraduationCap,
    path: '/academic',
    roles: ['administrator', 'manager', 'teacher'],
    permissions: ['exam:read'],
    children: [
      {
        id: 'exams',
        label: 'Examination Management',
        icon: FileText,
        path: '/academic/exams',
        appId: 'exams',
        roles: ['administrator', 'manager', 'teacher'],
        permissions: ['exam:read'],
        metadata: { category: 'academic', order: 1 }
      },
      {
        id: 'grades',
        label: 'Grade Management',
        icon: Star,
        path: '/academic/grades',
        appId: 'exams', 
        roles: ['administrator', 'manager', 'teacher'],
        permissions: ['grade:read'],
        metadata: { category: 'academic', order: 2 }
      }
    ],
    metadata: { category: 'main', order: 3 }
  },
  {
    id: 'administration',
    label: 'Administration',
    icon: Settings,
    path: '/admin',
    roles: ['administrator', 'manager'],
    permissions: ['settings:read'],
    children: [
      {
        id: 'users',
        label: 'User Management',
        icon: Users,
        path: '/admin/users',
        appId: 'settings',
        roles: ['administrator'],
        permissions: ['user:read'],
        metadata: { category: 'admin', order: 1 }
      },
      {
        id: 'departments',
        label: 'Departments',
        icon: Building,
        path: '/admin/departments',
        appId: 'settings',
        roles: ['administrator', 'manager'],
        permissions: ['department:read'],
        metadata: { category: 'admin', order: 2 }
      },
      {
        id: 'system-settings',
        label: 'System Settings',
        icon: Cog,
        path: '/admin/system',
        appId: 'settings',
        roles: ['administrator'],
        permissions: ['system:manage'],
        metadata: { category: 'admin', order: 3 }
      }
    ],
    metadata: { category: 'main', order: 4 }
  }
];
```

#### 1.4 Inter-App Communication System
```typescript
// src/shared/events/EventBus.ts
interface AppEvent<T = any> {
  type: string;
  source: string;
  target?: string | string[];
  payload: T;
  timestamp: Date;
  correlationId: string;
  metadata: {
    priority: 'low' | 'normal' | 'high';
    persistent: boolean;
    retry?: {
      attempts: number;
      delay: number;
    };
  };
}

interface EventHandler<T = any> {
  (event: AppEvent<T>): void | Promise<void>;
}

class EventBus {
  private subscribers = new Map<string, Set<EventHandler>>();
  private persistentEvents = new Map<string, AppEvent>();
  private eventHistory: AppEvent[] = [];
  private maxHistorySize = 1000;
  
  publish<T>(type: string, payload: T, options?: Partial<AppEvent['metadata']>): void;
  subscribe<T>(type: string, handler: EventHandler<T>): () => void;
  subscribeOnce<T>(type: string, handler: EventHandler<T>): void;
  unsubscribe<T>(type: string, handler: EventHandler<T>): void;
  getEventHistory(filter?: (event: AppEvent) => boolean): AppEvent[];
  clearHistory(): void;
}

// Event type definitions
export const EVENT_TYPES = {
  // Navigation events
  APP_CHANGED: 'navigation.app_changed',
  ROUTE_CHANGED: 'navigation.route_changed',
  
  // Data events
  EXPENSE_CREATED: 'expense.created',
  EXPENSE_UPDATED: 'expense.updated',
  EXPENSE_DELETED: 'expense.deleted',
  EXAM_SCHEDULED: 'exam.scheduled',
  GRADE_ENTERED: 'grade.entered',
  
  // User events
  USER_PROFILE_UPDATED: 'user.profile_updated',
  USER_ROLE_CHANGED: 'user.role_changed',
  USER_PERMISSIONS_CHANGED: 'user.permissions_changed',
  
  // System events
  NOTIFICATION_CREATED: 'system.notification_created',
  ERROR_OCCURRED: 'system.error_occurred',
  FEATURE_FLAG_CHANGED: 'system.feature_flag_changed'
} as const;
```

### 2. State Management Architecture

#### 2.1 Global State Store
```typescript
// src/shared/store/globalStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GlobalState {
  // User state
  user: User | null;
  userProfile: UserProfile | null;
  authentication: {
    isAuthenticated: boolean;
    token: string | null;
    refreshToken: string | null;
    expiresAt: Date | null;
  };
  
  // Navigation state
  navigation: {
    currentApp: string | null;
    currentRoute: string;
    breadcrumb: BreadcrumbItem[];
    sidebarOpen: boolean;
  };
  
  // Notification state
  notifications: Notification[];
  
  // Application cache
  cache: {
    permissions: Permission[];
    availableApps: AppDefinition[];
    navigationItems: NavigationItem[];
    systemSettings: SystemSettings;
  };
  
  // UI state
  ui: {
    theme: 'light' | 'dark' | 'system';
    loading: boolean;
    error: string | null;
  };
}

interface GlobalActions {
  // User actions
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  updateAuthentication: (auth: Partial<GlobalState['authentication']>) => void;
  
  // Navigation actions
  setCurrentApp: (appId: string | null) => void;
  setCurrentRoute: (route: string) => void;
  updateBreadcrumb: (items: BreadcrumbItem[]) => void;
  toggleSidebar: () => void;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Cache actions
  updateCache: (key: keyof GlobalState['cache'], value: any) => void;
  clearCache: () => void;
  
  // UI actions
  setTheme: (theme: GlobalState['ui']['theme']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useGlobalStore = create<GlobalState & GlobalActions>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      userProfile: null,
      authentication: {
        isAuthenticated: false,
        token: null,
        refreshToken: null,
        expiresAt: null
      },
      navigation: {
        currentApp: null,
        currentRoute: '/',
        breadcrumb: [],
        sidebarOpen: true
      },
      notifications: [],
      cache: {
        permissions: [],
        availableApps: [],
        navigationItems: [],
        systemSettings: {}
      },
      ui: {
        theme: 'system',
        loading: false,
        error: null
      },
      
      // Actions
      setUser: (user) => set({ user }),
      setUserProfile: (userProfile) => set({ userProfile }),
      updateAuthentication: (auth) => set((state) => ({
        authentication: { ...state.authentication, ...auth }
      })),
      
      setCurrentApp: (appId) => set((state) => ({
        navigation: { ...state.navigation, currentApp: appId }
      })),
      setCurrentRoute: (route) => set((state) => ({
        navigation: { ...state.navigation, currentRoute: route }
      })),
      updateBreadcrumb: (breadcrumb) => set((state) => ({
        navigation: { ...state.navigation, breadcrumb }
      })),
      toggleSidebar: () => set((state) => ({
        navigation: { 
          ...state.navigation, 
          sidebarOpen: !state.navigation.sidebarOpen 
        }
      })),
      
      addNotification: (notification) => set((state) => ({
        notifications: [
          ...state.notifications,
          {
            ...notification,
            id: `notification-${Date.now()}-${Math.random()}`,
            timestamp: new Date()
          }
        ]
      })),
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      clearNotifications: () => set({ notifications: [] }),
      
      updateCache: (key, value) => set((state) => ({
        cache: { ...state.cache, [key]: value }
      })),
      clearCache: () => set({
        cache: {
          permissions: [],
          availableApps: [],
          navigationItems: [],
          systemSettings: {}
        }
      }),
      
      setTheme: (theme) => set((state) => ({
        ui: { ...state.ui, theme }
      })),
      setLoading: (loading) => set((state) => ({
        ui: { ...state.ui, loading }
      })),
      setError: (error) => set((state) => ({
        ui: { ...state.ui, error }
      }))
    }),
    {
      name: 'global-store',
      partialize: (state) => ({
        authentication: state.authentication,
        navigation: { currentApp: state.navigation.currentApp },
        ui: { theme: state.ui.theme }
      })
    }
  )
);
```

### 3. Database Schema Implementation

#### 3.1 Enhanced User and Department Schema
```sql
-- Enhanced users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('administrator', 'manager', 'teacher', 'account_officer')),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    employee_id VARCHAR(50) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    hire_date DATE,
    salary DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login_at TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    head_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    budget_limit DECIMAL(15,2),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    location VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(50) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    conditions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role, resource, action)
);

-- Feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    enabled BOOLEAN DEFAULT FALSE,
    roles TEXT[] DEFAULT ARRAY[]::TEXT[],
    conditions JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3.2 Academic Management Schema
```sql
-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    credits INTEGER DEFAULT 3,
    semester INTEGER CHECK (semester BETWEEN 1 AND 8),
    year INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table (extends users for student-specific data)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    admission_date DATE NOT NULL,
    graduation_date DATE,
    current_semester INTEGER,
    cgpa DECIMAL(3,2),
    department_id UUID REFERENCES departments(id),
    guardian_name VARCHAR(255),
    guardian_phone VARCHAR(20),
    guardian_email VARCHAR(255),
    address TEXT,
    status VARCHAR(20) DEFAULT 'enrolled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    exam_type VARCHAR(50) NOT NULL CHECK (exam_type IN ('quiz', 'midterm', 'final', 'assignment')),
    exam_date DATE NOT NULL,
    exam_time TIME,
    duration INTEGER NOT NULL, -- in minutes
    total_marks INTEGER NOT NULL,
    pass_marks INTEGER NOT NULL,
    venue VARCHAR(255),
    instructions TEXT,
    created_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student enrollments
CREATE TABLE IF NOT EXISTS student_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'enrolled',
    final_grade VARCHAR(5),
    grade_points DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, subject_id)
);

-- Exam results
CREATE TABLE IF NOT EXISTS exam_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained DECIMAL(5,2) NOT NULL,
    grade VARCHAR(5),
    status VARCHAR(20) DEFAULT 'present',
    remarks TEXT,
    graded_by UUID REFERENCES users(id),
    graded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(exam_id, student_id)
);
```

### 4. Component Library Architecture

#### 4.1 Design System Foundation
```typescript
// src/shared/design-system/tokens.ts
export const DESIGN_TOKENS = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      500: '#3b82f6',
      900: '#1e3a8a'
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b', 
      error: '#ef4444',
      info: '#3b82f6'
    },
    role: {
      administrator: '#8b5cf6',
      manager: '#06b6d4',
      teacher: '#10b981',
      account_officer: '#f59e0b'
    }
  },
  typography: {
    fonts: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['Fira Code', 'monospace']
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px'
  }
};
```

#### 4.2 Shared Component Architecture
```typescript
// src/shared/components/foundation/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  roleColor?: boolean; // Use role-based coloring
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    loading, 
    icon: Icon, 
    iconPosition = 'left',
    fullWidth,
    roleColor,
    children, 
    className,
    disabled,
    ...props 
  }, ref) => {
    const { user } = useGlobalStore();
    
    const baseClasses = cn(
      'inline-flex items-center justify-center font-medium transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      {
        'w-full': fullWidth,
        'px-3 py-1.5 text-sm rounded-md': size === 'sm',
        'px-4 py-2 text-base rounded-md': size === 'md',
        'px-6 py-3 text-lg rounded-lg': size === 'lg'
      }
    );
    
    const variantClasses = cn({
      'bg-primary-600 text-white hover:bg-primary-700': variant === 'primary' && !roleColor,
      'bg-secondary-100 text-secondary-900 hover:bg-secondary-200': variant === 'secondary',
      'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50': variant === 'outline',
      'text-gray-700 hover:bg-gray-100': variant === 'ghost',
      'bg-red-600 text-white hover:bg-red-700': variant === 'destructive',
      // Role-based colors
      [`bg-role-${user?.role} text-white hover:opacity-90`]: roleColor && user?.role
    });
    
    return (
      <button
        ref={ref}
        className={cn(baseClasses, variantClasses, className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {Icon && iconPosition === 'left' && !loading && (
          <Icon className="mr-2 h-4 w-4" />
        )}
        {children}
        {Icon && iconPosition === 'right' && (
          <Icon className="ml-2 h-4 w-4" />
        )}
      </button>
    );
  }
);

// src/shared/components/patterns/DataTable.tsx
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  error?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  sorting?: {
    field: keyof T;
    direction: 'asc' | 'desc';
    onSortChange: (field: keyof T, direction: 'asc' | 'desc') => void;
  };
  filtering?: {
    filters: Record<string, any>;
    onFilterChange: (filters: Record<string, any>) => void;
  };
  selection?: {
    selectedRows: string[];
    onSelectionChange: (selectedRows: string[]) => void;
  };
  actions?: {
    bulk?: Action[];
    row?: (row: T) => Action[];
  };
  permissions?: {
    create?: boolean;
    read?: boolean; 
    update?: boolean;
    delete?: boolean;
  };
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  loading,
  error,
  pagination,
  sorting,
  filtering,
  selection,
  actions,
  permissions = { read: true }
}: DataTableProps<T>) {
  // Implementation with role-based access control
  return (
    <div className="space-y-4">
      {/* Table header with filters and actions */}
      {/* Table content */}
      {/* Pagination */}
    </div>
  );
}
```

### 5. Performance and Security Implementation

#### 5.1 Code Splitting and Lazy Loading
```typescript
// src/shared/utils/loadApp.ts
interface AppLoadOptions {
  preload?: boolean;
  fallback?: React.ComponentType;
  timeout?: number;
}

export function loadApp(
  appId: string, 
  options: AppLoadOptions = {}
): Promise<React.ComponentType> {
  const { preload = false, fallback, timeout = 10000 } = options;
  
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`App ${appId} failed to load within ${timeout}ms`));
    }, timeout);
    
    import(`../apps/${appId}/${appId}App`)
      .then((module) => {
        clearTimeout(timeoutId);
        resolve(module.default);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        console.error(`Failed to load app ${appId}:`, error);
        if (fallback) {
          resolve(fallback);
        } else {
          reject(error);
        }
      });
  });
}

// Preload critical apps
export const preloadApps = async (user: User) => {
  const criticalApps = ['expenses']; // Always preload expenses
  const roleBasedApps = {
    administrator: ['settings'],
    manager: ['settings'],
    teacher: ['exams'],
    account_officer: []
  };
  
  const appsToPreload = [
    ...criticalApps,
    ...(roleBasedApps[user.role] || [])
  ];
  
  return Promise.allSettled(
    appsToPreload.map(appId => loadApp(appId, { preload: true }))
  );
};
```

#### 5.2 Security Implementation
```typescript
// src/shared/security/SecurityManager.ts
interface SecurityContext {
  user: User;
  session: Session;
  permissions: Permission[];
  ipAddress: string;
  userAgent: string;
}

class SecurityManager {
  private auditLog: AuditEvent[] = [];
  
  validateAccess(
    context: SecurityContext, 
    resource: string, 
    action: string
  ): SecurityResult {
    // Check basic authentication
    if (!context.session || !this.isValidSession(context.session)) {
      return { allowed: false, reason: 'Invalid session' };
    }
    
    // Check permissions
    const hasPermission = this.checkPermission(
      context.permissions, 
      resource, 
      action
    );
    
    if (!hasPermission) {
      this.logSecurityEvent({
        type: 'ACCESS_DENIED',
        user: context.user.id,
        resource,
        action,
        timestamp: new Date(),
        context: {
          ipAddress: context.ipAddress,
          userAgent: context.userAgent
        }
      });
      
      return { allowed: false, reason: 'Insufficient permissions' };
    }
    
    // Log successful access
    this.logSecurityEvent({
      type: 'ACCESS_GRANTED',
      user: context.user.id,
      resource,
      action,
      timestamp: new Date(),
      context: {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      }
    });
    
    return { allowed: true };
  }
  
  private isValidSession(session: Session): boolean {
    return session.expiresAt > new Date() && session.isActive;
  }
  
  private checkPermission(
    permissions: Permission[], 
    resource: string, 
    action: string
  ): boolean {
    return permissions.some(permission => 
      (permission.resource === '*' || permission.resource === resource) &&
      (permission.action === 'manage' || permission.action === action)
    );
  }
  
  private logSecurityEvent(event: AuditEvent): void {
    this.auditLog.push(event);
    // Also send to external logging service
    this.sendToAuditService(event);
  }
  
  private sendToAuditService(event: AuditEvent): void {
    // Implementation for external audit logging
  }
}
```

This technical specification provides the detailed implementation blueprint for transforming the expense tracking system into a comprehensive multi-app educational institution management platform. The architecture prioritizes security, performance, maintainability, and user experience while providing a scalable foundation for future growth.