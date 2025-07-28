import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

const GridNavigation = ({ sections, activeSection, onSectionChange, userInfo }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
      {sections.map((section) => {
        if (!section.show) return null;
        
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        const isPrimary = ['expenses', 'add-expense'].includes(section.id);
        
        return (
          <Card 
            key={section.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group ${
              isActive 
                ? 'ring-2 ring-primary shadow-lg bg-primary/5' 
                : 'hover:shadow-md'
            } ${
              isPrimary 
                ? 'border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10' 
                : ''
            }`}
            onClick={() => onSectionChange(section.id)}
          >
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Icon */}
                <div className={`p-4 rounded-full transition-colors ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : isPrimary
                    ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                    : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                }`}>
                  <Icon className="h-8 w-8" />
                </div>
                
                {/* Title */}
                <div className="space-y-2">
                  <h3 className={`font-semibold text-lg ${
                    isActive ? 'text-primary' : 'text-foreground'
                  }`}>
                    {section.label}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {section.description}
                  </p>
                  
                  {/* Badges for special sections */}
                  {section.adminOnly && (
                    <Badge variant="secondary" className="text-xs">
                      Admin Only
                    </Badge>
                  )}
                  
                  {isPrimary && (
                    <Badge variant="default" className="text-xs bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground">
                      Primary Action
                    </Badge>
                  )}
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