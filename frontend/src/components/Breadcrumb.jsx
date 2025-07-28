import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumb = ({ currentSection, sectionTitle }) => {
  const breadcrumbItems = [
    { label: 'Dashboard', icon: Home, href: '#' },
    { label: sectionTitle, current: true }
  ];

  return (
    <nav className="flex items-center space-x-2 text-sm mb-6 py-3 px-4 bg-muted/50 rounded-lg border" aria-label="Breadcrumb">
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          <div className={`flex items-center gap-2 ${
            item.current 
              ? 'text-foreground font-medium' 
              : 'text-muted-foreground hover:text-foreground transition-colors'
          }`}>
            {item.icon && <item.icon className="h-4 w-4" />}
            <span>{item.label}</span>
          </div>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;