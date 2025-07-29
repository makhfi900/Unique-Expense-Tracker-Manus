import React, { useState, Suspense, lazy, useMemo } from 'react';
import { useAuth } from '../context/SupabaseAuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import ThemeToggle from './ThemeToggle';
import GridNavigation from './GridNavigation';
import Breadcrumb from './Breadcrumb';
import { 
  LogOut, 
  Users, 
  PlusCircle, 
  BarChart3, 
  Settings,
  FileText,
  Upload,
  Shield,
  ArrowLeft
} from 'lucide-react';

// Lazy load components to improve initial load time
const ExpenseList = lazy(() => import('./OptimizedExpenseList'));
const ExpenseForm = lazy(() => import('./ExpenseForm'));
const CategoryManager = lazy(() => import('./CategoryManager'));
const UserManager = lazy(() => import('./UserManager'));
const EnhancedAnalytics = lazy(() => import('./EnhancedAnalytics'));
const CSVImportExport = lazy(() => import('./OptimizedCSVImportExport'));
const LoginActivityTracker = lazy(() => import('./LoginActivityTracker'));

// Loading component for suspense
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    <span className="ml-2 text-muted-foreground">Loading...</span>
  </div>
);

const Dashboard = React.memo(() => {
  const { user, userProfile, logout, isAdmin, isAccountOfficer, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = () => {
    logout();
  };

  // Memoize user info to prevent unnecessary re-renders
  const userInfo = useMemo(() => ({
    name: userProfile?.full_name || user?.user_metadata?.full_name || user?.email,
    role: userProfile?.role || user?.user_metadata?.role || 'account_officer',
    isAdmin,
    isAccountOfficer
  }), [userProfile?.full_name, userProfile?.role, user?.user_metadata?.full_name, user?.email, user?.user_metadata?.role, isAdmin, isAccountOfficer]);

  // Memoize section configuration with descriptions for grid navigation
  const sectionConfig = useMemo(() => {
    if (loading || !userProfile) {
      // Show basic sections while loading
      return [
        { 
          id: 'expenses', 
          label: 'View Expenses', 
          icon: FileText, 
          show: true,
          description: 'Browse and manage your expense records',
          adminOnly: false
        },
        { 
          id: 'add-expense', 
          label: 'Add Expense', 
          icon: PlusCircle, 
          show: true,
          description: 'Record a new expense quickly and easily',
          adminOnly: false
        }
      ];
    }
    
    return [
      { 
        id: 'expenses', 
        label: 'View Expenses', 
        icon: FileText, 
        show: true,
        description: userInfo.isAccountOfficer 
          ? 'View and manage your personal expenses with date filtering'
          : 'Browse and manage all expense records in the system',
        adminOnly: false
      },
      { 
        id: 'add-expense', 
        label: 'Add New Expense', 
        icon: PlusCircle, 
        show: true,
        description: 'Record a new expense with details and categorization',
        adminOnly: false
      },
      { 
        id: 'analytics', 
        label: 'Analytics Dashboard', 
        icon: BarChart3, 
        show: isAdmin,
        description: 'View comprehensive reports, charts, and spending insights',
        adminOnly: true
      },
      { 
        id: 'import-export', 
        label: 'Import & Export', 
        icon: Upload, 
        show: true,
        description: 'Import expenses from CSV files or export your data',
        adminOnly: false
      },
      { 
        id: 'categories', 
        label: 'Manage Categories', 
        icon: Settings, 
        show: isAdmin || isAccountOfficer,
        description: 'Create and organize expense categories with custom colors',
        adminOnly: false
      },
      { 
        id: 'users', 
        label: 'User Management', 
        icon: Users, 
        show: isAdmin,
        description: 'Manage user accounts, roles, and permissions',
        adminOnly: true
      },
      { 
        id: 'login-activity', 
        label: 'Security & Activity', 
        icon: Shield, 
        show: isAdmin,
        description: 'Monitor user login activities and security events',
        adminOnly: true
      }
    ];
  }, [loading, userProfile, isAdmin, isAccountOfficer, userInfo]);

  // Current section details for breadcrumb
  const currentSection = sectionConfig.find(section => section.id === activeTab);
  const showMainNavigation = activeTab === 'dashboard' || !activeTab;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center">
              <div className="mr-4">
                <img src="/assets/logo.png" alt="College Logo" className="h-10 w-10 sm:h-12 sm:w-12" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  Unique Expense Tracker
                </h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {userInfo.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Badge 
                variant={userInfo.isAdmin ? "default" : "secondary"}
                className="hidden sm:inline-flex"
              >
                {userInfo.role === 'admin' ? 'Administrator' : 'Account Officer'}
              </Badge>
              <ThemeToggle />
              <Button 
                variant="outline" 
                onClick={handleLogout}
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back to Dashboard Button */}
        {!showMainNavigation && (
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab('dashboard')} 
              className="text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Breadcrumb 
              currentSection={activeTab} 
              sectionTitle={currentSection?.label || 'Section'} 
            />
          </div>
        )}

        {/* Main Navigation Grid */}
        {showMainNavigation && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
                Dashboard
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Choose an action below to manage your expenses, view analytics, or configure your account
              </p>
            </div>
            
            <GridNavigation 
              sections={sectionConfig}
              activeSection={activeTab}
              onSectionChange={setActiveTab}
            />
          </div>
        )}

        {/* Content Sections */}
        {!showMainNavigation && (
          <div className="space-y-6">
            {activeTab === 'expenses' && (
              <Card className="shadow-lg rounded-lg border-2">
                <CardHeader className="bg-muted/50 border-b border-border px-6 py-6">
                  <CardTitle className="text-2xl font-bold flex items-center text-foreground">
                    <FileText className="h-6 w-6 mr-3 text-blue-600" />
                    Expense Management
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground mt-2 leading-relaxed">
                    {userInfo.isAccountOfficer 
                      ? "View and manage your personal expenses. Use the date filter to view expenses for a specific date."
                      : "Browse and manage all expense records in the system with comprehensive filtering options."
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <ExpenseList />
                  </Suspense>
                </CardContent>
              </Card>
            )}

            {activeTab === 'add-expense' && (
              <Card className="shadow-lg rounded-lg border-2">
                <CardHeader className="bg-muted/50 border-b border-border px-6 py-6">
                  <CardTitle className="text-2xl font-bold flex items-center text-foreground">
                    <PlusCircle className="h-6 w-6 mr-3 text-green-600" />
                    Add New Expense
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground mt-2 leading-relaxed">
                    Record a new expense with detailed information and proper categorization for accurate tracking.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <ExpenseForm onSuccess={() => setActiveTab('expenses')} />
                  </Suspense>
                </CardContent>
              </Card>
            )}

            {activeTab === 'analytics' && userInfo.isAdmin && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
                  <p className="text-muted-foreground">Comprehensive insights and reports on expense data</p>
                </div>
                <Suspense fallback={<LoadingSpinner />}>
                  <EnhancedAnalytics />
                </Suspense>
              </div>
            )}

            {activeTab === 'import-export' && (
              <Card className="shadow-lg rounded-lg border-2">
                <CardHeader className="bg-muted/50 border-b border-border px-6 py-6">
                  <CardTitle className="text-2xl font-bold flex items-center text-foreground">
                    <Upload className="h-6 w-6 mr-3 text-purple-600" />
                    Import & Export Data
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground mt-2 leading-relaxed">
                    Import expenses from CSV files or export your current data for external analysis and backup.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <CSVImportExport />
                  </Suspense>
                </CardContent>
              </Card>
            )}

            {activeTab === 'categories' && (userInfo.isAdmin || userInfo.isAccountOfficer) && (
              <Card className="shadow-lg rounded-lg border-2">
                <CardHeader className="bg-muted/50 border-b border-border px-6 py-6">
                  <CardTitle className="text-2xl font-bold flex items-center text-foreground">
                    <Settings className="h-6 w-6 mr-3 text-orange-600" />
                    Category Management
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground mt-2 leading-relaxed">
                    Create, organize, and manage expense categories with custom colors and detailed descriptions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <CategoryManager />
                  </Suspense>
                </CardContent>
              </Card>
            )}

            {activeTab === 'users' && userInfo.isAdmin && (
              <Card className="shadow-lg rounded-lg border-2">
                <CardHeader className="bg-muted/50 border-b border-border px-6 py-6">
                  <CardTitle className="text-2xl font-bold flex items-center text-foreground">
                    <Users className="h-6 w-6 mr-3 text-indigo-600" />
                    User Management
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground mt-2 leading-relaxed">
                    Manage user accounts, assign roles, and control access permissions for system security.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <UserManager />
                  </Suspense>
                </CardContent>
              </Card>
            )}

            {activeTab === 'login-activity' && userInfo.isAdmin && (
              <Card className="shadow-lg rounded-lg border-2">
                <CardHeader className="bg-muted/50 border-b border-border px-6 py-6">
                  <CardTitle className="text-2xl font-bold flex items-center text-foreground">
                    <Shield className="h-6 w-6 mr-3 text-slate-600" />
                    Security & Login Activity
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground mt-2 leading-relaxed">
                    Monitor user login activities, track security events, and maintain system audit logs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <LoginActivityTracker />
                  </Suspense>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;