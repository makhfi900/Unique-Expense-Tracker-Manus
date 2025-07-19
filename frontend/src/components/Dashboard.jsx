import React, { useState, Suspense, lazy, useMemo } from 'react';
import { useAuth } from '../context/SupabaseAuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { 
  LogOut, 
  Users, 
  PlusCircle, 
  BarChart3, 
  Settings,
  FileText,
  Upload,
  Shield,
  Download
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
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
);

const Dashboard = React.memo(() => {
  const { user, userProfile, logout, isAdmin, isAccountOfficer, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('expenses');

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

  // Memoize tab configuration to prevent recalculation
  // Wait for userProfile to load before determining admin tabs
  const tabConfig = useMemo(() => {
    if (loading || !userProfile) {
      // Show basic tabs while loading
      return [
        { id: 'expenses', label: 'Expenses', icon: FileText, show: true },
        { id: 'add-expense', label: 'Add Expense', icon: PlusCircle, show: true },
        { id: 'import-export', label: 'Import/Export', icon: Upload, show: true }
      ];
    }
    
    return [
      { id: 'expenses', label: 'Expenses', icon: FileText, show: true },
      { id: 'add-expense', label: 'Add Expense', icon: PlusCircle, show: true },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, show: isAdmin },
      { id: 'import-export', label: 'Import/Export', icon: Upload, show: true },
      { id: 'categories', label: 'Categories', icon: Settings, show: isAdmin || isAccountOfficer },
      { id: 'users', label: 'Users', icon: Users, show: isAdmin },
      { id: 'login-activity', label: 'Login Activity', icon: Shield, show: isAdmin }
    ];
  }, [loading, userProfile, isAdmin, isAccountOfficer]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="mr-4">
                <img src="/assets/logo.png" alt="College Logo" className="h-12 w-12" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Unique Expense Tracker
                </h1>
                <p className="text-sm text-slate-600">
                  Welcome back, {userInfo.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge 
                variant={userInfo.isAdmin ? "default" : "secondary"}
                className={userInfo.isAdmin ? 
                  "bg-blue-600 text-white px-3 py-1" : 
                  "bg-slate-600 text-white px-3 py-1"
                }
              >
                {userInfo.role === 'admin' ? 'Administrator' : 'Account Officer'}
              </Badge>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Elegant Navigation */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
            {/* Navigation Header */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b border-slate-200/60">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                Dashboard Navigation
              </h2>
              <p className="text-sm text-slate-600 mt-1">Select a section to manage your expenses</p>
            </div>
            
            {/* Enhanced Tab Navigation */}
            <div className="p-6">
              <TabsList className="grid w-full bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-2 shadow-inner border border-slate-200/50" style={{gridTemplateColumns: `repeat(${tabConfig.filter(tab => tab.show).length}, 1fr)`}}>
                {tabConfig.map(tab => {
                  if (!tab.show) return null;
                  const Icon = tab.icon;
                  
                  // Define colors for each tab with better contrast
                  const tabColors = {
                    'expenses': 'data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-200/50',
                    'add-expense': 'data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-200/50',
                    'analytics': 'data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-200/50',
                    'import-export': 'data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-200/50',
                    'categories': 'data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-red-200/50',
                    'users': 'data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-200/50',
                    'login-activity': 'data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-slate-200/50'
                  };
                  
                  return (
                    <TabsTrigger 
                      key={tab.id} 
                      value={tab.id} 
                      className={`group relative flex flex-col items-center justify-center gap-y-1 px-2 py-2 rounded-lg font-semibold text-xs transition-all duration-300 
                        ${tabColors[tab.id]} data-[state=active]:scale-105 data-[state=active]:font-bold
                        data-[state=inactive]:text-slate-700 data-[state=inactive]:hover:text-slate-900 data-[state=inactive]:hover:bg-white/90 data-[state=inactive]:hover:shadow-lg data-[state=inactive]:hover:scale-102
                        border border-transparent data-[state=active]:border-white/30`}
                    >
                      {/* Icon */}
                      <Icon className="h-5 w-5 mb-1 transition-transform group-hover:scale-110 flex-shrink-0" />
                      
                      {/* Text positioned at bottom with proper padding */}
                      <span className="text-center leading-tight font-semibold">{tab.label}</span>
                      
                      {/* Active indicator */}
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-current rounded-full transition-all duration-300 group-data-[state=active]:w-8"></div>
                      
                      {/* Subtle glow effect */}
                      <div className="absolute inset-0 rounded-lg bg-current opacity-0 group-data-[state=active]:opacity-10 transition-opacity duration-300"></div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          </div>

          <TabsContent value="expenses" className="space-y-6">
            <Card className="bg-white shadow-sm border border-slate-200 rounded-lg">
              <CardHeader className="bg-blue-50 border-b border-blue-100">
                <CardTitle className="text-xl font-semibold flex items-center text-slate-900">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Expense Management
                </CardTitle>
                <CardDescription className="text-slate-600">
                  {userInfo.isAccountOfficer 
                    ? "View and manage your expenses. Use the date filter to view expenses for a specific date."
                    : "View and manage all expenses in the system."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Suspense fallback={<LoadingSpinner />}>
                  <ExpenseList />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add-expense" className="space-y-6">
            <Card className="bg-white shadow-sm border border-slate-200 rounded-lg">
              <CardHeader className="bg-green-50 border-b border-green-100">
                <CardTitle className="text-xl font-semibold flex items-center text-slate-900">
                  <PlusCircle className="h-5 w-5 mr-2 text-green-600" />
                  Add New Expense
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Record a new expense with details and categorization.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Suspense fallback={<LoadingSpinner />}>
                  <ExpenseForm onSuccess={() => setActiveTab('expenses')} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          {userInfo.isAdmin && (
            <TabsContent value="analytics" className="space-y-6">
              <Suspense fallback={<LoadingSpinner />}>
                <EnhancedAnalytics />
              </Suspense>
            </TabsContent>
          )}

          <TabsContent value="import-export" className="space-y-6">
            <Card className="bg-white shadow-sm border border-slate-200 rounded-lg">
              <CardHeader className="bg-purple-50 border-b border-purple-100">
                <CardTitle className="text-xl font-semibold flex items-center text-slate-900">
                  <Upload className="h-5 w-5 mr-2 text-purple-600" />
                  Import & Export
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Import expenses from CSV files or export current data.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Suspense fallback={<LoadingSpinner />}>
                  <CSVImportExport />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          {(userInfo.isAdmin || userInfo.isAccountOfficer) && (
            <TabsContent value="categories" className="space-y-6">
              <Card className="bg-white shadow-sm border border-slate-200 rounded-lg">
                <CardHeader className="bg-orange-50 border-b border-orange-100">
                  <CardTitle className="text-xl font-semibold flex items-center text-slate-900">
                    <Settings className="h-5 w-5 mr-2 text-orange-600" />
                    Category Management
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Create and manage expense categories.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <CategoryManager />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {userInfo.isAdmin && (
            <TabsContent value="users" className="space-y-6">
              <Card className="bg-white shadow-sm border border-slate-200 rounded-lg">
                <CardHeader className="bg-indigo-50 border-b border-indigo-100">
                  <CardTitle className="text-xl font-semibold flex items-center text-slate-900">
                    <Users className="h-5 w-5 mr-2 text-indigo-600" />
                    User Management
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Manage user accounts and permissions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <UserManager />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {userInfo.isAdmin && (
            <TabsContent value="login-activity" className="space-y-6">
              <Card className="bg-white shadow-sm border border-slate-200 rounded-lg">
                <CardHeader className="bg-slate-50 border-b border-slate-100">
                  <CardTitle className="text-xl font-semibold flex items-center text-slate-900">
                    <Shield className="h-5 w-5 mr-2 text-slate-600" />
                    Login Activity
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Monitor user login activities and security events.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <LoginActivityTracker />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;

