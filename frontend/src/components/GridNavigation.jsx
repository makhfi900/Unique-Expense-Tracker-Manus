import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

const GridNavigation = ({ sections, activeSection, onSectionChange, demoMode = false }) => {
  // Define color themes for each section
  const getColorTheme = (sectionId) => {
    const themes = {
      'expenses': {
        gradient: 'from-blue-500/10 via-blue-600/5 to-blue-700/10',
        border: 'border-blue-500/20',
        icon: 'bg-blue-500/15 text-blue-400',
        iconHover: 'group-hover:bg-blue-500 group-hover:text-white',
        iconActive: 'bg-blue-500 text-white',
        title: 'group-hover:text-blue-400',
        titleActive: 'text-blue-400',
        badge: 'bg-blue-500/15 text-blue-400 hover:bg-blue-500 hover:text-white',
        ring: 'ring-blue-500/50',
        shadow: 'shadow-blue-500/10'
      },
      'add-expense': {
        gradient: 'from-emerald-500/10 via-emerald-600/5 to-emerald-700/10',
        border: 'border-emerald-500/20',
        icon: 'bg-emerald-500/15 text-emerald-400',
        iconHover: 'group-hover:bg-emerald-500 group-hover:text-white',
        iconActive: 'bg-emerald-500 text-white',
        title: 'group-hover:text-emerald-400',
        titleActive: 'text-emerald-400',
        badge: 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-white',
        ring: 'ring-emerald-500/50',
        shadow: 'shadow-emerald-500/10'
      },
      'analytics': {
        gradient: 'from-purple-500/10 via-purple-600/5 to-purple-700/10',
        border: 'border-purple-500/20',
        icon: 'bg-purple-500/15 text-purple-400',
        iconHover: 'group-hover:bg-purple-500 group-hover:text-white',
        iconActive: 'bg-purple-500 text-white',
        title: 'group-hover:text-purple-400',
        titleActive: 'text-purple-400',
        badge: 'bg-purple-500/15 text-purple-400 hover:bg-purple-500 hover:text-white',
        ring: 'ring-purple-500/50',
        shadow: 'shadow-purple-500/10'
      },
      'import-export': {
        gradient: 'from-orange-500/10 via-orange-600/5 to-orange-700/10',
        border: 'border-orange-500/20',
        icon: 'bg-orange-500/15 text-orange-400',
        iconHover: 'group-hover:bg-orange-500 group-hover:text-white',
        iconActive: 'bg-orange-500 text-white',
        title: 'group-hover:text-orange-400',
        titleActive: 'text-orange-400',
        badge: 'bg-orange-500/15 text-orange-400 hover:bg-orange-500 hover:text-white',
        ring: 'ring-orange-500/50',
        shadow: 'shadow-orange-500/10'
      },
      'categories': {
        gradient: 'from-teal-500/10 via-teal-600/5 to-teal-700/10',
        border: 'border-teal-500/20',
        icon: 'bg-teal-500/15 text-teal-400',
        iconHover: 'group-hover:bg-teal-500 group-hover:text-white',
        iconActive: 'bg-teal-500 text-white',
        title: 'group-hover:text-teal-400',
        titleActive: 'text-teal-400',
        badge: 'bg-teal-500/15 text-teal-400 hover:bg-teal-500 hover:text-white',
        ring: 'ring-teal-500/50',
        shadow: 'shadow-teal-500/10'
      },
      'users': {
        gradient: 'from-indigo-500/10 via-indigo-600/5 to-indigo-700/10',
        border: 'border-indigo-500/20',
        icon: 'bg-indigo-500/15 text-indigo-400',
        iconHover: 'group-hover:bg-indigo-500 group-hover:text-white',
        iconActive: 'bg-indigo-500 text-white',
        title: 'group-hover:text-indigo-400',
        titleActive: 'text-indigo-400',
        badge: 'bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500 hover:text-white',
        ring: 'ring-indigo-500/50',
        shadow: 'shadow-indigo-500/10'
      },
      'login-activity': {
        gradient: 'from-rose-500/10 via-rose-600/5 to-rose-700/10',
        border: 'border-rose-500/20',
        icon: 'bg-rose-500/15 text-rose-400',
        iconHover: 'group-hover:bg-rose-500 group-hover:text-white',
        iconActive: 'bg-rose-500 text-white',
        title: 'group-hover:text-rose-400',
        titleActive: 'text-rose-400',
        badge: 'bg-rose-500/15 text-rose-400 hover:bg-rose-500 hover:text-white',
        ring: 'ring-rose-500/50',
        shadow: 'shadow-rose-500/10'
      }
    };
    
    return themes[sectionId] || themes['expenses']; // fallback to blue theme
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 px-2 sm:px-4">
      {sections.map((section) => {
        if (!section.show) return null;
        
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        const isPrimary = ['expenses', 'add-expense'].includes(section.id);
        const theme = getColorTheme(section.id);
        
        return (
          <Card 
            key={section.id}
            className={`group cursor-pointer relative overflow-hidden transition-all duration-500 active:scale-95 hover:scale-105 sm:hover:scale-[1.02] transform-gpu touch-manipulation ${
              isActive 
                ? `ring-1 sm:ring-2 ${theme.ring} shadow-lg sm:shadow-2xl bg-gradient-to-br ${theme.gradient} border ${theme.border} shadow-${theme.shadow.split('/')[0].split('-')[1]}-500/20` 
                : `hover:shadow-lg sm:hover:shadow-2xl bg-gradient-to-br ${theme.gradient} ${theme.border} hover:ring-1 sm:hover:ring-2 hover:${theme.ring} hover:border backdrop-blur-sm`
            } hover:-translate-y-1 sm:hover:-translate-y-2`}
            onClick={() => {
              if (demoMode) {
                // In demo mode, show a message or visual feedback
                alert('🎯 Demo Mode: This feature showcases the beautiful dashboard design. Login to access interactive functionality!');
              } else {
                onSectionChange(section.id);
              }
            }}
          >
            {/* Ultra-Modern Glow Effects */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
              {/* Primary glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${
                isActive 
                  ? 'from-white/[0.15] via-transparent to-white/[0.15]' 
                  : 'from-white/[0.08] via-transparent to-white/[0.08]'
              } dark:from-white/[0.12] dark:to-white/[0.12]`} />
              
              {/* Subtle inner glow */}
              <div className={`absolute inset-[1px] bg-gradient-to-br ${theme.gradient} opacity-50`} />
            </div>
            
            {/* Top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${
              theme.gradient.replace('/10', '/40').replace('/5', '/30')
            } opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            
            <CardContent className="p-3 sm:p-4 md:p-6 lg:p-8 relative z-10">
              <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4 md:space-y-6">
                {/* Enhanced Icon with Better Animation - Mobile Optimized */}
                <div className={`relative p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl transition-all duration-500 min-h-[48px] min-w-[48px] flex items-center justify-center ${
                  isActive 
                    ? `${theme.iconActive} shadow-md sm:shadow-lg`
                    : `${theme.icon} ${theme.iconHover} group-hover:shadow-md sm:group-hover:shadow-lg`
                }`}>
                  {/* Icon background glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient.replace('/10', '/20')} rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                  
                  {/* Floating indicator for active state */}
                  {isActive && (
                    <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/30" />
                  )}
                </div>
                
                {/* Enhanced Typography and Content - Mobile Optimized */}
                <div className="space-y-2 sm:space-y-3 md:space-y-4 w-full">
                  <h3 className={`font-bold text-sm sm:text-base md:text-lg transition-all duration-300 leading-tight ${
                    isActive 
                      ? `${theme.titleActive} drop-shadow-sm` 
                      : `text-foreground ${theme.title} group-hover:drop-shadow-sm`
                  }`}>
                    {section.label}
                  </h3>
                  
                  {/* Better Description Styling - Hidden on very small screens for compactness */}
                  <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground/80 leading-relaxed line-clamp-2 sm:line-clamp-3 group-hover:text-muted-foreground transition-colors duration-300">
                    {section.description}
                  </p>
                  
                  {/* Premium Badge System - Mobile Optimized */}
                  <div className="flex flex-wrap justify-center gap-1 sm:gap-2 pt-1 sm:pt-2">
                    {section.adminOnly && (
                      <Badge 
                        variant="secondary" 
                        className="text-[10px] sm:text-xs px-1.5 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-orange-500/20 text-amber-600 border border-amber-500/30 dark:bg-gradient-to-r dark:from-amber-500/15 dark:via-amber-400/10 dark:to-orange-500/15 dark:text-amber-400 dark:border-amber-500/25 backdrop-blur-sm font-medium"
                      >
                        <span className="hidden sm:inline">⚡ Admin Only</span>
                        <span className="sm:hidden">⚡ Admin</span>
                      </Badge>
                    )}
                    
                    {isPrimary && (
                      <Badge 
                        variant="default" 
                        className={`text-[10px] sm:text-xs px-1.5 sm:px-3 py-0.5 sm:py-1 transition-all duration-300 font-medium backdrop-blur-sm ${theme.badge} border border-current/20`}
                      >
                        <span className="hidden sm:inline">⭐ Quick Access</span>
                        <span className="sm:hidden">⭐ Quick</span>
                      </Badge>
                    )}
                    
                    {/* Dynamic usage indicator - More compact on mobile */}
                    <Badge 
                      variant="outline" 
                      className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background/50 backdrop-blur-sm border-border/50 text-muted-foreground/70"
                    >
                      {section.id === 'analytics' ? '📊' : 
                       section.id === 'expenses' ? '📋' : 
                       section.id === 'add-expense' ? '✏️' :
                       section.id === 'import-export' ? '🔄' :
                       section.id === 'categories' ? '🏷️' :
                       section.id === 'users' ? '👥' :
                       section.id === 'login-activity' ? '🔒' : '🔧'}
                      <span className="hidden sm:inline ml-1">
                        {section.id === 'analytics' ? 'Reports' : 
                         section.id === 'expenses' ? 'Records' : 
                         section.id === 'add-expense' ? 'Create' :
                         section.id === 'import-export' ? 'Data' :
                         section.id === 'categories' ? 'Organize' :
                         section.id === 'users' ? 'Manage' :
                         section.id === 'login-activity' ? 'Security' : 'Tools'}
                      </span>
                    </Badge>
                  </div>
                </div>
                
                {/* Subtle Action Indicator - Mobile Optimized */}
                <div className="w-full pt-1 sm:pt-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-1 sm:translate-y-2 group-hover:translate-y-0">
                  <div className={`h-[1px] sm:h-[2px] w-0 group-hover:w-full transition-all duration-500 bg-gradient-to-r ${
                    theme.gradient.replace('/10', '/50')
                  } rounded-full mx-auto`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default GridNavigation;