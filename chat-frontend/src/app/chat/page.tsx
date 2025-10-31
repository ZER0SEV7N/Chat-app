'use client';
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import ChatList from './chatList';
import ChatWindow from './chatWindow';
import CreateChannelModal from './Modal/CreateChannelModal';
import AddUserModal from './Modal/AddUserModal';
import { API_URL } from "@/lib/config";

export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<any | null>(null); 
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [username, setUsername] = useState('Usuario');

  //Pedir permiso para mostrar notificaciones
  useEffect(() => {
    if (typeof window !== 'undefined' && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // 🔌 Conexión con el servidor
  useEffect(() => {
    //Obtener el token JWT del localStorage
    const token = localStorage.getItem("token");
    //Si no exite, se retorna al comienzo
    if (!token) {
      window.location.href = '/';
      return;
    }
    //Obtener el username del localStorage y establecerlo como name de usuario
    const user = localStorage.getItem("username");
    if (user) setUsername(user);
    //Establecer conexion con el socket
    const newSocket = io(API_URL, {
      auth: { token },
    });
    //Si se obtuvo el token y el socket
    newSocket.on("connect", () => {
      console.log("✅ Conectado al servidor de chat");
    });
    newSocket.on("unauthorized", () => {
      alert("Sesión expirada. Redirigiendo al login.");
      handleLogout();
    });

    // 🧠 Escuchar mensajes y mostrar notificación + sonido si el mensaje no es tuyo
    newSocket.on("message", (msg: any) => {
      console.log("📩 Mensaje recibido:", msg);

      const currentUser = localStorage.getItem("username");

      // 🔒 Solo mostrar notificación si el mensaje NO lo envió el usuario actual
      if (msg.senderName !== currentUser) {
        // Mostrar notificación
        if (Notification.permission === "granted") {
          new Notification(`💬 ${msg.senderName}`, {
            body: msg.content,
            icon: "/chat-icon.png",
          });
        }

        // 🔊 Reproducir sonido
        const audio = new Audio("/message.mp3");
        audio.volume = 0.7;
        audio.play().catch((err) => console.warn("Error reproduciendo sonido:", err));
      }
    });
    //Escuchar cuando el backend elmine un canal (DM)
    newSocket.on("channelRemoved", ({ idChannel  }) => {
      console.log("Grupo Eliminado", idChannel );
      setChannels((prev) => prev.filter((ch) => ch.idChannel !== idChannel ));
      //Si el canal eliminado estaba seleccionado, se limpia
      setSelectedChannel((prev: { idchannel: any; }) =>
        prev && prev.idchannel === idChannel  ? null : prev
      );
    });


    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      console.log("🔌 Socket desconectado");
    };
  }, [selectedChannel]);

  // 🚪 Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    socket?.disconnect();
    window.location.href = '/';
  };

  // 📡 Cargar canales
  useEffect(() => {
    const fetchChannels = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const resUser = await fetch(`${API_URL}/users/channels`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userChannels = resUser.ok ? await resUser.json() : [];

        const resPublic = await fetch(`${API_URL}/channels/public`);
        const publicChannels = resPublic.ok ? await resPublic.json() : [];

        const allChannels = [...publicChannels, ...userChannels];
        setChannels(allChannels);
      } catch (err) {
        console.error('Error al obtener los grupos:', err);
      }  
    }; 
  fetchChannels();
  }, []);
  //Actualizar el título de la página según el canal seleccionado
  useEffect(() => {
    if (selectedChannel?.name) {
      document.title = `${selectedChannel.name} - Chat App`;
    } else {
      document.title = "Chat App";
    }
  }, [selectedChannel]);

  // ⚙️ Manejadores de canales
  const handleSelectChannel = (channel: any) => setSelectedChannel(channel);

  const handleChannelCreated = (channel: any) => {
    // Verificar si ya existe
    const exists = channels.some(ch => !ch.isPublic && ch.idChannel === channel.idChannel);
    if (exists) {
      alert(`Ya tienes un DM con ${channel.name}`);
      return;
    }

    // Si no existe, añadirlo
    setChannels((prev) => [channel, ...prev]);
    setShowAddUserModal(false);
    setShowCreateModal(false);
  };
  //Eliminar canales privados (de momento)
  const handleDeleteChannel = async (idChannel: number) => {
    const token = localStorage.getItem('token');
    //Capturar errores
    try {
      const res = await fetch(`${API_URL}/channels/${idChannel}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if(res.ok){
      alert("DM eliminado correctamente");
      // 🔄 Quitar el canal de la lista sin recargar
      setChannels((prev) => prev.filter((ch) => ch.idChannel !== idChannel));
    } else {
      const data = await res.json();
      alert(`Error: ${data.message || "No se pudo eliminar el Grupo"}`);
    }
  } catch (err) {
    console.error("Error al eliminar el canal:", err);
  }
}
  //Renderizado
  return (
    <div className="chat-layout">
      <ChatList
        channels={channels}
        onSelectChannel={handleSelectChannel}
        onCreateChannel={() => setShowCreateModal(true)}
        onAddUser={() => setShowAddUserModal(true)}
        onLogout={handleLogout}
        onDeleteChannel={handleDeleteChannel} 
        username={username}
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
          channels={channels}
        />
      )}
    </div>
  );
}
