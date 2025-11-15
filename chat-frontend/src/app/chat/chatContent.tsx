// chat-frontend/src/app/chat/ChatContent.tsx
// Versión corregida y anotada (con tus comentarios ampliados)
// - Backend auto-une a canales públicos (A)
// - Frontend solo hará JOIN manual para: canales privados (isPublic === false && type === 'channel') y DMs (type === 'dm')
// - Evitamos crear/reconectar sockets múltiples, evitamos loops por dependencia `channels` en el efecto de socket
// - Usamos un ref (joinedRoomsRef) para recordar qué rooms ya se unieron y no volver a emitir join

'use client';
import { useState, useEffect, useRef } from 'react';
import { useResponsiveContext } from './Responsive/contextResponsive';
import ResponsiveChatLayout from './Responsive/chatLayoutResponsive';
import ChatList from './chatList';
import ChatWindow from './chatWindow';
import CreateChannelModal from './Modal/CreateChannelModal';
import AddUserModal from './Modal/AddUserModal';
import EditChannelModal from './Modal/EditChannelModal';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/lib/config';

// ======================
// Tipado local
// ======================
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
  // Responsive/context
  const { isMobile, currentChat, setCurrentChat } = useResponsiveContext();

  // Socket (creado UNA vez)
  const [socket, setSocket] = useState<Socket | null>(null);

  // Estado de canales (separados para claridad)
  const [channels, setChannels] = useState<Channel[]>([]);
  const [publicChannels, setPublicChannels] = useState<Channel[]>([]);
  const [privateChannels, setPrivateChannels] = useState<Channel[]>([]);
  const [dmChannels, setDmChannels] = useState<Channel[]>([]);

  // UI
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [channelToEdit, setChannelToEdit] = useState<Channel | null>(null);
  const [globalUnreadCounts, setGlobalUnreadCounts] = useState<{ [key: number]: number }>({});
  const [username, setUsername] = useState('Usuario');

  // === REF para tracks de rooms ya unidas para evitar re-emitir joinRoom ===
  const joinedRoomsRef = useRef<Set<number>>(new Set());

  // === Manejo de reconexiones: cuando socket se reconecta re-join a las rooms en joinedRoomsRef ===
  // Esto se registra en el efecto de socket.

  // ============================================================
  // FUNCIONES AUXILIARES
  // ============================================================
  const handleBackToList = () => setCurrentChat(null);

  const handleEditChannel = (channel: Channel) => {
    console.log('🎯 Abriendo modal de edición para:', channel?.name);
    setChannelToEdit(channel);
    setShowEditModal(true);
  };

  const handleChannelUpdated = (updatedChannel: Channel) => {
    console.log('✅ Canal actualizado:', updatedChannel);

    // Actualizar arrays (channels y listas por tipo)
    setChannels(prev => prev.map(ch => ch.idChannel === updatedChannel.idChannel ? updatedChannel : ch));

    if (updatedChannel.type === 'dm') {
      setDmChannels(prev => prev.map(ch => ch.idChannel === updatedChannel.idChannel ? updatedChannel : ch));
    } else if (updatedChannel.isPublic) {
      setPublicChannels(prev => prev.map(ch => ch.idChannel === updatedChannel.idChannel ? updatedChannel : ch));
    } else {
      setPrivateChannels(prev => prev.map(ch => ch.idChannel === updatedChannel.idChannel ? updatedChannel : ch));
    }

    if (currentChat && currentChat.idChannel === updatedChannel.idChannel) {
      setCurrentChat(updatedChannel);
    }

    setShowEditModal(false);
    setChannelToEdit(null);
  };

  // ============================================================
  // CARGAR CANALES (una vez al montar)
  // ============================================================
  const fetchChannels = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/chat/user-channels`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error('Error cargando canales:', response.statusText);
        return;
      }

      const data = await response.json();
      console.log('📦 Canales cargados:', data);

      // Normalizar nombres de propiedades (backend usa PublicChannels/ privateChannels / dmChannels)
      const pubs = data.PublicChannels || data.publicChannels || [];
      const privs = data.privateChannels || [];
      const dms = (data.dmChannels || []).map((dm: any) => ({ ...dm, type: 'dm', isDM: true }));

      setPublicChannels(pubs);
      setPrivateChannels(privs);
      setDmChannels(dms);

      // Combinar para state general "channels" (mantener orden: públicos primero)
      setChannels([...pubs, ...privs, ...dms]);
    } catch (err) {
      console.error('Error al obtener los canales:', err);
    }
  };

  useEffect(() => {
    fetchChannels(); // Solo al montar
  }, []);

  // ============================================================
  // SOCKET: crear solo UNA VEZ (al montar) y configurar listeners
  // - No incluir "channels" como dependencia aquí para evitar recrear socket
  // ============================================================
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/';
      return;
    }

    const user = localStorage.getItem('username');
    if (user) setUsername(user);

    // Crear socket (solo una vez)
    const s = io(API_URL, { auth: { token } });
    setSocket(s);

    // Al conectar (también pasa en reconexiones), rejoin a las rooms que ya tenemos en joinedRoomsRef
    s.on('connect', () => {
      console.log('Socket conectado', s.id);
      // Re-join a las rooms que registramos anteriormente (útil en reconexiones automáticas)
      joinedRoomsRef.current.forEach(id => {
        try {
          s.emit('joinRoom', id);
          console.log('🔁 Re-joining room:', id);
        } catch (e) {
          console.warn('Error re-joining room', id, e);
        }
      });
    });

    // Manejo de reconexión fallida o no autorizado
    s.on('unauthorized', () => {
      alert('Sesión expirada. Redirigiendo al login.');
      handleLogout();
    });

    // --- Eventos que usas en tu frontend ---
    s.on('newDMChannel', (data) => {
      console.log('💬 newDMChannel', data);

      const currentUserId = localStorage.getItem('idUser');
      if (data.forUserId && currentUserId && data.forUserId.toString() === currentUserId) {
        const newDM: Channel = {
          ...data.channel,
          idChannel: data.channel.idChannel,
          name: data.channel.name,
          isPublic: data.channel.isPublic,
          type: 'dm',
          displayName: data.displayName,
          isDM: true
        };

        // Agregar solo si no existe
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

    s.on('channelDeleted', (data) => {
      console.log('🗑️ channelDeleted', data.channelId);
      setChannels(prev => prev.filter(ch => ch.idChannel !== data.channelId));
      setDmChannels(prev => prev.filter(ch => ch.idChannel !== data.channelId));
      setPublicChannels(prev => prev.filter(ch => ch.idChannel !== data.channelId));
      setPrivateChannels(prev => prev.filter(ch => ch.idChannel !== data.channelId));

      // Si estabas en ese chat, salir
      if (currentChat?.idChannel === data.channelId) setCurrentChat(null);

      // Quitar de joinedRoomsRef si existe
      joinedRoomsRef.current.delete(data.channelId);
    });

    s.on('newMessageNotification', (data) => {
      const { idChannel, sender } = data;
      const currentUser = localStorage.getItem('username');

      if (sender !== currentUser) {
        setGlobalUnreadCounts(prev => ({ ...prev, [idChannel]: (prev[idChannel] || 0) + 1 }));

        if (currentChat?.idChannel !== idChannel && Notification.permission === 'granted') {
          new Notification(`💬 Nuevo mensaje de ${sender}`, { body: 'Tienes un nuevo mensaje en un chat', icon: '/chat-icon.png' });
        }

        if (currentChat?.idChannel !== idChannel) {
          const audio = new Audio('/message.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        }
      }
    });

    // Online users
    s.on('onlineUsers', (users) => {
      // reemite a los listeners en ChatList a través del socket importado
      // (ChatList escucha este evento desde la misma instancia socket)
      console.log('onlineUsers', users);
    });

    // Cleanup: desconectar socket al desmontar
    return () => {
      try { s.disconnect(); } catch (e) { console.warn('Error disconnect socket', e); }
      setSocket(null);
      console.log('🔌 Socket desconectado (cleanup)');
    };

  }, []); // ← SOLO UNA VEZ

  // ============================================================
  // JOIN a rooms que requieren join manual: DMs y privados
  // - Se ejecuta cuando cambian las listas (fetchChannels o creación de canales)
  // - Usa joinedRoomsRef para evitar joins repetidos
  // ============================================================
  useEffect(() => {
    if (!socket || !socket.connected) return;

    // Construir lista de canales que deben recibir join desde frontend
    // Regla: SI backend auto-une a públicos (A), entonces unimos: privados (isPublic===false && type==='channel') y DMs (type==='dm')
    const shouldJoin = channels.filter(ch => (
      (ch.type === 'channel' && ch.isPublic === false) || ch.type === 'dm'
    ));

    shouldJoin.forEach(ch => {
      if (!joinedRoomsRef.current.has(ch.idChannel)) {
        socket.emit('joinRoom', ch.idChannel);
        joinedRoomsRef.current.add(ch.idChannel);
        console.log('🔔 Join manual emitido (frontend) ->', ch.idChannel, ch.name);
      }
    });
  }, [channels, socket]);

  // ============================================================
  // Efectos auxiliares: pedir permisos notificación
  // ============================================================
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ============================================================
  // AUTENTICACIÓN / LOGOUT
  // ============================================================
  const handleLogout = () => {
    localStorage.removeItem('token');
    try { socket?.disconnect(); } catch (e) { /* noop */ }
    window.location.href = '/';
  };

  // ============================================================
  // CREACIÓN/SELECCIÓN/ELIMINACIÓN DE CANALES (front)
  // ============================================================
  const handleChannelCreated = (channelData: any) => {
    console.log('🔄 handleChannelCreated recibió:', channelData);

    if (!channelData || (!channelData.idChannel && !channelData.channelId && !channelData.id)) {
      console.error('❌ Canal inválido recibido', channelData);
      alert('Error: No se pudo crear el canal. Intenta nuevamente.');
      return;
    }

    // Normalizar
    const normalized: Channel = {
      ...channelData,
      idChannel: channelData.idChannel || channelData.channelId || channelData.id,
      name: channelData.name || channelData.displayName || `Canal ${channelData.idChannel || ''}`,
      isPublic: channelData.isPublic ?? false,
      type: channelData.type ?? 'channel',
      displayName: channelData.displayName,
      isDM: channelData.type === 'dm'
    };

    // Cerrar modales
    setShowAddUserModal(false);
    setShowCreateModal(false);

    // Agregar a estados
    if (normalized.type === 'dm') setDmChannels(prev => [normalized, ...prev]);
    if (normalized.type === 'channel' && normalized.isPublic) setPublicChannels(prev => [normalized, ...prev]);
    if (normalized.type === 'channel' && !normalized.isPublic) setPrivateChannels(prev => [normalized, ...prev]);

    setChannels(prev => {
      const exists = prev.some(ch => ch.idChannel === normalized.idChannel);
      if (exists) return prev;
      return [normalized, ...prev];
    });

    // Si es DM o privado, el frontend debe unirse manualmente (backend no lo hizo)
    if (normalized.type === 'dm' || (normalized.type === 'channel' && !normalized.isPublic)) {
      if (socket && socket.connected && !joinedRoomsRef.current.has(normalized.idChannel)) {
        socket.emit('joinRoom', normalized.idChannel);
        joinedRoomsRef.current.add(normalized.idChannel);
      }
    }

    // Seleccionar el canal creado
    setTimeout(() => setCurrentChat(normalized), 100);
  };

  const handleDeleteChannel = async (idChannel: number) => {
    if (!socket) { alert('Error: No hay conexión con el servidor'); return; }
    try {
      socket.emit('deleteChannel', { channelId: idChannel });
    } catch (err) { console.error(err); alert('Error al eliminar el canal'); }
  };

  const handleSelectChannel = (channel: Channel) => {
    console.log('🎯 Seleccionando canal:', channel?.name);
    if (channel?.idChannel) setGlobalUnreadCounts(prev => ({ ...prev, [channel.idChannel]: 0 }));
    setCurrentChat(channel);
  };

  const showNotification = (message: string) => {
    if (Notification.permission === 'granted') new Notification(message);
  };

  // ============================================================
  // RENDER
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

      {showCreateModal && <CreateChannelModal onClose={() => setShowCreateModal(false)} onChannelCreated={handleChannelCreated} />}
      {showAddUserModal && <AddUserModal onClose={() => setShowAddUserModal(false)} onChannelCreated={handleChannelCreated} onChannelSelected={handleSelectChannel} channels={channels} />}
      {showEditModal && channelToEdit && (
        <EditChannelModal channel={channelToEdit} onClose={() => { setShowEditModal(false); setChannelToEdit(null); }} onChannelUpdate={handleChannelUpdated} username={username} idUser={Number(localStorage.getItem('idUser'))} />
      )}
    </>
  );
}
