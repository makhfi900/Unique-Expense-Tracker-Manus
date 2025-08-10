import React, { createContext, useContext, useState } from 'react';

const DemoContext = createContext();

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};

export const DemoProvider = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);

  const enableDemoMode = () => {
    setIsDemoMode(true);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
  };

  // Demo user profile for display
  const demoUser = {
    email: 'demo@unique.edu.pk',
    user_metadata: {
      full_name: 'Demo User',
      role: 'admin'
    }
  };

  const demoUserProfile = {
    full_name: 'Demo User',
    role: 'admin'
  };

  const value = {
    isDemoMode,
    enableDemoMode,
    exitDemoMode,
    demoUser,
    demoUserProfile
  };

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
};