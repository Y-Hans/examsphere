'use client';

import { createContext, useContext } from 'react';

interface AppContextValue {
  userId: string;
  tenantId: string;
  roleIds: string[];
  permissions: string[];
  subdomain: string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppContextProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: AppContextValue;
}) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppContextProvider');
  return ctx;
}
