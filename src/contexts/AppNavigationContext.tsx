import React, { createContext, useContext } from 'react';

interface AppNavigationContextType {
  activeTab: string;
  navigateTo: (tab: string) => void;
}

const AppNavigationContext = createContext<AppNavigationContextType | undefined>(undefined);

export function AppNavigationProvider({
  children,
  activeTab,
  navigateTo,
}: {
  children: React.ReactNode;
  activeTab: string;
  navigateTo: (tab: string) => void;
}) {
  return (
    <AppNavigationContext.Provider value={{ activeTab, navigateTo }}>
      {children}
    </AppNavigationContext.Provider>
  );
}

export function useAppNavigation() {
  const context = useContext(AppNavigationContext);
  if (!context) {
    throw new Error('useAppNavigation must be used within AppNavigationProvider');
  }
  return context;
}

