"use client"; // Indica que este es un componente del lado del cliente
import { createContext, useContext, useState } from "react";
//Definición del tipo de datos del contexto
interface ChatContextType {
    selectedChannel: any;
    setSelectedChannel: (channel: any) => void;
}
//Crear el contexto con valor inicial por defecto 
const ChatContext = createContext<ChatContextType>({
    selectedChannel: null,
    setSelectedChannel: () => {},
});

//Proveedor del contexto para envolver componentes que lo necesiten
export function ChatProvider({ children }: { children: React.ReactNode }) {
    // Estado para el canal seleccionado
    const [selectedChannel, setSelectedChannel] = useState<any>(null);
    // Proveer el contexto a los componentes hijos
    return (
        <ChatContext.Provider value={{ selectedChannel, setSelectedChannel }}>
            {children}
        </ChatContext.Provider>
    );
}
// Hook personalizado para usar el contexto de chat
export function useChat() {
    return useContext(ChatContext);
}
