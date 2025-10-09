'use client';
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
// ❌ Se eliminó la importación: import Head from 'next/head';

export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  useEffect(() => {
    // Conexión al backend en el puerto 3000
    const newSocket = io("http://localhost:3000", {
      // Nota: Aquí estamos asumiendo que el token es necesario.
      auth: { token: localStorage.getItem("token") },
    });

    newSocket.on("connect", () => {
      console.log("Conectado al servidor de chat en 3000");
    });

    // Lógica para recibir mensajes (Listener)
    newSocket.on("newMessage", (msg: string) => {
      // Esto añade el mensaje re-emitido por el servidor a la lista
      setMessages((prev) => [...prev, msg]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Función para enviar mensajes
  const sendMessage = () => {
    if (socket && inputMessage.trim() !== '') {
      // ✅ CORRECCIÓN LÓGICA: Usamos 'sendMessage' para EMITIR el mensaje al servidor.
      // El backend DEBE escuchar este evento.
      socket.emit('sendMessage', inputMessage);
      setInputMessage('');
    }
  };

  if (!socket) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-lg text-blue-500 font-semibold">
          Conectando al chat...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      {/* ❌ Se eliminó el componente <Head>. La funcionalidad del título ya está gestionada. */}

      {/* Contenedor Principal (Simulando la tarjeta de la imagen) */}
      <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl p-6 mt-10">

        <h2 className="text-xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">
          Historial de Mensajes
        </h2>

        {/* Contenedor de Mensajes (Historial) */}
        <div className="p-4 border border-gray-200 h-96 overflow-y-auto bg-gray-50 rounded-lg mb-4">
          {messages.length === 0 ? (
            <p className="text-gray-500 italic">Comienza a chatear...</p>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className="py-2 border-b border-gray-200 last:border-b-0 text-gray-700"
              >
                {/* Aquí deberías mostrar el nombre de usuario junto al mensaje, pero por ahora solo mostramos el texto */}
                {msg}
              </div>
            ))
          )}
        </div>

        {/* Input y Botón de Envío */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Escribe un mensaje..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                sendMessage();
              }
            }}
            className="flex-grow p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            className="p-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition duration-150"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
