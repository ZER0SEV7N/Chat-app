//chat-frontend/src/app/chat/ChatContent.tsx
//Contiene toda la lógica del chat con responsive integrado
'use client';
import { useState, useEffect } from "react";
import { useResponsiveContext } from "./Responsive/contextResponsive";
import ResponsiveChatLayout from "./Responsive/chatLayoutResponsive";
import MobileChatHeader from "./Responsive/MobileheaderChat";
import ChatList from './chatList'; //Lista lateral de canales
import ChatWindow from './chatWindow'; //Ventana principal del chat
import CreateChannelModal from './Modal/CreateChannelModal'; //Modal de creación de canal
import AddUserModal from './Modal/AddUserModal'; //Modal para agregar usuario (crear DM)
import EditChannelModal from './Modal/EditChannelModal'; //Modal de edición
import { io, Socket } from "socket.io-client";
import { API_URL } from "@/lib/config";

//Componente que contiene toda la lógica del chat con responsive
export default function ChatContent() {
  //============================================================
  //CONTEXTO RESPONSIVE
  //============================================================
  const { isMobile, currentChat, setCurrentChat } = useResponsiveContext();

  //============================================================
  //ESTADOS DEL COMPONENTE
  //===========================================================
  const [socket, setSocket] = useState<Socket | null>(null); //Estado para el socket
  const [channels, setChannels] = useState<any[]>([]); //Lista de canales
  
  //Estados para controlar los modales
  const [showCreateModal, setShowCreateModal] = useState(false); //Estado para mostrar modal de creación
  const [showAddUserModal, setShowAddUserModal] = useState(false); //Estado para mostrar modal de agregar usuario
  const [showEditModal, setShowEditModal] = useState(false); //Modal de edición de canal
  const [channelToEdit, setChannelToEdit] = useState<any>(null); //Canal seleccionado para editar
  
  const [username, setUsername] = useState('Usuario'); //Nombre de usuario actual

  // ============================================================
  // 🔄 FUNCIONES PARA MANEJAR NAVEGACIÓN MÓVIL
  // ============================================================

  //Manejar selección de canal en responsive
  const handleSelectChannel = (channel: any) => {
    console.log('🎯 Seleccionando canal:', channel?.name);
    setCurrentChat(channel);
  };

  //Volver a la lista de chats en móvil
  const handleBackToList = () => {
    setCurrentChat(null);
  };

  //Abrir modal de edición de canal
   const handleEditChannel = (channel: any) => {
    console.log('🎯 Abriendo modal de edición para:', channel?.name);
    setChannelToEdit(channel);
    setShowEditModal(true);
  };

  //Manejar actualización exitosa de un canal
  const handleChannelUpdated = (updatedChannel: any) => {
    console.log('✅ Canal actualizado:', updatedChannel);
    
    //Actualizar el canal en la lista de canales
    setChannels(prev => prev.map(ch => 
      ch.idChannel === updatedChannel.idChannel ? updatedChannel : ch
    ));
    
    //Si el canal actualizado está seleccionado, actualizarlo también
    if (currentChat && currentChat.idChannel === updatedChannel.idChannel) {
      setCurrentChat(updatedChannel);
      console.log('🔄 Canal seleccionado actualizado');
    }
    
    //Cerrar modal después de la actualización
    setShowEditModal(false);
    setChannelToEdit(null);
  };

  //============================================================
  //FUNCIONES DE DATOS Y SOCKETS
  //============================================================

  //FUNCIÓN MEJORADA: Cargar y filtrar canales por usuario actual
  const fetchChannels = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const currentUser = localStorage.getItem('username');
      console.log('👤 Usuario actual:', currentUser);

      const resUser = await fetch(`${API_URL}/users/channels`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      //Obtener canales del usuario
      const userChannels = resUser.ok ? await resUser.json() : [];
      console.log('📦 Canales sin filtrar del backend:', userChannels);

      //FILTRAR CANALES: Solo mostrar DMs que pertenecen al usuario actual
      const filteredUserChannels = userChannels.filter((channel: any) => {
        //Los canales públicos siempre se muestran
        if (channel.isPublic) return true;
        
        //Para DMs privados, verificar que el usuario actual sea participante
        if (channel.name && channel.name.startsWith('DM ')) {
          const cleanName = channel.name.replace('DM ', '');
          const usernames = cleanName.split('-');
          const userIsParticipant = usernames.includes(currentUser || '');
          
          console.log(`🔍 Verificando DM ${channel.name}:`, {
            usernames,
            currentUser,
            userIsParticipant
          });
          
          return userIsParticipant;
        }
        
        //Si no podemos verificar, no mostrar el canal por seguridad
        console.warn('⚠️ Canal no válido o sin formato DM:', channel);
        return false;
      });

      console.log('✅ Canales filtrados:', filteredUserChannels);

      const resPublic = await fetch(`${API_URL}/channels/public`);
      const publicChannels = resPublic.ok ? await resPublic.json() : [];
      
      const allChannels = [...publicChannels, ...filteredUserChannels];
      setChannels(allChannels);
      
    } catch (err) {
      console.error('Error al obtener los grupos:', err);
    }  
  };

  //Pedir permiso para mostrar notificaciones
  useEffect(() => {
    if (typeof window !== 'undefined' && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  //Conexión con el servidor
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
      console.log("Conectado al servidor de chat");
    });
    
    newSocket.on("unauthorized", () => {
      alert("Sesión expirada. Redirigiendo al login.");
      handleLogout();
    });

    //Escuchar mensajes y mostrar notificación + sonido si el mensaje no es tuyo
    newSocket.on("message", (msg: any) => {
      console.log("📩 Mensaje recibido:", msg);

      const currentUser = localStorage.getItem("username");

      //Solo mostrar notificación si el mensaje NO lo envió el usuario actual
      if (msg.senderName !== currentUser) {
        // Mostrar notificación
        if (Notification.permission === "granted") {
          new Notification(`💬 ${msg.senderName}`, {
            body: msg.content,
            icon: "/chat-icon.png",
          });
        }

        //Reproducir sonido
        const audio = new Audio("/message.mp3");
        audio.volume = 0.7;
        audio.play().catch((err) => console.warn("Error reproduciendo sonido:", err));
      }
    });

    //Escuchar cuando el backend elimine un canal (DM)
    newSocket.on("channelRemoved", ({ idChannel }) => {
      console.log("📢 Canal eliminado:", idChannel);
      setChannels((prev) => prev.filter((ch) => ch.idChannel !== idChannel));
      
      //Si el canal eliminado estaba seleccionado, se limpia
      if (currentChat && currentChat.idChannel === idChannel) {
        setCurrentChat(null);
      }
    });

    //EVENTO MEJORADO: Escuchar cuando se crea un nuevo DM
    newSocket.on("channelCreated", (data) => {
      console.log("💬 Nuevo DM creado via socket:", data);
      
      const currentUser = localStorage.getItem('username');
      const newChannel = data.channel || data;
      
      if (newChannel && newChannel.idChannel) {
        //VERIFICAR que este DM es para el usuario actual
        const shouldAddChannel = newChannel.isPublic || 
          (newChannel.name && newChannel.name.includes(currentUser || ''));
        
        if (shouldAddChannel) {
          setChannels((prev) => {
            //Evitar duplicados
            const exists = prev.some(ch => ch.idChannel === newChannel.idChannel);
            if (exists) return prev;
            return [newChannel, ...prev];
          });
          
          //En móvil, seleccionar automáticamente el nuevo chat
          if (isMobile && !currentChat) {
            setCurrentChat(newChannel);
          }
        } else {
          console.log('🚫 DM ignorado - no pertenece al usuario actual:', newChannel.name);
        }
      }
    });

    //ESCUCHAR CUANDO ALGUIEN TE AGREGA A UN DM
    newSocket.on("newChannelAvailable", (data) => {
      console.log("💬 Tienes un nuevo DM:", data);
      
      //Verificar si este DM es para el usuario actual
      const currentUserId = localStorage.getItem('idUser');
      if (data.forUserId && currentUserId && data.forUserId.toString() === currentUserId) {
        // Recargar la lista de canales para incluir el nuevo DM
        fetchChannels();
        console.log("🔄 Actualizando lista de canales - nuevo DM recibido");
      }
    });

    // Escuchar cuando cualquier canal nuevo está disponible
    newSocket.on("channelAdded", (newChannel) => {
      console.log("📥 Nuevo canal disponible:", newChannel);
      
      const currentUser = localStorage.getItem('username');
      
      //VERIFICAR que el canal sea público o pertenezca al usuario actual
      const shouldAdd = newChannel.isPublic || 
        (newChannel.name && newChannel.name.includes(currentUser || ''));
      
      if (shouldAdd) {
        //Verificar si ya existe
        const exists = channels.some(ch => ch.idChannel === newChannel.idChannel);
        if (!exists) {
          setChannels((prev) => [newChannel, ...prev]);
          console.log("✅ Nuevo canal agregado a la lista");
        }
      } else {
        console.log('🚫 Canal ignorado - no pertenece al usuario actual:', newChannel.name);
      }
    });

    //ESCUCHAR SOLICITUD DE ACTUALIZACIÓN DE CANALES
    newSocket.on("refreshChannels", () => {
      console.log("🔄 Actualizando lista de canales...");
      fetchChannels();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      console.log("🔌 Socket desconectado");
    };
  }, [currentChat, isMobile]); //Incluir isMobile en las dependencias

  //Cargar canales al inicio
  useEffect(() => {
    fetchChannels();
  }, []);

  //Actualizar el título de la página según el canal seleccionado
  useEffect(() => {
    if (currentChat?.name) {
      document.title = `${currentChat.name} - Chat App`;
    } else {
      document.title = "Chat App";
    }
  }, [currentChat]);

  //============================================================
  //FUNCIONES DE AUTENTICACIÓN
  //============================================================

  //Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    socket?.disconnect();
    window.location.href = '/';
  };

  //============================================================
  //MANEJADORES DE CANALES
  //============================================================

  //Metodo para manejar canal creado (desde modal)
  const handleChannelCreated = (channel: any) => {
    console.log('🔄 handleChannelCreated recibió:', channel);

    //Validación más estricta
    if (!channel || (!channel.idChannel && !channel.channelId && !channel.id)) {
      console.error('❌ Error: Canal inválido recibido', channel);
      alert('Error: No se pudo crear el canal. Intenta nuevamente.');
      return;
    }

    //Normalizar la estructura del canal
    const normalizedChannel = {
      ...channel,
      idChannel: channel.idChannel || channel.channelId || channel.id,
      name: channel.name || `DM con ${channel.targetUsername || 'usuario'}`,
      isPublic: false // Forzar que sea privado
    };

    //Cerrar modales inmediatamente
    setShowAddUserModal(false);
    setShowCreateModal(false);

    //Agregar a la lista y seleccionar
    setChannels((prev) => {
      const exists = prev.some(ch => 
        ch.idChannel === normalizedChannel.idChannel
      );
      
      if (exists) {
        return prev.map(ch => 
          ch.idChannel === normalizedChannel.idChannel ? normalizedChannel : ch
        );
      }

      return [normalizedChannel, ...prev];
    });

    //Seleccionar el canal después de un delay
    setTimeout(() => {
      console.log('🎯 Seleccionando canal:', normalizedChannel.name);
      setCurrentChat(normalizedChannel);
    }, 100);
  };

  //Eliminar canales privados usando sockets
  const handleDeleteChannel = async (idChannel: number) => {
    if (!socket) {
      alert("Error: No hay conexión con el servidor");
      return;
    }
    try{
      //Emitir evento de socket para eliminar el canal
      socket.emit("deleteChannel", idChannel);
      
      //El canal se eliminará automáticamente cuando llegue el evento 'channelRemoved'
      console.log("Solicitando eliminación del canal:", idChannel);
      
    }catch (err) {
      console.error("Error al eliminar el canal:", err);
      alert("Error al eliminar el canal");
    }
  }

  //============================================================
  //RENDERIZADO PRINCIPAL CON LAYOUT RESPONSIVE
  //============================================================

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
          />
        }
        chatWindow={
          <>
            {/* ✅ ELIMINAMOS el MobileChatHeader separado */}
            {/* El botón ahora está INTEGRADO en el ChatWindow */}
            
            <ChatWindow
              socket={socket}
              channel={currentChat}
              onEditChannel={handleEditChannel}
              onBackToList={isMobile ? handleBackToList : undefined}
            />
          </>
        }
        emptyState={
          <div className="chat-empty">
            <div className="chat-empty-message">
              Selecciona un chat para comenzar a conversar 😊
            </div>
          </div>
        }
      />

      {/*============================================================
        MODALES - Se renderizan condicionalmente
        ============================================================ */}

      {/* Modal de creación de canal */}
      {showCreateModal && (
        <CreateChannelModal
          onClose={() => setShowCreateModal(false)}
          onChannelCreated={handleChannelCreated}
        />
      )}

      {/* Modal para agregar usuario (crear DM) */}
      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onChannelCreated={handleChannelCreated}
          onChannelSelected={handleSelectChannel}
          channels={channels}
        />
      )}

      {/* Modal de edición de canal */}
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