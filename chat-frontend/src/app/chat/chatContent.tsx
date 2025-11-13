//chat-frontend/src/app/chat/ChatContent.tsx
//Contiene toda la lógica del chat con responsive integrado
'use client';
import { useState, useEffect } from "react";
import { useResponsiveContext } from "./Responsive/contextResponsive";
import ResponsiveChatLayout from "./Responsive/chatLayoutResponsive";
import ChatList from './chatList';
import ChatWindow from './chatWindow';
import CreateChannelModal from './Modal/CreateChannelModal';
import AddUserModal from './Modal/AddUserModal';
import EditChannelModal from './Modal/EditChannelModal';
import { io, Socket } from "socket.io-client";
import { API_URL } from "@/lib/config";

// Interfaces para tipado mejorado
interface Channel {
  idChannel: number;
  name: string;
  description?: string;
  isPublic: boolean;
  type: 'channel' | 'dm';
  displayName?: string;
  isDM?: boolean;
  otherUser?: any;
  creator?: any;
  members?: any[];
}

export default function ChatContent() {
  const { isMobile, currentChat, setCurrentChat } = useResponsiveContext();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [publicChannels, setPublicChannels] = useState<Channel[]>([]);
  const [privateChannels, setPrivateChannels] = useState<Channel[]>([]);
  const [dmChannels, setDmChannels] = useState<Channel[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [channelToEdit, setChannelToEdit] = useState<Channel | null>(null);
  const [globalUnreadCounts, setGlobalUnreadCounts] = useState<{ [key: number]: number }>({});
  const [username, setUsername] = useState('Usuario');

  // ============================================================
  // 🔄 FUNCIONES MEJORADAS PARA CANALES Y DMs
  // ============================================================

  const handleBackToList = () => {
    setCurrentChat(null);
  };

  const handleEditChannel = (channel: Channel) => {
    console.log('🎯 Abriendo modal de edición para:', channel?.name);
    setChannelToEdit(channel);
    setShowEditModal(true);
  };

  const handleChannelUpdated = (updatedChannel: Channel) => {
    console.log('✅ Canal actualizado:', updatedChannel);
    
    setChannels(prev => prev.map(ch => 
      ch.idChannel === updatedChannel.idChannel ? updatedChannel : ch
    ));
    
    // Actualizar también en las listas específicas
    if (updatedChannel.type === 'dm') {
      setDmChannels(prev => prev.map(ch => 
        ch.idChannel === updatedChannel.idChannel ? updatedChannel : ch
      ));
    } else if (updatedChannel.isPublic) {
      setPublicChannels(prev => prev.map(ch => 
        ch.idChannel === updatedChannel.idChannel ? updatedChannel : ch
      ));
    } else {
      setPrivateChannels(prev => prev.map(ch => 
        ch.idChannel === updatedChannel.idChannel ? updatedChannel : ch
      ));
    }
    
    if (currentChat && currentChat.idChannel === updatedChannel.idChannel) {
      setCurrentChat(updatedChannel);
    }
    
    setShowEditModal(false);
    setChannelToEdit(null);
  };

  // ============================================================
  // 📡 FUNCIONES DE DATOS Y SOCKETS MEJORADAS
  // ============================================================

  // ✅ FUNCIÓN MEJORADA: Cargar canales separados por tipo
  const fetchChannels = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      // Usar el nuevo endpoint que separa por tipo
      const response = await fetch(`${API_URL}/chat/user-channels`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Canales cargados:', data);
        
        // Separar por tipo usando el campo 'type'
        setPublicChannels(data.publicChannels || []);
        setPrivateChannels(data.privateChannels || []);
        
        // Los DMs ya vienen formateados con displayName
        const formattedDMs = (data.dmChannels || []).map((dm: any) => ({
          ...dm,
          isDM: true,
          type: 'dm'
        }));
        setDmChannels(formattedDMs);
        
        // Combinar todos los canales
        const allChannels = [
          ...(data.publicChannels || []),
          ...(data.privateChannels || []),
          ...formattedDMs
        ];
        setChannels(allChannels);
      }
    } catch (err) {
      console.error('Error al obtener los canales:', err);
    }  
  };

  // Pedir permiso para notificaciones
  useEffect(() => {
    if (typeof window !== 'undefined' && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // ✅ CONEXIÓN SOCKET MEJORADA
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = '/';
      return;
    }
    
    const user = localStorage.getItem("username");
    if (user) setUsername(user);
    
    const newSocket = io(API_URL, {
      auth: { token },
    });
    
    newSocket.on("connect", () => {
      console.log("Conectado al servidor de chat");
      // Unirse automáticamente a todos los canales del usuario
      channels.forEach(channel => {
        if (channel.idChannel) {
          newSocket.emit("joinRoom", channel.idChannel);
        }
      });
    });

    newSocket.on("unauthorized", () => {
      alert("Sesión expirada. Redirigiendo al login.");
      handleLogout();
    });

    // ✅ ESCUCHAR NUEVOS DMs ESPECÍFICAMENTE
    newSocket.on("newDMChannel", (data) => {
      console.log("💬 Nuevo DM recibido:", data);
      
      const currentUserId = localStorage.getItem('idUser');
      if (data.forUserId && currentUserId && data.forUserId.toString() === currentUserId) {
        const newDM = {
          ...data.channel,
          displayName: data.displayName,
          isDM: true,
          type: 'dm'
        };
        
        setDmChannels(prev => {
          const exists = prev.some(dm => dm.idChannel === newDM.idChannel);
          if (exists) return prev;
          return [newDM, ...prev];
        });
        
        setChannels(prev => {
          const exists = prev.some(ch => ch.idChannel === newDM.idChannel);
          if (exists) return prev;
          return [newDM, ...prev];
        });
        
        // Mostrar notificación
        showNotification(`Nuevo chat con ${data.displayName?.replace('DM con ', '')}`);
      }
    });

    // ✅ ESCUCHAR CANALES ELIMINADOS
    newSocket.on("channelDeleted", (data) => {
      console.log("🗑️ Canal eliminado:", data.channelId);
      
      setChannels(prev => prev.filter(ch => ch.idChannel !== data.channelId));
      setDmChannels(prev => prev.filter(ch => ch.idChannel !== data.channelId));
      setPublicChannels(prev => prev.filter(ch => ch.idChannel !== data.channelId));
      setPrivateChannels(prev => prev.filter(ch => ch.idChannel !== data.channelId));
      
      if (currentChat?.idChannel === data.channelId) {
        setCurrentChat(null);
      }
    });

    // ✅ ESCUCHAR NUEVOS MENSAJES PARA NOTIFICACIONES
    newSocket.on("newMessageNotification", (data) => {
      console.log("🔔 Notificación global de mensaje:", data);
      
      const { idChannel, sender } = data;
      const currentUser = localStorage.getItem("username");
      
      if (sender !== currentUser) {
        setGlobalUnreadCounts(prev => ({
          ...prev,
          [idChannel]: (prev[idChannel] || 0) + 1
        }));
        
        // Mostrar notificación del sistema
        if (currentChat?.idChannel !== idChannel && Notification.permission === "granted") {
          new Notification(`💬 Nuevo mensaje de ${sender}`, {
            body: `Tienes un nuevo mensaje en un chat`,
            icon: "/chat-icon.png",
          });
        }
        
        if (currentChat?.idChannel !== idChannel) {
          const audio = new Audio("/message.mp3");
          audio.volume = 0.3;
          audio.play().catch((err) => console.warn("Error reproduciendo sonido:", err));
        }
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      console.log("🔌 Socket desconectado");
    };
  }, [currentChat, isMobile, channels]);

  // Cargar canales al inicio
  useEffect(() => {
    fetchChannels();
  }, []);

  // Actualizar título de la página
  useEffect(() => {
    if (currentChat?.name) {
      document.title = `${currentChat.name} - Chat App`;
    } else {
      document.title = "Chat App";
    }
  }, [currentChat]);

  // ============================================================
  // 🔐 FUNCIONES DE AUTENTICACIÓN
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem('token');
    socket?.disconnect();
    window.location.href = '/';
  };

  // ============================================================
  // 💬 MANEJADORES DE CANALES MEJORADOS
  // ============================================================

  const handleChannelCreated = (channelData: any) => {
    console.log('🔄 handleChannelCreated recibió:', channelData);

    if (!channelData || (!channelData.idChannel && !channelData.channelId && !channelData.id)) {
      console.error('❌ Error: Canal inválido recibido', channelData);
      alert('Error: No se pudo crear el canal. Intenta nuevamente.');
      return;
    }

    // Normalizar la estructura del canal
    const normalizedChannel: Channel = {
      ...channelData,
      idChannel: channelData.idChannel || channelData.channelId || channelData.id,
      name: channelData.name || `DM con ${channelData.targetUsername || 'usuario'}`,
      isPublic: false,
      type: 'dm', // ✅ Especificar que es un DM
      isDM: true,
      displayName: channelData.displayName || `DM con ${channelData.targetUsername || 'usuario'}`
    };

    // Cerrar modales
    setShowAddUserModal(false);
    setShowCreateModal(false);

    // Agregar a las listas correspondientes
    setDmChannels(prev => {
      const exists = prev.some(ch => ch.idChannel === normalizedChannel.idChannel);
      if (exists) return prev;
      return [normalizedChannel, ...prev];
    });

    setChannels(prev => {
      const exists = prev.some(ch => ch.idChannel === normalizedChannel.idChannel);
      if (exists) return prev;
      return [normalizedChannel, ...prev];
    });

    // Seleccionar el canal
    setTimeout(() => {
      console.log('🎯 Seleccionando DM:', normalizedChannel.displayName);
      setCurrentChat(normalizedChannel);
    }, 100);
  };

  // ✅ FUNCIÓN MEJORADA: Eliminar canales usando sockets
  const handleDeleteChannel = async (idChannel: number) => {
    if (!socket) {
      alert("Error: No hay conexión con el servidor");
      return;
    }
    
    try {
      // Emitir evento de socket para eliminar el canal
      socket.emit("deleteChannel", { channelId: idChannel });
      console.log("Solicitando eliminación del canal:", idChannel);
    } catch (err) {
      console.error("Error al eliminar el canal:", err);
      alert("Error al eliminar el canal");
    }
  }

  // ✅ FUNCIÓN MEJORADA: Seleccionar canal y resetear contador
  const handleSelectChannel = (channel: Channel) => {
    console.log('🎯 Seleccionando canal:', channel?.name);
    
    // Resetear contador de mensajes no leídos
    if (channel?.idChannel) {
      setGlobalUnreadCounts(prev => ({
        ...prev,
        [channel.idChannel]: 0
      }));
    }
    
    setCurrentChat(channel);
  };

  // Función auxiliar para mostrar notificaciones
  const showNotification = (message: string) => {
    if (Notification.permission === "granted") {
      new Notification(message);
    }
  };

  // ============================================================
  // 🎨 RENDERIZADO PRINCIPAL
  // ============================================================

  return (
    <>
      <ResponsiveChatLayout
        chatList={
          <ChatList
            channels={channels}
            onSelectChannel={handleSelectChannel}
            onCreateChannel={() => setShowCreateModal(true)}
            onAddUser={() => setShowAddUserModal(true)}
            onLogout={handleLogout}
            onDeleteChannel={handleDeleteChannel}
            username={username}
            unreadCounts={globalUnreadCounts}
            // ✅ Pasar las listas separadas para mejor organización
            publicChannels={publicChannels}
            privateChannels={privateChannels}
            dmChannels={dmChannels}
          />
        }
        chatWindow={
          <ChatWindow
            socket={socket}
            channel={currentChat}
            onEditChannel={handleEditChannel}
            onBackToList={handleBackToList}
          />
        }
        emptyState={
          <div className="chat-empty">
            <div className="chat-empty-message">
              Selecciona un chat para comenzar a conversar 😊
            </div>
          </div>
        }
      />

      {/* MODALES */}
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
          onChannelSelected={handleSelectChannel}
          channels={channels}
        />
      )}

      {showEditModal && channelToEdit && (
        <EditChannelModal
          channel={channelToEdit}
          onClose={() => {
            console.log('🚪 Cerrando modal de edición');
            setShowEditModal(false);
            setChannelToEdit(null);
          }}
          onChannelUpdate={handleChannelUpdated}
          username={username}
          idUser={Number(localStorage.getItem('idUser'))}
        />
      )}
    </>
  );
}