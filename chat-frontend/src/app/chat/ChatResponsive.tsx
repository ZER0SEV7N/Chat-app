'use client';
import { useState, useEffect } from "react";
import ChatList from "./chatList";
import ChatWindow from "./chatWindow";
import AddUserModal from "./AddUserModal";
import CreateChannelModal from "./CreateChannelModal";
import { API_URL } from "@/lib/config";
import { io, Socket } from "socket.io-client";

export default function ChatResponsive() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [username, setUsername] = useState("Usuario");
  const [isMobile, setIsMobile] = useState(false);

  // 🔌 Detectar si es móvil
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🔌 Conexión con el servidor
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    const user = localStorage.getItem("username");
    if (user) setUsername(user);

    const newSocket = io(API_URL, { auth: { token } });
    setSocket(newSocket);

    newSocket.on("connect", () => console.log("✅ Conectado"));
    newSocket.on("unauthorized", () => {
      alert("Sesión expirada.");
      handleLogout();
    });

    return () => newSocket.disconnect();
  }, []);

  // 🚪 Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    socket?.disconnect();
    window.location.href = "/";
  };

  // 📡 Cargar canales
  useEffect(() => {
    const fetchChannels = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const resUser = await fetch(`${API_URL}/users/channels`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userChannels = resUser.ok ? await resUser.json() : [];

        const resPublic = await fetch(`${API_URL}/channels/public`);
        const publicChannels = resPublic.ok ? await resPublic.json() : [];

        setChannels([...publicChannels, ...userChannels]);
      } catch (err) {
        console.error("Error al obtener canales:", err);
      }
    };
    fetchChannels();
  }, []);

  // ⚙️ Manejadores
  const handleSelectChannel = (channel: any) => setSelectedChannel(channel);
  const handleBack = () => setSelectedChannel(null);

  const handleChannelCreated = (channel: any) => {
    setChannels((prev) => [channel, ...prev]);
    setShowAddUserModal(false);
    setShowCreateModal(false);
  };

  const handleDeleteChannel = async (idChannel: number) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/channels/${idChannel}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setChannels((prev) => prev.filter((ch) => ch.idChannel !== idChannel));
        if (selectedChannel?.idChannel === idChannel) setSelectedChannel(null);
      }
    } catch (err) {
      console.error("Error al eliminar canal:", err);
    }
  };

  return (
    <div className="chat-layout">
      {/* 🧩 Vista en PC */}
      {!isMobile ? (
        <>
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
        </>
      ) : (
        <>
          {/* 🧩 Vista en MÓVIL */}
          {!selectedChannel ? (
            <ChatList
              channels={channels}
              onSelectChannel={handleSelectChannel}
              onCreateChannel={() => setShowCreateModal(true)}
              onAddUser={() => setShowAddUserModal(true)}
              onLogout={handleLogout}
              onDeleteChannel={handleDeleteChannel}
              username={username}
            />
          ) : (
            <div className="mobile-chat">
              <button className="back-btn" onClick={handleBack}>⬅️ Volver</button>
              <ChatWindow socket={socket} channel={selectedChannel} />
            </div>
          )}
        </>
      )}

      {/* 🪟 Modales */}
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
