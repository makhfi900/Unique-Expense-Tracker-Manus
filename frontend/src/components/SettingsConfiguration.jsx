import React, { useState } from 'react';
import { useAuth } from '../context/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { 
  Settings, 
  Users, 
  Database, 
  FileText, 
  Shield,
  User,
  Palette,
  Info,
  Clock,
  HardDrive,
  ChevronRight,
  ArrowLeft,
  Eye
} from 'lucide-react';
import RoleManagement from './RoleManagement';
import FeatureVisibilityConfiguration from './settings/FeatureVisibilityConfiguration';

/**
 * SettingsConfiguration Component
 * 
 * Implements Story 1.1: Settings App Landing Page
 * - Administrator-only access (handled by AppContainer)
 * - Role-based feature configuration options
 * - Consistent UI/UX with existing expense tracker design
 * - Basic landing page layout with feature placeholders
 */
const SettingsConfiguration = () => {
  const { user, isAdmin, getUserRole } = useAuth();
  const userRole = getUserRole();
  const [currentView, setCurrentView] = useState('overview'); // 'overview' | 'role-management' | 'feature-visibility'


  // If viewing role management, show that component
  if (currentView === 'role-management') {
    return (
      <div data-testid="settings-landing-page" className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-indigo-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Navigation */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setCurrentView('overview')}
              className="flex items-center gap-2 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Settings Overview
            </Button>
          </div>
          
          {/* Role Management Component */}
          <RoleManagement />
        </div>
      </div>
    );
  }

  // If viewing feature visibility, show that component
  if (currentView === 'feature-visibility') {
    return (
      <div data-testid="settings-landing-page" className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-indigo-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Navigation */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setCurrentView('overview')}
              className="flex items-center gap-2 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Settings Overview
            </Button>
          </div>
          
          {/* Feature Visibility Configuration Component */}
          <FeatureVisibilityConfiguration />
        </div>
      </div>
    );
  }

  return (
    <div data-testid="settings-landing-page" className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-indigo-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500 text-white rounded-xl">
              <Settings className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings Configuration</h1>
              <p className="text-muted-foreground mt-1">
                Configure system settings and manage your expense tracker environment
              </p>
            </div>
          </div>
          
          {/* User Role Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {userRole === 'admin' ? 'Administrator' : 'Account Officer'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Logged in as: {user?.email}
            </span>
          </div>
        </div>

        {/* Role-Based Features Container */}
        <div data-testid="role-based-features">
          {/* Administrator Features */}
          {isAdmin && (
            <div data-testid="admin-features-section" className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-500" />
                Administrator Features
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Role Management - Now Implemented */}
                <Card data-testid="user-management-feature" className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('role-management')}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5 text-blue-500" />
                      Role Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Manage user roles, permissions, and role-based access control across the system.
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          Available
                        </div>
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                {/* Feature Visibility Configuration - Story 1.3 */}
                <Card data-testid="feature-visibility-feature" className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('feature-visibility')}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="h-5 w-5 text-purple-500" />
                      Feature Visibility
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Configure which features are visible to different user roles with dependency management.
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          Available
                        </div>
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                {/* System Configuration */}
                <Card data-testid="system-configuration-feature" className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Database className="h-5 w-5 text-green-500" />
                      System Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Configure system-wide settings, database connections, and integrations.
                    </p>
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        System Configuration (Coming Soon)
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                {/* Audit Logs */}
                <Card data-testid="audit-logs-feature" className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5 text-orange-500" />
                      Audit Logs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      View and manage system audit logs, user activities, and security events.
                    </p>
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Audit Logs (Coming Soon)
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                {/* Backup & Restore */}
                <Card data-testid="backup-restore-feature" className="hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-3">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <HardDrive className="h-5 w-5 text-purple-500" />
                      Backup & Restore
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Create system backups, schedule automated backups, and restore data when needed.
                    </p>
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Backup & Restore (Coming Soon)
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Account Officer Features - Currently not displayed for admin-only Settings */}
          {userRole === 'account_officer' && (
            <div data-testid="account-officer-features" className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-6">Account Officer Features</h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    Limited settings access
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* General Features Available to All Users */}
          <div data-testid="general-features-section">
            <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <User className="h-6 w-6 text-indigo-500" />
              General Settings
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Settings */}
              <Card data-testid="profile-settings-feature" className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-indigo-500" />
                    Profile Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Update your personal profile information, contact details, and avatar.
                  </p>
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Profile Settings (Coming Soon)
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Preferences */}
              <Card data-testid="preferences-feature" className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Palette className="h-5 w-5 text-pink-500" />
                    Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Customize your experience with theme preferences, notifications, and display settings.
                  </p>
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Preferences (Coming Soon)
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer Information */}
        <div className="mt-12 pt-8 border-t border-border">
          <Card className="bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Settings Configuration - Story 1.1
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    This Settings app landing page provides role-based access to configuration options. 
                    Administrator-only access ensures secure system management while maintaining consistent 
                    UI/UX with the existing expense tracker design.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Role-Based Access
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Administrator Features
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Supabase Integration
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      shadcn/ui Components
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsConfiguration;