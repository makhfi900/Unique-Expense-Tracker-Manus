import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import ThemeToggle from './ThemeToggle';
import GridNavigation from './GridNavigation';
import OptimizedLogo from './OptimizedLogo';
import { 
  LogOut, 
  Users, 
  PlusCircle, 
  BarChart3, 
  Settings,
  FileText,
  Upload,
  Shield,
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Calendar,
  Target,
  Zap,
  Sparkles,
  Eye,
  ExternalLink
} from 'lucide-react';

const DemoLanding = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Demo user info for showcase
  const demoUserInfo = {
    name: 'Demo User',
    role: 'admin',
    isAdmin: true,
    isAccountOfficer: false
  };

  // Demo sections configuration - same as Dashboard but for showcase
  const sectionConfig = useMemo(() => [
    { 
      id: 'expenses', 
      label: 'View Expenses', 
      icon: FileText, 
      show: true,
      description: 'View and manage your personal expenses with date filtering',
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
      show: true,
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
      show: true,
      description: 'Create and organize expense categories with custom colors',
      adminOnly: false
    },
    { 
      id: 'users', 
      label: 'User Management', 
      icon: Users, 
      show: true,
      description: 'Manage user accounts, roles, and permissions',
      adminOnly: true
    },
    { 
      id: 'login-activity', 
      label: 'Security & Activity', 
      icon: Shield, 
      show: true,
      description: 'Monitor user login activities and security events',
      adminOnly: true
    }
  ], []);

  const showMainNavigation = activeTab === 'dashboard' || !activeTab;

  const handleLoginRedirect = () => {
    // Remove demo parameters and redirect to login
    const url = new URL(window.location);
    url.searchParams.delete('demo');
    url.searchParams.delete('preview');
    window.location.href = url.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40">
      {/* Demo Banner */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-3 text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 backdrop-blur-sm"></div>
        <div className="relative z-10 flex items-center justify-center space-x-3">
          <Eye className="h-5 w-5 animate-pulse" />
          <span className="font-semibold text-sm sm:text-base">
            🎯 DEMO MODE: Showcasing Beautiful Dashboard Design
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLoginRedirect}
            className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm text-xs sm:text-sm"
          >
            <ExternalLink className="h-3 w-3 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Access </span>Login
          </Button>
        </div>
      </motion.div>

      {/* Modern Glass Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 shadow-lg border-b border-white/20 dark:border-slate-800/30 sticky top-12 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center"
            >
              <OptimizedLogo 
                size="medium" 
                className="mr-3 sm:mr-4" 
                priority={true}
                animated={true}
                showGlow={true}
              />
              <div>
                <h1 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent leading-tight">
                  <span className="block xs:inline">Unique</span>
                  <span className="block xs:inline xs:ml-1">Expense Tracker</span>
                </h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-tight"
                >
                  <span className="hidden xs:inline">Preview Mode - </span><span className="font-medium text-blue-600 dark:text-blue-400">{demoUserInfo.name}</span>
                </motion.p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center space-x-2 sm:space-x-4"
            >
              <Badge 
                variant="default"
                className="hidden sm:inline-flex bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50 backdrop-blur-sm"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Demo Administrator
              </Badge>
              <ThemeToggle />
              <Button 
                variant="outline" 
                onClick={handleLoginRedirect}
                size="sm"
                className="backdrop-blur-sm bg-white/10 dark:bg-slate-800/10 border-white/20 dark:border-slate-700/30 hover:bg-white/20 dark:hover:bg-slate-800/20 transition-all duration-300"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Login</span>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Compact Modern Hero Section */}
        {showMainNavigation && (
          <div className="relative overflow-hidden">
            {/* Sophisticated Geometric Background with Logo Watermark */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Elegant Background Logo Watermark */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-[0.015] dark:opacity-[0.02] pointer-events-none"
              >
                <img 
                  src="/new_logo_capital1.PNG" 
                  alt="College Logo Watermark" 
                  className="w-full h-full object-contain filter grayscale contrast-200"
                />
              </motion.div>
              
              {/* Optimized gradient particles */}
              <div className="hidden sm:block absolute top-20 left-1/4 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-r from-blue-400/6 to-cyan-400/4 rounded-full blur-xl sm:blur-2xl animate-float will-change-transform"></div>
              <div className="hidden md:block absolute top-32 right-1/3 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-r from-purple-400/4 to-pink-400/3 rounded-full blur-lg sm:blur-xl animate-float will-change-transform" style={{animationDelay: '2s'}}></div>
              <div className="hidden lg:block absolute bottom-24 left-1/5 w-20 sm:w-28 h-20 sm:h-28 bg-gradient-to-r from-emerald-400/5 to-teal-400/3 rounded-full blur-lg sm:blur-xl animate-float will-change-transform" style={{animationDelay: '4s'}}></div>
              
              {/* Simplified geometric shapes */}
              <div className="hidden md:block absolute top-16 right-1/4 w-0.5 sm:w-1 h-12 sm:h-16 bg-gradient-to-b from-blue-400/15 to-transparent rotate-12 animate-pulse will-change-transform"></div>
              <div className="hidden lg:block absolute bottom-32 right-1/5 w-0.5 sm:w-1 h-8 sm:h-12 bg-gradient-to-t from-purple-400/15 to-transparent -rotate-12 animate-pulse will-change-transform" style={{animationDelay: '1s'}}></div>
            </div>
            
            <div className="relative z-10 space-y-8">
              {/* Featured Logo Showcase */}
              <motion.div 
                initial={{ y: -30, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 1.0, ease: "easeOut" }}
                className="flex justify-center mb-8"
              >
                <div className="group relative cursor-pointer">
                  {/* Glassmorphism Container */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 dark:from-slate-800/30 dark:via-slate-700/20 dark:to-slate-800/30 backdrop-blur-2xl rounded-3xl blur-lg group-hover:blur-xl transition-all duration-700 group-hover:scale-110"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/3 to-emerald-500/5 rounded-3xl group-hover:from-blue-500/8 group-hover:via-purple-500/6 group-hover:to-emerald-500/8 transition-all duration-700"></div>
                  
                  {/* Floating Logo Container */}
                  <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-blue-500/10 dark:shadow-blue-400/5 border border-white/40 dark:border-slate-700/50 group-hover:shadow-3xl group-hover:shadow-blue-500/20 dark:group-hover:shadow-blue-400/10 transition-all duration-700 group-hover:scale-105 group-hover:-translate-y-2">
                    {/* Animated Ring */}
                    <div className="absolute inset-0 rounded-3xl border-2 border-gradient-to-r from-blue-400/30 via-purple-400/20 to-emerald-400/30 group-hover:border-blue-400/50 group-hover:via-purple-400/40 group-hover:to-emerald-400/50 transition-all duration-700"></div>
                    
                    {/* Logo with Glow Effect */}
                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/15 to-emerald-400/20 rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-700 opacity-0 group-hover:opacity-100"></div>
                      <img 
                        src="/new_logo_capital1.PNG" 
                        alt="Unique Public Graduate College Chichawatni" 
                        className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 object-contain relative z-10 drop-shadow-2xl group-hover:drop-shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-700"
                      />
                    </div>
                    
                    {/* Elegant Institution Label */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.6 }}
                      className="mt-4 text-center"
                    >
                      <h3 className="text-sm sm:text-base font-semibold bg-gradient-to-r from-slate-700 via-blue-700 to-purple-700 dark:from-slate-300 dark:via-blue-300 dark:to-purple-300 bg-clip-text text-transparent leading-tight">
                        Unique Public Graduate College
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium tracking-wide">
                        Chichawatni • Excellence in Education
                      </p>
                    </motion.div>
                  </div>
                  
                  {/* Orbital Animation Effects */}
                  <div className="absolute -inset-4 opacity-0 group-hover:opacity-100 transition-all duration-1000">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 bg-orange-400 rounded-full animate-ping" style={{animationDelay: '1.5s'}}></div>
                  </div>
                </div>
              </motion.div>
              
              {/* Compact Elegant Hero */}
              <div className="text-center space-y-4 py-6">
                {/* Demo Status Indicator */}
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-500/10 backdrop-blur-sm border border-emerald-200/30 dark:border-emerald-800/30"
                >
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-[10px] sm:text-xs font-medium text-emerald-700 dark:text-emerald-300">Demo Active</span>
                  <div className="w-px h-2 sm:h-3 bg-border/40 mx-1 sm:mx-2"></div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">Showcase Mode</span>
                </motion.div>
                
                {/* Compact Sophisticated Title */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="space-y-3"
                >
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
                    <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-200 bg-clip-text text-transparent">
                      Academic Excellence
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent relative">
                      Financial Hub
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full animate-pulse"></div>
                    </span>
                  </h1>
                  
                  <motion.p 
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                  >
                    Empowering Unique Graduate College with 
                    <span className="font-medium text-blue-600 dark:text-blue-400"> intelligent expense management</span>, 
                    <span className="font-medium text-purple-600 dark:text-purple-400"> institutional insights</span>, and 
                    <span className="font-medium text-emerald-600 dark:text-emerald-400"> streamlined financial oversight</span>
                  </motion.p>
                </motion.div>
                
                {/* Floating Metrics Cards with Logo Integration */}
                <motion.div 
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="flex flex-wrap justify-center gap-3 mt-8 max-w-4xl mx-auto"
                >
                  {/* Enhanced Cards with College Branding */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-all duration-500 group-hover:scale-110"></div>
                    <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/50 dark:border-slate-700/50 rounded-2xl p-4 shadow-lg shadow-blue-500/5 hover:shadow-blue-500/20 transition-all duration-500 hover:scale-105 hover:-translate-y-1 cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="relative p-2 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors overflow-hidden">
                          <div className="absolute top-0 right-0 w-3 h-3 opacity-20 group-hover:opacity-40 transition-opacity">
                            <img src="/new_logo_capital1.PNG" alt="" className="w-full h-full object-contain" />
                          </div>
                          <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400 relative z-10" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-foreground">Instant</div>
                          <div className="text-xs text-muted-foreground">Processing</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional showcase cards... */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-all duration-500 group-hover:scale-110"></div>
                    <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/50 dark:border-slate-700/50 rounded-2xl p-4 shadow-lg shadow-emerald-500/5 hover:shadow-emerald-500/20 transition-all duration-500 hover:scale-105 hover:-translate-y-1 cursor-pointer overflow-hidden">
                      <div className="absolute -top-2 -right-2 w-8 h-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                        <img src="/new_logo_capital1.PNG" alt="" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex items-center space-x-3 relative z-10">
                        <div className="p-2 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                          <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-foreground">Real-time</div>
                          <div className="text-xs text-muted-foreground">Analytics</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-all duration-500 group-hover:scale-110"></div>
                    <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/50 dark:border-slate-700/50 rounded-2xl p-4 shadow-lg shadow-purple-500/5 hover:shadow-purple-500/20 transition-all duration-500 hover:scale-105 hover:-translate-y-1 cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                          <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-foreground">Secure</div>
                          <div className="text-xs text-muted-foreground">Protected</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-all duration-500 group-hover:scale-110"></div>
                    <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/50 dark:border-slate-700/50 rounded-2xl p-4 shadow-lg shadow-orange-500/5 hover:shadow-orange-500/20 transition-all duration-500 hover:scale-105 hover:-translate-y-1 cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-500/10 rounded-xl group-hover:bg-orange-500/20 transition-colors">
                          <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-foreground">Smart</div>
                          <div className="text-xs text-muted-foreground">Insights</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Compact Navigation Section with Staggered Animation */}
              <motion.div 
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="relative"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Administrative Dashboard</h2>
                  <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                    Experience comprehensive tools for college expense management and financial oversight
                  </p>
                  <div className="mt-4 p-3 bg-amber-50/50 dark:bg-amber-900/20 rounded-lg border border-amber-200/50 dark:border-amber-800/30">
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      <Eye className="h-3 w-3 inline mr-1" />
                      This is a visual demonstration. Interactive features require authentication.
                    </p>
                  </div>
                </div>
                
                <GridNavigation 
                  sections={sectionConfig}
                  activeSection={activeTab}
                  onSectionChange={setActiveTab}
                  demoMode={true}
                />
              </motion.div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DemoLanding;