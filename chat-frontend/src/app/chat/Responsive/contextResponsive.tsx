//src/app/chat/Responsive/contextResponsive.ts
//Modulo para gestionar el contexto de responsividad
'use client';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useResponsive } from './useResponsive';
import { useBackButton } from './useBackButton';

//Definir la interfaz del contexto
interface ResponsiveContextType {
  isMobile: boolean;
  isDesktop: boolean;
  isTablet: boolean;
  currentChat: any;
  setCurrentChat: React.Dispatch<React.SetStateAction<any>>;
  goToChat: (chat: any) => void;
  goToList: () => void;
}

//Crear el contexto
const ResponsiveContext = createContext({} as ResponsiveContextType);

//Proveedor del contexto
export function ResponsiveProvider({ children }: { children: ReactNode }) {
  const { isMobile, isDesktop, isTablet } = useResponsive();
  const [currentChat, setCurrentChat] = useState<any>(null);
  const [hasPushedState, setHasPushedState] = useState(false);

  //Funciones de navegación
  const goToChat = (chat: any) => {
    setCurrentChat(chat);
    //Agregar al historial para el botón de retroceso
    if (isMobile && chat) {
      // Remover estado anterior si existe
      if (hasPushedState) {
        window.history.replaceState({ type: 'chat', chatId: chat.idChannel }, '');
      } else {
        window.history.pushState({ type: 'chat', chatId: chat.idChannel }, '');
        setHasPushedState(true);
      }
      console.log('📱 Estado de historial agregado para chat:', chat.idChannel);
    }
  };

//Función mejorada para volver a la lista
  const goToList = () => {
    console.log('📱 Volviendo a la lista de chats');
    setCurrentChat(null);
    // NO manipular el historial aquí - el back button ya lo maneja
  };

  //CORREGIDO: Usar useBackButton solo cuando hay un chat activo en móvil
  useBackButton(() => {
    if (currentChat && isMobile) {
      console.log('🔙 Back button detectado - Volviendo a lista');
      goToList();
    }
  }, isMobile && currentChat !== null); //SOLO habilitar cuando hay chat activo

  // Manejar cambios en la URL/popstate externos
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Si estamos en un chat y recibimos un popstate sin estado de chat, volver a lista
      if (currentChat && (!event.state || event.state.type !== 'chat-view')) {
        console.log('🔙 PopState externo - Volviendo a lista');
        setCurrentChat(null);
        setHasPushedState(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentChat]);

  //Definir el valor del contexto
  const value: ResponsiveContextType = {
    isMobile,
    isDesktop,
    isTablet,
    currentChat,
    setCurrentChat,
    goToChat,
    goToList,
  };
  //Retornar el proveedor con el valor
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