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
  const { user, logout, isAdmin, isAccountOfficer } = useAuth();
  const [activeTab, setActiveTab] = useState('expenses');

  const handleLogout = () => {
    logout();
  };

  // Memoize user info to prevent unnecessary re-renders
  const userInfo = useMemo(() => ({
    name: user?.full_name,
    role: user?.role,
    isAdmin,
    isAccountOfficer
  }), [user?.full_name, user?.role, isAdmin, isAccountOfficer]);

  // Memoize tab configuration to prevent recalculation
  const tabConfig = useMemo(() => [
    { id: 'expenses', label: 'Expenses', icon: FileText, show: true },
    { id: 'add-expense', label: 'Add Expense', icon: PlusCircle, show: true },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, show: isAdmin },
    { id: 'import-export', label: 'Import/Export', icon: Upload, show: true },
    { id: 'categories', label: 'Categories', icon: Settings, show: isAdmin || isAccountOfficer },
    { id: 'users', label: 'Users', icon: Users, show: isAdmin },
    { id: 'login-activity', label: 'Login Activity', icon: Shield, show: isAdmin }
  ], [isAdmin, isAccountOfficer]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-blue-600 p-2 rounded-lg mr-3 flex items-center justify-center">
                <span className="text-white font-bold text-lg">Rs</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Unique Expense Tracker
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {userInfo.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant={userInfo.isAdmin ? "default" : "secondary"}>
                {userInfo.role === 'admin' ? 'Administrator' : 'Account Officer'}
              </Badge>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full grid-cols-2 lg:grid-cols-${tabConfig.filter(tab => tab.show).length}`}>
            {tabConfig.map(tab => {
              if (!tab.show) return null;
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center">
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="expenses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Expense Management</CardTitle>
                <CardDescription>
                  {userInfo.isAccountOfficer 
                    ? "View and manage your expenses. Use the date filter to view expenses for a specific date."
                    : "View and manage all expenses in the system."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<LoadingSpinner />}>
                  <ExpenseList />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add-expense" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Expense</CardTitle>
                <CardDescription>
                  Record a new expense with details and categorization.
                </CardDescription>
              </CardHeader>
              <CardContent>
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
            <Card>
              <CardHeader>
                <CardTitle>Import & Export</CardTitle>
                <CardDescription>
                  Import expenses from CSV files or export current data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<LoadingSpinner />}>
                  <CSVImportExport />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          {(userInfo.isAdmin || userInfo.isAccountOfficer) && (
            <TabsContent value="categories" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Category Management</CardTitle>
                  <CardDescription>
                    Create and manage expense categories.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingSpinner />}>
                    <CategoryManager />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {userInfo.isAdmin && (
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage user accounts and permissions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingSpinner />}>
                    <UserManager />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {userInfo.isAdmin && (
            <TabsContent value="login-activity" className="space-y-6">
              <Suspense fallback={<LoadingSpinner />}>
                <LoginActivityTracker />
              </Suspense>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;

