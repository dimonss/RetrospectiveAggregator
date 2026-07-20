import React, { createContext, useContext, useState } from 'react';

export interface DemoContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
}

export const DemoContext = createContext<DemoContextType>({
  isDemoMode: true,
  toggleDemoMode: () => {},
});

export interface DemoProviderProps {
  children: React.ReactNode;
  onToggleDemoMode?: (nextDemoMode: boolean) => void;
}

export const DemoProvider: React.FC<DemoProviderProps> = ({ children, onToggleDemoMode }) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('isDemoMode');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleDemoMode = () => {
    setIsDemoMode(prev => {
      const next = !prev;
      localStorage.setItem('isDemoMode', String(next));
      if (onToggleDemoMode) {
        onToggleDemoMode(next);
      }
      return next;
    });
  };

  return (
    <DemoContext.Provider value={{ isDemoMode, toggleDemoMode }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => useContext(DemoContext);
