# Multi-App Architecture Design
## Educational Institution Management System

### Executive Summary
This document outlines the transformation from a single expense tracking application to a comprehensive multi-app educational institution management system. The architecture supports role-based access control, dynamic feature visibility, and seamless integration between applications.

### Current State Analysis
**Existing Architecture:**
- Single-purpose expense tracking application
- Two-tier role system: `admin` and `account_officer`
- Component-based React architecture with Supabase backend
- Basic role-based access control using RLS policies

### Target Multi-App Architecture

#### 1. Application Structure
```
Educational Institution System
├── Expenses App (Financial Management)
├── Exams App (Academic Assessment Management)
└── Settings App (System Configuration)
```

#### 2. Extended Role-Based Access Control

##### Role Hierarchy (Enhanced - 5 Roles)
```
Administrator (Highest Privilege)
├── Manager (Departmental Oversight)
├── Exam Officer/Coordinator (Academic Scheduling & Compliance)
├── Teacher (Academic Focus)
└── Account Officer (Financial Focus)
```

##### Enhanced Role Capabilities Matrix
| Feature Category | Administrator | Manager | Exam Officer | Teacher | Account Officer |
|------------------|---------------|---------|--------------|---------|-----------------|
| **Financial Management** | Full Access | Department View | Read-only | Personal Expenses | Full Management |
| **Academic Management** | Full Access | Department Management | Full Exam Scheduling | Teaching Tools | Read-only |
| **Exam Scheduling** | Full Access | Department Approval | Full Control | View/Request | No Access |
| **Test Result Deadlines** | Full Access | Department View | Full Enforcement | Compliance | No Access |
| **Notification Management** | Full Access | Department Scope | Exam-related | Personal | Financial Alerts |
| **Student/Class Management** | Full Access | Department Students | Full Management | Class Students | No Access |
| **Subject Assignment** | Full Access | Department Subjects | Shared Control | Shared Control | No Access |
| **Compliance Tracking** | Global View | Department View | Full Control | Personal View | No Access |
| **User Management** | Full Control | Department Users | Student Records | Class Students | No Access |
| **System Settings** | All Settings | Department Settings | Exam Settings | Personal Settings | Financial Settings |
| **Reports & Analytics** | Global Reports | Department Reports | Compliance Reports | Class Reports | Financial Reports |

#### 3. Application-Specific Architecture

##### 3.1 Expenses App (Enhanced)
**Purpose:** Financial management and expense tracking
**Core Components:**
- ExpenseManager (CRUD operations)
- BudgetManager (Budget planning and tracking)
- FinancialReports (Analytics and reporting)
- ApprovalWorkflow (Multi-level approval system)

**Role-Specific Features:**
- **Administrator:** Global financial oversight, budget management, approval workflows
- **Manager:** Departmental budget management, expense approval
- **Teacher:** Personal expense submission, travel expense requests
- **Account Officer:** Comprehensive expense management, financial reporting

##### 3.2 Exams App (Enhanced with Exam Officer Role)
**Purpose:** Academic assessment and examination management with deadline tracking and compliance
**Core Components:**
- ExamScheduler (Scheduling and timetabling with deadline enforcement)
- GradeManager (Grade entry with submission tracking)
- ResultAnalytics (Performance analysis and compliance monitoring)
- StudentManager (Student records and enrollment)
- DeadlineTracker (Test result submission deadline management)
- NotificationEngine (WhatsApp/Email automated reminders and escalation)
- ComplianceMonitor (Real-time teacher compliance tracking)

**Role-Specific Features:**
- **Administrator:** Global academic oversight, system configuration, all compliance data
- **Manager:** Departmental exam coordination, performance monitoring, departmental compliance
- **Exam Officer:** Test scheduling, deadline setting/enforcement, teacher compliance tracking, notification management, student/class data management, subject assignment (shared with teachers)
- **Teacher:** Exam creation, grade entry with deadline compliance, result analysis, subject assignment (shared with exam officers)
- **Account Officer:** Financial aspects of examinations (fees, costs), read-only access to exam data

##### 3.3 Settings App (New)
**Purpose:** System configuration and personalization
**Core Components:**
- UserPreferences (Personal settings)
- SystemConfiguration (Global system settings)
- DepartmentSettings (Department-specific configurations)
- IntegrationManager (Third-party integrations)

**Role-Specific Features:**
- **Administrator:** All system settings, user management, security configurations
- **Manager:** Department settings, team preferences
- **Teacher:** Personal preferences, class settings
- **Account Officer:** Financial system settings, reporting preferences

#### 4. Navigation and State Management Architecture

##### 4.1 App Router Structure
```typescript
interface AppRoute {
  id: string;
  name: string;
  icon: React.ComponentType;
  path: string;
  component: React.ComponentType;
  roles: Role[];
  dependencies?: string[];
  meta: {
    description: string;
    category: 'financial' | 'academic' | 'system';
    priority: number;
  };
}
```

##### 4.2 Navigation Manager
```typescript
class NavigationManager {
  private routes: Map<string, AppRoute>;
  private userRole: Role;
  
  getAvailableApps(): AppRoute[];
  canAccessApp(appId: string): boolean;
  getAppDependencies(appId: string): string[];
  resolveNavigation(currentApp: string, targetApp: string): NavigationResult;
}
```

##### 4.3 State Management Strategy
**Global State (Redux/Zustand):**
- User authentication and profile
- Current application context
- Shared notification system
- Cross-app data cache

**App-Specific State:**
- Application-local state management
- Feature-specific data
- UI state and preferences

#### 5. Component Architecture and Dependencies

##### 5.1 Shared Component Library
```
src/
├── shared/
│   ├── components/
│   │   ├── ui/ (Base UI components)
│   │   ├── layout/ (Layout components)
│   │   ├── navigation/ (Navigation components)
│   │   └── forms/ (Reusable form components)
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── usePermissions.js
│   │   └── useNavigation.js
│   └── utils/
│       ├── roleManager.js
│       ├── permissionChecker.js
│       └── navigationResolver.js
├── apps/
│   ├── expenses/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   ├── exams/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   └── settings/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── utils/
```

##### 5.2 Dependency Resolution System
```typescript
interface ComponentDependency {
  id: string;
  version: string;
  required: boolean;
  fallback?: React.ComponentType;
}

class DependencyResolver {
  resolveDependencies(component: string): ComponentDependency[];
  checkCompatibility(dependencies: ComponentDependency[]): boolean;
  loadComponent(id: string, fallback?: React.ComponentType): Promise<React.ComponentType>;
}
```

#### 6. Feature Visibility and Access Control

##### 6.1 Permission System
```typescript
interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  conditions?: {
    department?: string;
    ownership?: boolean;
    status?: string;
  };
}

interface RoleDefinition {
  id: string;
  name: string;
  permissions: Permission[];
  inherits?: string[];
}
```

##### 6.2 Feature Toggle System
```typescript
interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  roles?: string[];
  conditions?: {
    environment?: string;
    userCount?: number;
    timeRange?: [Date, Date];
  };
}
```

#### 7. Integration Patterns

##### 7.1 Inter-App Communication
**Event Bus Pattern:**
```typescript
interface AppEvent {
  type: string;
  source: string;
  target?: string;
  payload: any;
  timestamp: Date;
}

class EventBus {
  publish(event: AppEvent): void;
  subscribe(eventType: string, handler: (event: AppEvent) => void): void;
  unsubscribe(eventType: string, handler: Function): void;
}
```

**Shared Data Pattern:**
```typescript
interface SharedDataStore {
  user: UserProfile;
  notifications: Notification[];
  settings: SystemSettings;
  cache: Map<string, any>;
}
```

##### 7.2 Data Synchronization
- Real-time updates using Supabase subscriptions
- Optimistic UI updates with rollback capability
- Background sync for offline scenarios
- Conflict resolution strategies

#### 8. Database Schema Extensions

##### 8.1 Enhanced User Management
```sql
-- Extended users table
ALTER TABLE users ADD COLUMN department_id UUID REFERENCES departments(id);
ALTER TABLE users ADD COLUMN employee_id VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN address TEXT;
ALTER TABLE users ADD COLUMN hire_date DATE;
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';

-- New tables
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    head_id UUID REFERENCES users(id),
    budget_limit DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(50) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    actions TEXT[] NOT NULL,
    conditions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT FALSE,
    roles TEXT[],
    conditions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

##### 8.2 Enhanced Exams Management Schema with Exam Officer Support
```sql
-- Enhanced subjects table with assignment tracking
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    department_id UUID REFERENCES departments(id),
    credits INTEGER DEFAULT 3,
    assigned_by UUID REFERENCES users(id), -- Exam Officer or Administrator
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes/Groups management
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    department_id UUID REFERENCES departments(id),
    semester INTEGER,
    academic_year VARCHAR(10),
    managed_by UUID REFERENCES users(id), -- Exam Officer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced exams table with deadline tracking
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id),
    class_id UUID REFERENCES classes(id),
    exam_type VARCHAR(50) NOT NULL, -- 'midterm', 'final', 'quiz'
    exam_date DATE NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    total_marks INTEGER NOT NULL,
    pass_marks INTEGER NOT NULL,
    result_submission_deadline DATE NOT NULL,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id), -- Manager or Exam Officer approval
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student enrollments with class tracking
CREATE TABLE student_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id),
    class_id UUID REFERENCES classes(id),
    subject_id UUID REFERENCES subjects(id),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    enrolled_by UUID REFERENCES users(id), -- Exam Officer
    status VARCHAR(20) DEFAULT 'active',
    grade VARCHAR(5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subject assignments (shared between Exam Officers and Teachers)
CREATE TABLE subject_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id),
    teacher_id UUID REFERENCES users(id),
    assigned_by UUID REFERENCES users(id), -- Exam Officer or Administrator
    assignment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(subject_id, teacher_id)
);

-- Test result submission tracking
CREATE TABLE result_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id),
    teacher_id UUID REFERENCES users(id),
    submission_date TIMESTAMP WITH TIME ZONE,
    deadline_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'submitted', 'overdue'
    reminder_count INTEGER DEFAULT 0,
    last_reminder_sent TIMESTAMP WITH TIME ZONE,
    escalated_to UUID REFERENCES users(id),
    escalation_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(exam_id, teacher_id)
);

-- Notification tracking system
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID REFERENCES users(id),
    sender_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL, -- 'deadline_reminder', 'overdue_alert', 'escalation'
    method VARCHAR(20) NOT NULL, -- 'whatsapp', 'email', 'system'
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_exam_id UUID REFERENCES exams(id),
    related_submission_id UUID REFERENCES result_submissions(id),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'read'
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance tracking for reporting
CREATE TABLE compliance_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id),
    teacher_id UUID REFERENCES users(id),
    submission_deadline DATE NOT NULL,
    submitted_on_time BOOLEAN,
    days_overdue INTEGER DEFAULT 0,
    compliance_score DECIMAL(5,2), -- 0-100 score
    department_id UUID REFERENCES departments(id),
    tracked_by UUID REFERENCES users(id), -- Exam Officer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 9. Security Architecture

##### 9.1 Enhanced Authentication
- Multi-factor authentication support
- Role-based session management
- JWT token handling with refresh tokens
- Audit logging for security events

##### 9.2 Authorization Patterns
```typescript
class AuthorizationService {
  checkPermission(user: User, resource: string, action: string): boolean;
  getAvailableActions(user: User, resource: string): string[];
  filterByPermissions<T>(user: User, items: T[], permission: string): T[];
}
```

#### 10. Performance and Scalability

##### 10.1 Code Splitting Strategy
- App-level code splitting
- Route-based lazy loading
- Component-level dynamic imports
- Shared dependency optimization

##### 10.2 Caching Strategy
- Application-level caching
- API response caching
- Static asset optimization
- Database query optimization

#### 11. Development and Deployment

##### 11.1 Development Workflow
- Feature-based development branches
- App-specific testing strategies
- Integration testing between apps
- Role-based testing scenarios

##### 11.2 Deployment Strategy
- Micro-frontend deployment approach
- Feature flag-based rollouts
- Environment-specific configurations
- Monitoring and alerting

#### 12. Migration Strategy

##### 12.1 Phased Implementation
**Phase 1:** Foundation (2-3 weeks)
- Implement extended role system
- Create navigation framework
- Develop shared component library

**Phase 2:** App Development (4-6 weeks)
- Enhance existing Expenses app
- Develop Exams app core features
- Implement Settings app

**Phase 3:** Integration (2-3 weeks)
- Inter-app communication
- Data synchronization
- Performance optimization

**Phase 4:** Testing and Deployment (2-3 weeks)
- Comprehensive testing
- Security auditing
- Production deployment

##### 12.2 Backward Compatibility
- Legacy role mapping
- Existing data migration
- Gradual feature rollout
- Rollback strategies

### Conclusion

This multi-app architecture provides a scalable, maintainable foundation for educational institution management. The design emphasizes:

1. **Modularity:** Clear separation between applications
2. **Security:** Comprehensive role-based access control
3. **Flexibility:** Dynamic feature visibility and configuration
4. **Performance:** Optimized loading and caching strategies
5. **Extensibility:** Easy addition of new applications and features

The architecture supports both current requirements and future growth, ensuring long-term sustainability and user satisfaction.