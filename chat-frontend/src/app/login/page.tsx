"use client";
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
// import Head from 'next/head'; <--- ¡ELIMINADO! Ya no se usa así en Next.js App Router

// Interfaz para el objeto de mensaje que envía el backend (desde la DB)
interface ChatMessage {
    id: string; // ID de la DB
    content: string; // El texto
    senderId: string; // El ID del usuario que lo envió
    createdAt: Date; // La hora de creación
    // Podemos incluir el objeto 'sender' completo si el backend lo relaciona
    sender?: {
        id: string;
        username: string;
        // ... otros campos de usuario
    };
}

export default function ChatPage() {
    const [socket, setSocket] = useState<Socket | null>(null);
    // 1. EL ESTADO AHORA ALMACENA OBJETOS COMPLETOS
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');

    useEffect(() => {
        // Conexión al backend en el puerto 3000
        const newSocket = io("http://localhost:3000", { // Usa el puerto 3000 del backend
            auth: { token: localStorage.getItem("token") },
        });

        newSocket.on("connect", () => {
            console.log("Conectado al servidor de chat en 3000.");
        });

        // 2. LISTENER QUE ESPERA EL OBJETO CHATMESSAGE
        newSocket.on("newMessage", (msg: ChatMessage) => {
            // Esto añade el objeto de mensaje completo que viene del Gateway
            setMessages((prev) => [...prev, msg]);
        });

        // 3. (OPCIONAL) Carga de mensajes históricos al iniciar (FALTA IMPLEMENTAR)
        // newSocket.emit('findAllMessages', (historicalMessages: ChatMessage[]) => {
        //     setMessages(historicalMessages);
        // });


        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // 4. FUNCIÓN PARA ENVIAR EL MENSAJE
    const sendMessage = () => {
        if (socket && inputMessage.trim() !== '') {
            // Envía solo el contenido, el Gateway le añade el senderId y lo guarda en la DB.
            socket.emit('sendMessage', inputMessage);
            setInputMessage('');
        }
    };

    return (
        <div className="flex flex-col h-screen antialiased text-gray-800">
            {/* 5. FIX: Se elimina el componente Head de Next/js para evitar el error de compilación. 
                 La configuración del título se manejaría mejor en el layout.js o con el API de metadatos de Next.js */}
            <title>Chat | Persistencia OK</title>
            <div className="flex flex-row h-full w-full overflow-x-hidden">
                <div className="flex flex-col flex-auto h-full p-6">
                    <div className="flex flex-col flex-auto flex-shrink-0 rounded-2xl bg-white p-4 shadow-lg border border-gray-100">

                        {/* HISTORIAL DE MENSAJES */}
                        <div className="flex flex-col h-full overflow-x-auto mb-4">
                            <div className="flex flex-col h-full">
                                <h1 className="text-xl font-bold mb-4 text-center text-blue-600 border-b pb-2">
                                    Historial de Mensajes (Persistencia Activa)
                                </h1>
                                <div className="grid grid-cols-12 gap-y-2 overflow-y-auto pr-2">

                                    {messages.length === 0 ? (
                                        <div className="col-span-12 text-center text-gray-500 italic p-4">
                                            Comienza a chatear...
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div key={msg.id} className="col-span-12">
                                                <div className={`flex ${msg.senderId === 'ID-DE-USUARIO-DE-PRUEBA' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`flex items-center justify-center rounded-xl py-2 px-3 shadow-md text-sm 
                                                        ${msg.senderId === 'ID-DE-USUARIO-DE-PRUEBA'
                                                            ? 'bg-blue-500 text-white ml-auto'
                                                            : 'bg-gray-200 text-gray-800 mr-auto'
                                                        }`}
                                                    >
                                                        {/* Muestra el nombre/ID del emisor y el contenido */}
                                                        <span className="font-semibold mr-2">
                                                            {msg.sender?.username || `Usuario ${msg.senderId.substring(0, 4)}:`}
                                                        </span>
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* INPUT DE MENSAJE */}
                        <div className="flex flex-row items-center h-16 rounded-xl bg-white w-full px-4 border-t pt-4">
                            <div className="flex-grow ml-4">
                                <div className="relative w-full">
                                    <input
                                        type="text"
                                        placeholder="Escribe un mensaje..."
                                        className="flex w-full border rounded-xl focus:outline-none focus:border-blue-300 pl-4 h-10"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    />
                                </div>
                            </div>
                            <div className="ml-4">
                                <button
                                    className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 rounded-xl text-white px-4 py-2 flex-shrink-0 transition duration-300 shadow-md"
                                    onClick={sendMessage}
                                >
                                    <span>Enviar</span>
                                    <svg
                                        className="w-4 h-4 transform rotate-45 ml-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                        ></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
