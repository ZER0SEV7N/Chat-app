// src/app/context/SocketContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import socket from '@/lib/socket';

// Definir el tipo del contexto
interface SocketContextType {
  socket: Socket;
  isConnected: boolean;
  connectionError: string | null;
}

// Crear el contexto
const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Props del provider
interface SocketProviderProps {
  children: ReactNode;
}

// Provider component
export function SocketProvider({ children }: SocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    // Eventos de conexión
    const onConnect = () => {
      console.log('✅ Conectado al servidor WebSocket');
      setIsConnected(true);
      setConnectionError(null);
    };

    const onDisconnect = () => {
      console.log('🔌 Desconectado del servidor WebSocket');
      setIsConnected(false);
    };

    const onConnectError = (error: Error) => {
      console.error('❌ Error de conexión WebSocket:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    };

    const onReconnect = (attempt: number) => {
      console.log(`🔄 Reconectando... Intento ${attempt}`);
      setConnectionError(null);
    };

    const onReconnectError = (error: Error) => {
      console.error('❌ Error de reconexión:', error);
      setConnectionError(`Error de reconexión: ${error.message}`);
    };

    const onReconnectFailed = () => {
      console.error('❌ Falló la reconexión después de varios intentos');
      setConnectionError('No se pudo reconectar al servidor');
    };

    // Registrar event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('reconnect', onReconnect);
    socket.on('reconnect_error', onReconnectError);
    socket.on('reconnect_failed', onReconnectFailed);

    // Si ya está conectado, actualizar estado
    if (socket.connected) {
      setIsConnected(true);
      setConnectionError(null);
    }

    // Cleanup
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('reconnect', onReconnect);
      socket.off('reconnect_error', onReconnectError);
      socket.off('reconnect_failed', onReconnectFailed);
    };
  }, []);

  const value: SocketContextType = {
    socket,
    isConnected,
    connectionError,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useSocket() {
  const context = useContext(SocketContext);
  
  if (context === undefined) {
    throw new Error('useSocket debe ser usado dentro de un SocketProvider');
  }
  
  return context;
}