//src/app/chat/Responsive/contextResponsive.ts
//Modulo para gestionar el contexto de responsividad
'use client';
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { useResponsive } from './useResponsive';

// Definir la interfaz del contexto
interface ResponsiveContextType {
  isMobile: boolean;
  isDesktop: boolean;
  isTablet: boolean;
  currentChat: any;
  setCurrentChat: React.Dispatch<React.SetStateAction<any>>;
}

// Crear el contexto
const ResponsiveContext = createContext({} as ResponsiveContextType);

// Proveedor del contexto
export function ResponsiveProvider({ children }: { children: ReactNode }) {
  const { isMobile, isDesktop, isTablet } = useResponsive();
  const [currentChat, setCurrentChat] = useState<any>(null);

  const value: ResponsiveContextType = {
    isMobile,
    isDesktop,
    isTablet,
    currentChat,
    setCurrentChat,
  };

  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useResponsiveContext() {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsiveContext must be used within a ResponsiveProvider');
  }
  return context;
}
