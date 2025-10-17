  "use client";

  import { useState, useEffect } from "react";
  import { io, Socket } from "socket.io-client";
  import toast from "react-hot-toast";
  import ChatList from "./chatList";
  import ChatWindow from "./chatWindow";
  import CreateChannelModal from "./CreateChannelModal";
  import AddUserModal from "./AddUserModal";
  import FloatingNotification from "./FloatingNotification"; // 👈 añadido

  // Tipo para almacenar el recuento de no leídos
  type UnreadCounts = {
    [channelId: string]: number;
  };

  interface Message {
    channelId: string;
    senderName: string;
    content: string;
    senderId?: string;
  }

  export default function ChatPage() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [channels, setChannels] = useState<any[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<any | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({});
    const [floating, setFloating] = useState<{ sender: string; message: string } | null>(null);

    // 👤 ID del usuario actual
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

    // 1️⃣ Conexión con el servidor
    useEffect(() => {
      const newSocket = io("http://localhost:3000", {
        auth: { token: localStorage.getItem("token") },
      });

      newSocket.on("connect", () => {
        console.log("✅ Conectado al servidor de chat");
      });

      setSocket(newSocket);

      // Permiso para notificaciones
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
          Notification.requestPermission();
        }
      }

      return () => {
        newSocket.disconnect();
        console.log("❌ Socket desconectado");
      };
    }, []);

    // 2️⃣ Cargar canales
    useEffect(() => {
      const fetchChannels = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
          const resUser = await fetch("http://localhost:3000/users/channels", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const userChannels = resUser.ok ? await resUser.json() : [];

          const resPublic = await fetch("http://localhost:3000/channels/public");
          const publicChannels = resPublic.ok ? await resPublic.json() : [];

          const allChannels = [...publicChannels, ...userChannels];
          setChannels(allChannels);
        } catch (err) {
          console.error("Error al obtener canales:", err);
        }
      };

      fetchChannels();
    }, []);

    // 3️⃣ Manejo de mensajes entrantes (solo cuenta los recibidos)
    useEffect(() => {
      if (!socket) return;

      const handleNewMessage = (message: Message) => {
        const { channelId, senderName, content, senderId } = message;
        const isCurrentChannel = selectedChannel && selectedChannel.idChannel === channelId;

        // 🔥 Ignora los mensajes que envía el mismo usuario
        if (senderId && senderId === userId) return;

        // Solo cuenta los mensajes de otros usuarios
        if (!isCurrentChannel) {
          setUnreadCounts((prev) => ({
            ...prev,
            [channelId]: (prev[channelId] || 0) + 1,
          }));

          // 🔔 Toast tipo Discord
          toast(`${senderName}: ${content}`, {
            icon: "💬",
            style: {
              background: "#2b2d31",
              color: "#fff",
              borderRadius: "8px",
              padding: "12px 16px",
            },
          });

          // 🔔 Burbuja flotante
          setFloating({ sender: senderName, message: content });

          // 🔔 Notificación del navegador (si está en segundo plano)
          if (
            typeof window !== "undefined" &&
            document.hidden &&
            Notification.permission === "granted"
          ) {
            new Notification(`Nuevo mensaje`, {
              body: `${senderName}: ${content.substring(0, 30)}${
                content.length > 30 ? "..." : ""
              }`,
              icon: "/favicon.ico",
              vibrate: [200, 100, 200],
            } as any);
          }
        } else {
          // Si estás viendo ese canal, no hay no leídos
          setUnreadCounts((prev) => ({ ...prev, [channelId]: 0 }));
        }
      };

      socket.on("newMessage", handleNewMessage);

      return () => {
        socket.off("newMessage", handleNewMessage);
      };
    }, [socket, selectedChannel, userId]);

    // 4️⃣ Cambiar de canal
    const handleSelectChannel = (channel: any) => {
      setSelectedChannel(channel);
      if (channel?.idChannel) {
        setUnreadCounts((prev) => ({ ...prev, [channel.idChannel]: 0 }));
      }
    };

    // 5️⃣ Nuevo canal creado
    const handleChannelCreated = (channel: any) => {
      setChannels((prev) => [channel, ...prev]);
      setShowAddUserModal(false);
      setShowCreateModal(false);
    };

    // 6️⃣ Actualizar título del navegador (solo mensajes recibidos)
    useEffect(() => {
      const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
      if (totalUnread > 0) {
        document.title = `Chat App (${totalUnread}) 💬`;
      } else {
        document.title = "Chat App";
      }
    }, [unreadCounts]);

    return (
      <div className="chat-layout flex h-screen">
        <ChatList
          channels={channels}
          onSelectChannel={handleSelectChannel}
          onCreateChannel={() => setShowCreateModal(true)}
          onAddUser={() => setShowAddUserModal(true)}
          unreadCounts={unreadCounts}
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

        {/* 💬 Burbuja flotante (se muestra cuando llega un mensaje nuevo) */}
        {floating && (
          <FloatingNotification
            sender={floating.sender}
            message={floating.message}
            onClose={() => setFloating(null)}
          />
        )}
      </div>
    );
  }
