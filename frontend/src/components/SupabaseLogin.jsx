import React, { useState } from 'react';
import { useAuth } from '../context/SupabaseAuthContext';
import { getPlainErrorMessage } from '../utils/errorMessages';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { Loader2, Eye, EyeOff, Lock, Mail } from 'lucide-react';

const SupabaseLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn(email, password);

    if (!result.success) {
      setError(getPlainErrorMessage(result.error, 'auth'));
    }

    setLoading(false);
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-lg shadow-2xl border-2">
        <CardHeader className="text-center pb-8 px-6 sm:px-8 pt-8">
          <div className="flex justify-center mb-8">
            <img 
              src="/new_logo_capital1.PNG" 
              alt="College Logo" 
              className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 object-contain"
            />
          </div>
          <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Expense Tracker
          </CardTitle>
          <CardDescription className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            Welcome back! Please sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <Alert variant="destructive" className="border-2">
                <AlertDescription className="text-sm sm:text-base leading-relaxed">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Label htmlFor="email" className="text-foreground font-semibold text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-14 text-base pl-4 pr-4 border-2 focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="text-foreground font-semibold text-base flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-14 text-base pl-4 pr-14 border-2 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                  disabled={loading}
                  className="w-5 h-5"
                />
                <Label 
                  htmlFor="remember" 
                  className="text-sm text-muted-foreground cursor-pointer font-medium"
                >
                  Keep me signed in
                </Label>
              </div>
              <button
                type="button"
                className="text-sm text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline transition-all"
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full h-14 text-base font-semibold transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl" 
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Signing you in...
                  </>
                ) : (
                  'Sign In to Continue'
                )}
              </Button>
            </div>
          </form>

        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseLogin;