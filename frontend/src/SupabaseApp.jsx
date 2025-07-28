import React from 'react';
import { AuthProvider, useAuth } from './context/SupabaseAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import SupabaseLogin from './components/SupabaseLogin';
import Dashboard from './components/Dashboard';
import { Loader2 } from 'lucide-react';
import './App.css';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-foreground">Loading...</p>
          <p className="text-sm text-muted-foreground mt-2">Initializing Supabase Auth...</p>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <SupabaseLogin />;
}

function SupabaseApp() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default SupabaseApp;