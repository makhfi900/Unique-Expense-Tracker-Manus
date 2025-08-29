import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '../context/NavigationContext';
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  DollarSign, 
  GraduationCap, 
  Settings, 
  ArrowRight, 
  Crown,
  Users,
  Calculator,
  User,
  ChevronRight,
  Grid3x3,
  Sparkles
} from 'lucide-react';

// Icon mapping for apps
const APP_ICONS = {
  DollarSign,
  GraduationCap,
  Settings,
  Crown,
  Users,
  Calculator,
  User
};

const MultiAppNavigation = () => {
  const { accessibleApps, navigateToApp, currentApp } = useNavigation();
  const { getRoleDisplay, isAdministrator, currentRole } = useRoleBasedAccess();
  const [hoveredApp, setHoveredApp] = useState(null);
  
  const roleDisplay = getRoleDisplay();
  const RoleIcon = APP_ICONS[roleDisplay.icon] || User;

  // Filter apps to show only accessible ones
  const availableApps = accessibleApps.filter(app => app.id !== 'hub');

  const handleAppSelect = (appId) => {
    navigateToApp(appId);
  };

  const getAppIcon = (iconName) => {
    return APP_ICONS[iconName] || DollarSign;
  };

  const getAppColorClasses = (color) => {
    const colorMap = {
      blue: {
        gradient: 'from-blue-500/10 to-blue-600/5',
        border: 'border-blue-200/50 dark:border-blue-800/50',
        iconBg: 'bg-blue-500/10',
        iconText: 'text-blue-600 dark:text-blue-400',
        hover: 'hover:from-blue-500/15 hover:to-blue-600/10'
      },
      green: {
        gradient: 'from-green-500/10 to-green-600/5',
        border: 'border-green-200/50 dark:border-green-800/50',
        iconBg: 'bg-green-500/10',
        iconText: 'text-green-600 dark:text-green-400',
        hover: 'hover:from-green-500/15 hover:to-green-600/10'
      },
      purple: {
        gradient: 'from-purple-500/10 to-purple-600/5',
        border: 'border-purple-200/50 dark:border-purple-800/50',
        iconBg: 'bg-purple-500/10',
        iconText: 'text-purple-600 dark:text-purple-400',
        hover: 'hover:from-purple-500/15 hover:to-purple-600/10'
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center space-y-6 mb-12">
          {/* Welcome Message */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-2"
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
              Multi-App Dashboard
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Access your institutional management applications from a unified interface
            </p>
          </motion.div>

          {/* Role Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="flex items-center px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full border border-white/50 dark:border-slate-700/50 shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                  <RoleIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <Badge variant={roleDisplay.badgeVariant} className="font-medium">
                  {roleDisplay.label}
                </Badge>
                {isAdministrator && (
                  <Sparkles className="h-4 w-4 text-amber-500" />
                )}
              </div>
            </div>
          </motion.div>

          {/* Role Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-sm text-muted-foreground"
          >
            {roleDisplay.description}
          </motion.p>
        </div>

        {/* Apps Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-6">
              <Grid3x3 className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground">Available Applications</h2>
              <Separator className="flex-1" />
              <Badge variant="outline" className="text-xs">
                {availableApps.length} apps
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {availableApps.map((app, index) => {
                  const AppIcon = getAppIcon(app.icon);
                  const colorClasses = getAppColorClasses(app.color);
                  const isHovered = hoveredApp === app.id;

                  return (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        duration: 0.5, 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 100
                      }}
                      onHoverStart={() => setHoveredApp(app.id)}
                      onHoverEnd={() => setHoveredApp(null)}
                      className="group"
                    >
                      <Card 
                        className={`
                          relative overflow-hidden cursor-pointer transition-all duration-300 
                          ${colorClasses.border} hover:shadow-lg hover:shadow-blue-500/10
                          bg-gradient-to-br ${colorClasses.gradient} ${colorClasses.hover}
                          backdrop-blur-sm border-2 hover:border-opacity-70
                          transform hover:scale-[1.02] hover:-translate-y-1
                        `}
                        onClick={() => handleAppSelect(app.id)}
                      >
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-30">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-white/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-radial from-white/5 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
                        </div>

                        <CardHeader className="relative z-10 pb-3">
                          <div className="flex items-start justify-between">
                            <div className={`p-3 rounded-xl ${colorClasses.iconBg} backdrop-blur-sm`}>
                              <AppIcon className={`h-8 w-8 ${colorClasses.iconText}`} />
                            </div>
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ 
                                opacity: isHovered ? 1 : 0.7, 
                                scale: isHovered ? 1.1 : 1 
                              }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                            </motion.div>
                          </div>
                        </CardHeader>

                        <CardContent className="relative z-10">
                          <div className="space-y-3">
                            <CardTitle className="text-lg group-hover:text-foreground transition-colors">
                              {app.name}
                            </CardTitle>
                            <CardDescription className="text-sm leading-relaxed">
                              {app.description}
                            </CardDescription>

                            {/* Feature Count */}
                            <div className="flex items-center justify-between pt-2">
                              <Badge variant="outline" className="text-xs">
                                {app.features.length} features
                              </Badge>
                              <motion.div
                                animate={{ x: isHovered ? 5 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                              </motion.div>
                            </div>
                          </div>
                        </CardContent>

                        {/* Hover Effect Overlay */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: isHovered ? 1 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"
                        />
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick Access Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-12 text-center"
          >
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 dark:border-slate-700/50 shadow-lg">
              <p className="text-sm text-muted-foreground mb-4">
                Need help getting started? Access the settings to configure your preferences.
              </p>
              {availableApps.some(app => app.id === 'settings') && (
                <Button 
                  variant="outline" 
                  onClick={() => handleAppSelect('settings')}
                  className="backdrop-blur-sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Open Settings
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default MultiAppNavigation;