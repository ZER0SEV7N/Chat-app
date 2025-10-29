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
  const [username, setUsername] = useState('Usuario');

  // 🔔 Pedir permiso para mostrar notificaciones
  useEffect(() => {
    if (typeof window !== 'undefined' && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // 🔌 Conexión con el servidor
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = '/';
      return;
    }

    const user = localStorage.getItem("username");
    if (user) setUsername(user);

    const newSocket = io("http://192.168.1.56:3000", {
      auth: { token },
    });

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
        const resUser = await fetch('http://192.168.1.56:3000/users/channels', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userChannels = resUser.ok ? await resUser.json() : [];

        const resPublic = await fetch('http://192.168.1.56:3000/channels/public');
        const publicChannels = resPublic.ok ? await resPublic.json() : [];

        const allChannels = [...publicChannels, ...userChannels];
        setChannels(allChannels);
      } catch (err) {
        console.error('Error al obtener canales:', err);
      }
    };

    fetchChannels();
  }, []);

  // ⚙️ Manejadores de canales
  const handleSelectChannel = (channel: any) => setSelectedChannel(channel);

  const handleChannelCreated = (channel: any) => {
    const exists = channels.some(ch => !ch.isPublic && ch.idChannel === channel.idChannel);
    if (exists) {
      alert(`Ya tienes un DM con ${channel.name}`);
      return;
    }

    setChannels((prev) => [channel, ...prev]);
    setShowAddUserModal(false);
    setShowCreateModal(false);
  };

  // 🎨 Render
  return (
    <div className="chat-layout">
      <ChatList
        channels={channels}
        onSelectChannel={handleSelectChannel}
        onCreateChannel={() => setShowCreateModal(true)}
        onAddUser={() => setShowAddUserModal(true)}
        onLogout={handleLogout}
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
