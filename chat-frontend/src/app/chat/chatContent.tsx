// chat-frontend/src/app/chat/ChatContent.tsx
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

  // Estado de canales
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
  
  // MEJORA: Estado mejorado para el usuario
  const [username, setUsername] = useState('Usuario');
  const [userId, setUserId] = useState<number | null>(null);

  // === REF para tracks de rooms ya unidas ===
  const joinedRoomsRef = useRef<Set<number>>(new Set());

  // ============================================================
  // 🔄 CARGA MEJORADA DEL USUARIO (para móvil)
  // ============================================================
  useEffect(() => {
    const loadUserData = () => {
      try {
        const storedUsername = localStorage.getItem("username");
        const storedId = localStorage.getItem("idUser");
        
        console.log('📱 Cargando datos usuario:', { storedUsername, storedId });
        
        if (storedUsername) {
          setUsername(storedUsername);
        } else {
          console.warn('⚠️ No se encontró username en localStorage');
        }
        
        if (storedId) {
          setUserId(Number(storedId));
        }
      } catch (error) {
        console.error('❌ Error cargando datos del usuario:', error);
      }
    };

    // Cargar inmediatamente
    loadUserData();

    // Para móviles: cargar cuando la página esté completamente lista
    if (document.readyState === 'complete') {
      loadUserData();
    } else {
      window.addEventListener('load', loadUserData);
    }

    // Escuchar cambios en el storage (útil para pestañas múltiples)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'username' && e.newValue) {
        setUsername(e.newValue);
      }
      if (e.key === 'idUser' && e.newValue) {
        setUserId(Number(e.newValue));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('load', loadUserData);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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

      const pubs = data.PublicChannels || data.publicChannels || [];
      const privs = data.privateChannels || [];
      const dms = (data.dmChannels || []).map((dm: any) => ({ ...dm, type: 'dm', isDM: true }));

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

  // ============================================================
  // SOCKET: crear solo UNA VEZ (dependencias vacías)
  // ============================================================
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/';
      return;
    }

    // MEJORA: Verificar que existan todos los datos del usuario
    const currentUsername = localStorage.getItem('username');
    const currentUserId = localStorage.getItem('idUser');
    
    if (!currentUsername || !currentUserId) {
      console.error('❌ Datos de usuario incompletos:', { currentUsername, currentUserId });
      // Recargar para obtener datos frescos
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      return;
    }

    console.log('🔌 Conectando socket para usuario:', currentUsername);
    
    // Crear socket (solo una vez)
    const s = io(API_URL, { auth: { token } });
    setSocket(s);

    // Al conectar
    s.on('connect', () => {
      console.log('✅ Socket conectado', s.id, 'para usuario:', currentUsername);
      
      // Re-join a las rooms que registramos anteriormente
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
      console.error('🚫 Socket no autorizado');
      alert('Sesión expirada. Redirigiendo al login.');
      handleLogout();
    });

    // Eventos del socket
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

        showNotification(`Nuevo chat con ${data.displayName?.replace('DM con ', '')}`);
      }
    });

    s.on('channelDeleted', (data) => {
      console.log('🗑️ channelDeleted', data.channelId);
      setChannels(prev => prev.filter(ch => ch.idChannel !== data.channelId));
      setDmChannels(prev => prev.filter(ch => ch.idChannel !== data.channelId));
      setPublicChannels(prev => prev.filter(ch => ch.idChannel !== data.channelId));
      setPrivateChannels(prev => prev.filter(ch => ch.idChannel !== data.channelId));

      if (currentChat?.idChannel === data.channelId) setCurrentChat(null);
      joinedRoomsRef.current.delete(data.channelId);
    });

    s.on('newMessageNotification', (data) => {
      const { idChannel, sender } = data;
      const currentUser = localStorage.getItem('username');

      if (sender !== currentUser) {
        setGlobalUnreadCounts(prev => ({ ...prev, [idChannel]: (prev[idChannel] || 0) + 1 }));

        if (currentChat?.idChannel !== idChannel && Notification.permission === 'granted') {
          new Notification(`💬 Nuevo mensaje de ${sender}`, { 
            body: 'Tienes un nuevo mensaje en un chat', 
            icon: '/chat-icon.png' 
          });
        }

        if (currentChat?.idChannel !== idChannel) {
          const audio = new Audio('/message.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        }
      }
    });

    s.on('onlineUsers', (users) => {
      console.log('👥 onlineUsers', users);
    });

    // Manejo de errores de conexión
    s.on('connect_error', (error) => {
      console.error('❌ Error de conexión socket:', error);
    });

    // Cleanup
    return () => {
      console.log('🔌 Desconectando socket');
      try { 
        s.disconnect(); 
      } catch (e) { 
        console.warn('Error desconectando socket', e); 
      }
      setSocket(null);
    };
  }, []); // ← DEPENDENCIAS VACÍAS: Se crea solo una vez

  // ============================================================
  // JOIN a rooms que requieren join manual
  // ============================================================
  useEffect(() => {
    if (!socket || !socket.connected) return;

    const shouldJoin = channels.filter(ch => (
      (ch.type === 'channel' && ch.isPublic === false) || ch.type === 'dm'
    ));

    shouldJoin.forEach(ch => {
      if (!joinedRoomsRef.current.has(ch.idChannel)) {
        socket.emit('joinRoom', ch.idChannel);
        joinedRoomsRef.current.add(ch.idChannel);
        console.log('🔔 Join manual emitido ->', ch.idChannel, ch.name);
      }
    });
  }, [channels, socket]);

  // ============================================================
  // Efectos auxiliares
  // ============================================================
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Actualizar título
  useEffect(() => {
    if (currentChat?.name) {
      document.title = `${currentChat.name} - Chat App`;
    } else {
      document.title = "Chat App";
    }
  }, [currentChat]);

  // ============================================================
  // AUTENTICACIÓN / LOGOUT MEJORADO
  // ============================================================
  const handleLogout = () => {
    try {
      console.log('🔒 Cerrando sesión de:', username);
      
      if (socket) {
        socket.disconnect();
      }
      
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('idUser');
      
      window.location.href = '/';
    } catch (error) {
      console.error('Error durante logout:', error);
      window.location.href = '/';
    }
  };

  // ============================================================
  // MANEJADORES DE CANALES
  // ============================================================
  const handleChannelCreated = (channelData: any) => {
    console.log('🔄 handleChannelCreated recibió:', channelData);

    if (!channelData || (!channelData.idChannel && !channelData.channelId && !channelData.id)) {
      console.error('❌ Canal inválido recibido', channelData);
      alert('Error: No se pudo crear el canal. Intenta nuevamente.');
      return;
    }

    const normalized: Channel = {
      ...channelData,
      idChannel: channelData.idChannel || channelData.channelId || channelData.id,
      name: channelData.name || channelData.displayName || `Canal ${channelData.idChannel || ''}`,
      isPublic: channelData.isPublic ?? false,
      type: channelData.type ?? 'channel',
      displayName: channelData.displayName,
      isDM: channelData.type === 'dm'
    };

    setShowAddUserModal(false);
    setShowCreateModal(false);

    if (normalized.type === 'dm') setDmChannels(prev => [normalized, ...prev]);
    if (normalized.type === 'channel' && normalized.isPublic) setPublicChannels(prev => [normalized, ...prev]);
    if (normalized.type === 'channel' && !normalized.isPublic) setPrivateChannels(prev => [normalized, ...prev]);

    setChannels(prev => {
      const exists = prev.some(ch => ch.idChannel === normalized.idChannel);
      if (exists) return prev;
      return [normalized, ...prev];
    });

    if (normalized.type === 'dm' || (normalized.type === 'channel' && !normalized.isPublic)) {
      if (socket && socket.connected && !joinedRoomsRef.current.has(normalized.idChannel)) {
        socket.emit('joinRoom', normalized.idChannel);
        joinedRoomsRef.current.add(normalized.idChannel);
      }
    }

    setTimeout(() => setCurrentChat(normalized), 100);
  };

  const handleDeleteChannel = async (idChannel: number) => {
    if (!socket) { 
      alert('Error: No hay conexión con el servidor'); 
      return; 
    }
    try {
      socket.emit('deleteChannel', { channelId: idChannel });
    } catch (err) { 
      console.error(err); 
      alert('Error al eliminar el canal'); 
    }
  };

  const handleSelectChannel = (channel: Channel) => {
    console.log('🎯 Seleccionando canal:', channel?.name);
    if (channel?.idChannel) {
      setGlobalUnreadCounts(prev => ({ ...prev, [channel.idChannel]: 0 }));
    }
    setCurrentChat(channel);
  };

  const showNotification = (message: string) => {
    if (Notification.permission === 'granted') {
      new Notification(message);
    }
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

      {showCreateModal && 
        <CreateChannelModal 
          onClose={() => setShowCreateModal(false)} 
          onChannelCreated={handleChannelCreated} 
        />
      }
      {showAddUserModal && 
        <AddUserModal 
          onClose={() => setShowAddUserModal(false)} 
          onChannelCreated={handleChannelCreated} 
          onChannelSelected={handleSelectChannel} 
          channels={channels} 
        />
      }
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