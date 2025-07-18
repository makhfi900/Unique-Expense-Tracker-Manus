import React, { useState } from 'react';
import { useAuth } from '../context/SupabaseAuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, UserCheck, User } from 'lucide-react';

const SupabaseLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, loginAsAdmin, loginAsOfficer } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn(email, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleDemoLogin = async (type) => {
    setError('');
    setLoading(true);

    let result;
    if (type === 'admin') {
      result = await loginAsAdmin();
    } else {
      result = await loginAsOfficer();
    }
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">Rs</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Expense Tracker</CardTitle>
          <CardDescription>
            Sign in with Supabase Authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Demo Accounts
                </span>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleDemoLogin('admin')}
                disabled={loading}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Login as Admin
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleDemoLogin('officer')}
                disabled={loading}
              >
                <User className="mr-2 h-4 w-4" />
                Login as Account Officer
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p className="mb-2">🚀 <strong>Powered by Supabase Auth</strong></p>
            <div className="text-xs space-y-1">
              <p><strong>Demo Credentials:</strong></p>
              <p>Admin: admin@expensetracker.com / admin123</p>
              <p>Officer: officer@expensetracker.com / officer123</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
            <p className="font-medium mb-1">✨ New Features:</p>
            <ul className="space-y-1">
              <li>• Automatic session management</li>
              <li>• Secure token handling</li>
              <li>• Real-time auth state sync</li>
              <li>• Built-in security with RLS</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseLogin;