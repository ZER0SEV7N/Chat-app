'use client';
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import ChatList from './chatList';
import ChatWindow from './chatWindow';
import CreateChannelModal from './CreateChannelModal';
import AddUserModal from './AddUserModal';



export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  //conexion con el servidor
  useEffect(() => {
    const newSocket = io("http://localhost:3000", {
      auth: { token: localStorage.getItem("token") },
    });

    newSocket.on("connect", () => {
      console.log("Conectado al servidor de chat");
    });

    setSocket(newSocket);

    //Función de limpieza correcta
    return () => {
      newSocket.disconnect(); //Cierra la conexión
      console.log("Socket desconectado");
    };
  }, []);


    //Cargar canales desde el backend
    useEffect(() => {
    const fetchChannels = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // 🧩 1. Obtener canales del usuario (DMs)
        const resUser = await fetch('http://localhost:3000/users/channels', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userChannels = resUser.ok ? await resUser.json() : [];

        // 🧩 2. Obtener canales públicos
        const resPublic = await fetch('http://localhost:3000/channels/public');
        const publicChannels = resPublic.ok ? await resPublic.json() : [];

        // 🧩 3. Combinar ambos (sin duplicar)
        const allChannels = [...publicChannels, ...userChannels];

        setChannels(allChannels);
      } catch (err) {
        console.error('Error al obtener canales:', err);
      }
    };

    fetchChannels();
  }, []);


  const handleSelectChannel = (channel: any) => setSelectedChannel(channel);

  const handleChannelCreated = (channel: any) => {
    // ✅ Añadir el nuevo canal a la lista
    setChannels((prev) => [channel, ...prev]);
    setShowAddUserModal(false);
    setShowCreateModal(false);
  };

  return (
    <div className="chat-layout">
      <ChatList
        channels={channels}
        onSelectChannel={handleSelectChannel}
        onCreateChannel={() => setShowCreateModal(true)}
        onAddUser={() => setShowAddUserModal(true)}
      />

      <ChatWindow socket={socket} channel={selectedChannel} />

      {showCreateModal && (
        <CreateChannelModal
          onClose={() => setShowCreateModal(false)}
          onChannelCreated={handleChannelCreated}
        />
      )}

      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onChannelCreated={handleChannelCreated}
        />
      )}
    </div>
  );
}
