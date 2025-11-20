// src/lib/socket.ts
import { io, Socket } from "socket.io-client";
import { API_URL } from "./config";

// Crear una instancia de socket más robusta
export const createSocket = (): Socket => {
  // Solo crear socket en el cliente
  if (typeof window === "undefined") {
    // Retornar un mock para SSR
    return {
      on: () => {},
      off: () => {},
      emit: () => {},
      connected: false,
      disconnected: true,
      connect: () => {},
      disconnect: () => {},
      id: null,
    } as unknown as Socket;
  }

  const token = localStorage.getItem("token") || "";
  
  console.log('🔌 Inicializando conexión WebSocket...');
  
  return io(API_URL, {
    auth: { 
      token 
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true, // Conectar automáticamente
  });
};

// Crear la instancia global
const socket = createSocket();

export default socket;