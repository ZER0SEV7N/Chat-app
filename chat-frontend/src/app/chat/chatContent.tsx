//chat-frontend/src/app/chat/ChatContent.tsx
//Modulo principal encargado de llamar al resto de modulos
'use client';
import { useState, useEffect, useRef } from 'react';
import { useResponsiveContext } from './Responsive/contextResponsive';
import ResponsiveChatLayout from './Responsive/chatLayoutResponsive';
import ChatList from './chatList';
import toast from 'react-hot-toast';
import ChatWindow from './chatWindow';
import ChannelManagerModal from './Modal/ChannelManagerModal';
import AddUserModal from './Modal/AddUserModal';
import EditChannelModal from './Modal/EditChannelModal';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/lib/config';

//======================
//Tipado local
//======================
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

  //========================================
  // Estado general y contexto responsive
  //========================================
  const { isMobile, currentChat, setCurrentChat } = useResponsiveContext();

  //Socket principal de la app (solo se crea una vez)
  const [socket, setSocket] = useState<Socket | null>(null);

  //Estado de todas las categorías de canales
  const [channels, setChannels] = useState<Channel[]>([]);
  const [publicChannels, setPublicChannels] = useState<Channel[]>([]);
  const [privateChannels, setPrivateChannels] = useState<Channel[]>([]);
  const [dmChannels, setDmChannels] = useState<Channel[]>([]);

  //Estado para abrir/cerrar modales
  const [showChannelManager, setShowChannelManager] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [channelToEdit, setChannelToEdit] = useState<Channel | null>(null);

  //Contadores globales de mensajes no leídos
  const [globalUnreadCounts, setGlobalUnreadCounts] = useState<{ [key: number]: number }>({});

  //Estado del usuario autenticado
  const [username, setUsername] = useState('Usuario');
  const [userId, setUserId] = useState<number | null>(null);

  //Rooms joined para evitar reinicios de join al reconectar
  const joinedRoomsRef = useRef<Set<number>>(new Set());

  //============================================================
  // Cargar usuario desde localStorage (pensado para móvil)
  //============================================================
  useEffect(() => {
    const loadUserData = () => {
      try {
        const storedUsername = localStorage.getItem("username");
        const storedId = localStorage.getItem("idUser");

        if (storedUsername) setUsername(storedUsername);
        if (storedId) setUserId(Number(storedId));
      } catch (error) {
        console.error('❌ Error cargando datos del usuario:', error);
      }
    };

    // Ejecutar carga inicial
    loadUserData();

    // Forzar carga al completar page load (android/webview)
    if (document.readyState !== 'complete') {
      window.addEventListener('load', loadUserData);
    }

    // Escuchar sincronización entre pestañas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'username' && e.newValue) setUsername(e.newValue);
      if (e.key === 'idUser' && e.newValue) setUserId(Number(e.newValue));
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('load', loadUserData);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  //============================================================
  // Funciones auxiliares UI
  //============================================================

  //Volver a la lista de chats (solo móvil)
  const handleBackToList = () => setCurrentChat(null);

  //Abrir el modal de edición
  const handleEditChannel = (channel: Channel) => {
    setChannelToEdit(channel);
    setShowEditModal(true);
  };

  //Aplicar cambios después de editar canal
  const handleChannelUpdated = (updatedChannel: Channel) => {
    //Actualizar canal en todas las listas correspondientes
    setChannels(prev =>
      prev.map(ch => ch.idChannel === updatedChannel.idChannel ? updatedChannel : ch)
    );

    if (updatedChannel.type === 'dm') {
      setDmChannels(prev =>
        prev.map(ch => ch.idChannel === updatedChannel.idChannel ? updatedChannel : ch)
      );
    } else if (updatedChannel.isPublic) {
      setPublicChannels(prev =>
        prev.map(ch => ch.idChannel === updatedChannel.idChannel ? updatedChannel : ch)
      );
    } else {
      setPrivateChannels(prev =>
        prev.map(ch => ch.idChannel === updatedChannel.idChannel ? updatedChannel : ch)
      );
    }

    //Si el usuario está dentro del canal editado, refrescarlo
    if (currentChat?.idChannel === updatedChannel.idChannel) {
      setCurrentChat(updatedChannel);
    }

    //Cerrar modal
    setShowEditModal(false);
    setChannelToEdit(null);
  };

  //============================================================
  // Obtener canales del usuario al montar el componente
  //============================================================
  const fetchChannels = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/chat/user-channels `, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error('Error cargando canales:', response.statusText);
        return;
      }

      const data = await response.json();

      const pubs = data.PublicChannels || data.publicChannels || [];
      const privs = data.privateChannels || [];
      const dms = (data.dmChannels || []).map((dm: any) => ({
        ...dm,
        type: 'dm',
        isDM: true
      }));

      //Actualizar estado
      setPublicChannels(pubs);
      setPrivateChannels(privs);
      setDmChannels(dms);
      setChannels([...pubs, ...privs, ...dms]);

    } catch (err) {
      console.error('Error al obtener los canales:', err);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  //============================================================
  // Crear y manejar conexión Socket.IO
  //============================================================
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/';
      return;
    }

    const currentUsername = localStorage.getItem('username');
    const currentUserId = localStorage.getItem('idUser');

    //Si falta info del usuario, recargar para sincronizar
    if (!currentUsername || !currentUserId) {
      setTimeout(() => window.location.reload(), 1000);
      return;
    }

    //Crear socket
    const s = io(API_URL, { auth: { token } });
    setSocket(s);

    //Al conectar, re-join de rooms
    s.on('connect', () => {
      joinedRoomsRef.current.forEach(id => {
        s.emit('joinRoom', id);
      });
    });

    //Manejo sesión expirada
    s.on('unauthorized', () => {
      toast.error('Sesión expirada. Redirigiendo al login.');
      handleLogout();
    });

    //Evento: recibir nuevo DM
    s.on('newDMChannel', (data) => {
      const currentUserId = localStorage.getItem('idUser');

      //Solo agregar si el DM es para el usuario
      if (data.forUserId && currentUserId && data.forUserId.toString() === currentUserId) {
        const newDM: Channel = {
          ...data.channel,
          idChannel: data.channel.idChannel,
          type: 'dm',
          displayName: data.displayName,
          isDM: true
        };

        //Insertar DM si no existe
        setDmChannels(prev => {
          const exists = prev.some(dm => dm.idChannel === newDM.idChannel);
          return exists ? prev : [newDM, ...prev];
        });

        setChannels(prev => {
          const exists = prev.some(ch => ch.idChannel === newDM.idChannel);
          return exists ? prev : [newDM, ...prev];
        });

        showNotification(`Nuevo chat con ${data.displayName?.replace('DM con ', '')}`);
      }
    });

    //Evento: canal eliminado
    s.on('channelDeleted', (data) => {
      setChannels(prev => prev.filter(ch => ch.idChannel !== data.channelId));
      setDmChannels(prev => prev.filter(ch => ch.idChannel !== data.channelId));
      setPublicChannels(prev => prev.filter(ch => ch.idChannel !== data.channelId));
      setPrivateChannels(prev => prev.filter(ch => ch.idChannel !== data.channelId));

      if (currentChat?.idChannel === data.channelId) setCurrentChat(null);

      joinedRoomsRef.current.delete(data.channelId);
    });

    //Notificación de nuevo mensaje
    s.on('newMessageNotification', (data) => {
      const { idChannel, sender } = data;
      const currentUser = localStorage.getItem('username');

      if (sender !== currentUser) {
        //Incrementar contador
        setGlobalUnreadCounts(prev => ({
          ...prev,
          [idChannel]: (prev[idChannel] || 0) + 1
        }));

        //Notificación visual
        if (currentChat?.idChannel !== idChannel && Notification.permission === 'granted') {
          new Notification(`💬 Nuevo mensaje de ${sender}`);
        }

        //Efecto de sonido
        if (currentChat?.idChannel !== idChannel) {
          const audio = new Audio('/message.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        }
      }
    });

    s.on('connect_error', err => {
      console.error('❌ Error de conexión socket:', err);
    });

    //Cleanup al desmontar
    return () => {
      try { s.disconnect(); } catch {}
      setSocket(null);
    };
  }, []);

  //============================================================
  // Join automático a rooms privadas y DMs
  //============================================================
  useEffect(() => {
    if (!socket || !socket.connected) return;

    const shouldJoin = channels.filter(ch =>
      (ch.type === 'channel' && !ch.isPublic) || ch.type === 'dm'
    );

    shouldJoin.forEach(ch => {
      if (!joinedRoomsRef.current.has(ch.idChannel)) {
        socket.emit('joinRoom', ch.idChannel);
        joinedRoomsRef.current.add(ch.idChannel);
      }
    });
  }, [channels, socket]);

  //============================================================
  // Solicitar permisos de notificación
  //============================================================
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') Notification.requestPermission();
    }
  }, []);

  //Actualizar título del documento dependiendo del chat activo
  useEffect(() => {
    document.title = currentChat?.name
      ? `${currentChat.name} - Chat App`
      : 'Chat App';
  }, [currentChat]);

  //============================================================
  // Logout y limpieza de sesión
  //============================================================
  const handleLogout = () => {
    try {
      if (socket) socket.disconnect();
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('idUser');
      window.location.href = '/';
    } catch {
      window.location.href = '/';
    }
  };

  //============================================================
  // Crear canal, unirse, seleccionar, borrar
  //============================================================
  const handleChannelCreated = (channelData: any) => {
    if (!channelData) {
      toast.error('Error creando canal');
      return;
    }

    //Normalizar datos recibidos
    const normalized: Channel = {
      ...channelData,
      idChannel: channelData.idChannel || channelData.channelId || channelData.id,
      name: channelData.name || channelData.displayName || `Canal`,
      isPublic: channelData.isPublic ?? false,
      type: channelData.type ?? 'channel',
      isDM: channelData.type === 'dm'
    };

    //Cerrar modales
    setShowAddUserModal(false);
    setShowChannelManager(false);

    //Insertar en lista correspondiente
    if (normalized.type === 'dm') setDmChannels(prev => [normalized, ...prev]);
    if (normalized.type === 'channel' && normalized.isPublic) setPublicChannels(prev => [normalized, ...prev]);
    if (normalized.type === 'channel' && !normalized.isPublic) setPrivateChannels(prev => [normalized, ...prev]);

    //Insertar en "channels" si no existe
    setChannels(prev => {
      const exists = prev.some(ch => ch.idChannel === normalized.idChannel);
      return exists ? prev : [normalized, ...prev];
    });

    //Unirse automáticamente
    if ((normalized.type === 'dm' || !normalized.isPublic) && socket && socket.connected) {
      socket.emit('joinRoom', normalized.idChannel);
      joinedRoomsRef.current.add(normalized.idChannel);
    }

    //Seleccionar canal
    setTimeout(() => setCurrentChat(normalized), 100);
  };


  const handleChannelJoined = (channelData: any) => {
    const normalized: Channel = {
      ...channelData,
      idChannel: channelData.idChannel || channelData.channelId || channelData.id,
      name: channelData.name || channelData.displayName || `Canal`,
      type: 'channel',
      isPublic: channelData.isPublic ?? true
    };

    setShowChannelManager(false);

    //Actualizar listas
    setPublicChannels(prev => {
      const exists = prev.some(ch => ch.idChannel === normalized.idChannel);
      return exists ? prev.map(ch => ch.idChannel === normalized.idChannel ? normalized : ch) : [normalized, ...prev];
    });

    setChannels(prev => {
      const exists = prev.some(ch => ch.idChannel === normalized.idChannel);
      return exists ? prev.map(ch => ch.idChannel === normalized.idChannel ? normalized : ch) : [normalized, ...prev];
    });

    //Unirse en socket
    if (socket && socket.connected && !joinedRoomsRef.current.has(normalized.idChannel)) {
      socket.emit('joinRoom', normalized.idChannel);
      joinedRoomsRef.current.add(normalized.idChannel);
    }

    setTimeout(() => setCurrentChat(normalized), 100);
  };

  //Funcion para eliminar un canal
  const handleDeleteChannel = async (idChannel: number) => {
    if (!socket) {
      toast.error('Error: No hay conexión con el servidor');
      return;
    }
    socket.emit('deleteChannel', { channelId: idChannel });
  };

  //Funcion para seleccionar un canal
  const handleSelectChannel = (channel: Channel) => {
    if (channel.idChannel) {
      //Limpiar contador de no leídos
      setGlobalUnreadCounts(prev => {
        const newCounts = { ...prev };
        delete newCounts[channel.idChannel];
        return newCounts;
      });

      //Informar al backend que se leyeron
      if (socket && socket.connected) {
        socket.emit('markAsRead', {
          channelId: channel.idChannel,
          userId: userId
        });
      }
    }

    setCurrentChat(channel);
  };

  // Notificación simple
  const showNotification = (message: string) => {
    if (Notification.permission === 'granted') {
      new Notification(message);
    }
  };

  //============================================================
  // Render principal
  //============================================================
  return (
    <>
      <ResponsiveChatLayout
        chatList={
          <ChatList
            channels={channels}
            onSelectChannel={handleSelectChannel}
            onChannelManager={() => setShowChannelManager(true)}
            onAddUser={() => setShowAddUserModal(true)}
            onLogout={handleLogout}
            onDeleteChannel={handleDeleteChannel}
            username={username}
            unreadCounts={globalUnreadCounts}
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
        emptyState={(
          <div className="chat-empty">
            <div className="chat-empty-message">Selecciona un chat para comenzar a conversar 😊</div>
          </div>
        )}
      />

      {/* Modal para administrar canales */}
      {showChannelManager &&
        <ChannelManagerModal
          onClose={() => setShowChannelManager(false)}
          onChannelCreated={handleChannelCreated}
          onChannelJoined={handleChannelJoined}
        />
      }

      {/* Modal para crear DMs */}
      {showAddUserModal &&
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onChannelCreated={handleChannelCreated}
          onChannelSelected={handleSelectChannel}
          channels={channels}
        />
      }

      {/* Modal de edición */}
      {showEditModal && channelToEdit && (
        <EditChannelModal
          channel={channelToEdit}
          onClose={() => {
            setShowEditModal(false);
            setChannelToEdit(null);
          }}
          onChannelUpdate={handleChannelUpdated}
          username={username}
          idUser={userId || Number(localStorage.getItem('idUser'))}
        />
      )}
    </>
  );
}
