import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

const GridNavigation = ({ sections, activeSection, onSectionChange }) => {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
      {sections.map((section) => {
        if (!section.show) return null;
        
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        const isPrimary = ['expenses', 'add-expense'].includes(section.id);
        const theme = getColorTheme(section.id);
        
        return (
          <Card 
            key={section.id}
            className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden h-fit ${
              isActive 
                ? `ring-2 ${theme.ring} shadow-2xl bg-gradient-to-br ${theme.gradient} shadow-current/20` 
                : `hover:shadow-2xl hover:shadow-current/10 bg-gradient-to-br ${theme.gradient} ${theme.border} hover:ring-1 hover:${theme.ring}`
            }`}
            onClick={() => onSectionChange(section.id)}
          >
            {/* Enhanced glow effect for dark theme */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-br ${
              isActive ? 'from-white/[0.08] via-transparent to-white/[0.08]' : 'from-white/[0.04] via-transparent to-white/[0.04]'
            } dark:from-white/[0.08] dark:to-white/[0.08]`} />
            
            <CardContent className="p-4 relative z-10">
              <div className="flex flex-col items-center text-center space-y-3">
                {/* Smaller Icon */}
                <div className={`p-3 rounded-full transition-all duration-300 ${
                  isActive 
                    ? theme.iconActive
                    : `${theme.icon} ${theme.iconHover}`
                }`}>
                  <Icon className="h-6 w-6" />
                </div>
                
                {/* Compact Title and Content */}
                <div className="space-y-2">
                  <h3 className={`font-medium text-base transition-colors duration-300 ${
                    isActive ? theme.titleActive : `text-foreground ${theme.title}`
                  }`}>
                    {section.label}
                  </h3>
                  
                  {/* Shorter Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {section.description}
                  </p>
                  
                  {/* Improved Badges */}
                  <div className="flex flex-col gap-1.5">
                    {section.adminOnly && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-600 border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                      >
                        Admin Only
                      </Badge>
                    )}
                    
                    {isPrimary && (
                      <Badge 
                        variant="default" 
                        className={`text-xs px-2 py-0.5 transition-colors duration-300 ${theme.badge}`}
                      >
                        Primary Action
                      </Badge>
                    )}
                  </div>
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