import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { 
  DollarSign, 
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
import ExpenseList from './ExpenseList';
import ExpenseForm from './ExpenseForm';
import CategoryManager from './CategoryManager';
import UserManager from './UserManager';
import EnhancedAnalytics from './EnhancedAnalytics';
import CSVImportExport from './CSVImportExport';
import LoginActivityTracker from './LoginActivityTracker';

const Dashboard = () => {
  const { user, logout, isAdmin, isAccountOfficer } = useAuth();
  const [activeTab, setActiveTab] = useState('expenses');

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-blue-600 p-2 rounded-lg mr-3">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Unique Expense Tracker
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user?.full_name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant={isAdmin ? "default" : "secondary"}>
                {user?.role === 'admin' ? 'Administrator' : 'Account Officer'}
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
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7">
            <TabsTrigger value="expenses" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="add-expense" className="flex items-center">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Expense
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="analytics" className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            )}
            <TabsTrigger value="import-export" className="flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Import/Export
            </TabsTrigger>
            {(isAdmin || isAccountOfficer) && (
              <TabsTrigger value="categories" className="flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Categories
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="users" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="login-activity" className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Login Activity
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="expenses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Expense Management</CardTitle>
                <CardDescription>
                  {isAccountOfficer 
                    ? "View and manage your expenses. Use the date filter to view expenses for a specific date."
                    : "View and manage all expenses in the system."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExpenseList />
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
                <ExpenseForm onSuccess={() => setActiveTab('expenses')} />
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="analytics" className="space-y-6">
              <EnhancedAnalytics />
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
                <CSVImportExport />
              </CardContent>
            </Card>
          </TabsContent>

          {(isAdmin || isAccountOfficer) && (
            <TabsContent value="categories" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Category Management</CardTitle>
                  <CardDescription>
                    Create and manage expense categories.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CategoryManager />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage user accounts and permissions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UserManager />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="login-activity" className="space-y-6">
              <LoginActivityTracker />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;

