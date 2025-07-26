import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './useAuth';

interface CompanyContextType {
  currentCompanyId: number | null;
  setCurrentCompanyId: (companyId: number | null) => void;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

interface CompanyProviderProps {
  children: ReactNode;
}

export function CompanyProvider({ children }: CompanyProviderProps) {
  const [currentCompanyId, setCurrentCompanyIdState] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth(); // Re-enabled with Railway database authentication

  // Initialize company context when user loads
  useEffect(() => {
    if (isAuthenticated && user?.companyId) {
      setCurrentCompanyIdState(user.companyId);
      // Store in localStorage for persistence
      localStorage.setItem('currentCompanyId', user.companyId.toString());
    } else if (isAuthenticated && !user?.companyId) {
      // Try to restore from localStorage if user doesn't have a company set
      const storedCompanyId = localStorage.getItem('currentCompanyId');
      if (storedCompanyId) {
        setCurrentCompanyIdState(parseInt(storedCompanyId));
      }
    } else if (!isAuthenticated) {
      // For demo mode (unauthenticated users), always use company ID 1
      // This only applies when explicitly in demo mode (/demo path)
      const isDemoPath = window.location.pathname === '/demo';
      if (isDemoPath) {
        setCurrentCompanyIdState(1);
        console.log("Demo mode: Setting company ID to 1");
      } else {
        // For unauthenticated users on other paths, no company context needed
        setCurrentCompanyIdState(null);
        console.log("Unauthenticated user: No company context");
      }
    }
    setIsLoading(false);
  }, [isAuthenticated, user]);

  const setCurrentCompanyId = (companyId: number | null) => {
    setCurrentCompanyIdState(companyId);
    if (companyId) {
      localStorage.setItem('currentCompanyId', companyId.toString());
    } else {
      localStorage.removeItem('currentCompanyId');
    }
  };

  return (
    <CompanyContext.Provider 
      value={{ 
        currentCompanyId, 
        setCurrentCompanyId, 
        isLoading 
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompanyContext() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompanyContext must be used within a CompanyProvider');
  }
  return context;
}

// HOC to ensure company context is available
export function withCompanyFilter<T extends {}>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  return function CompanyFilteredComponent(props: T) {
    const { currentCompanyId, isLoading } = useCompanyContext();
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    if (!currentCompanyId) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No Company Selected</h3>
            <p className="text-gray-600">Please select a company to continue.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}