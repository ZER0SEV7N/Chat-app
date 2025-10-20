'use client';
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import ChatList from './chatList';
import ChatWindow from './chatWindow';
import CreateChannelModal from './CreateChannelModal';
import AddUserModal from './AddUserModal';

//Funcion principales de la pagina del chat
export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [username, setUsername] = useState('Usuario'); // nombre del usuario

  //conexion con el servidor para cargar los mensajes
  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      //Si no hay token, redirigir al login
      window.location.href = '/';
      return;
    }
    // Leer el username del localStorage solo en cliente
    const user = localStorage.getItem("username");
    if (user) setUsername(user);

    //Conectarse con el backend
    const newSocket = io("http://localhost:3000", {
      auth: { token },
    });
    //Si el servidor detecta el token
    newSocket.on("connect", () => {
      console.log("Conectado al servidor de chat");
    });
    
    setSocket(newSocket);

    // Si el servidor detecta token inválido
    newSocket.on("unauthorized", () => {
      alert("Sesión expirada. Redirigiendo al login.");
      handleLogout();
    });

    //Función de limpieza correcta
    return () => {
      newSocket.disconnect(); //Cierra la conexión
      console.log("Socket desconectado");
    };
  }, []);
  //Funcion de logout
  const handleLogout = () => {
    localStorage.removeItem('token') //Eliminar el token
    socket?.disconnect();
    window.location.href = '/'; //Redirigir al comienzo
  }
  //FETCH de los canales//
    //Cargar canales desde el backend
    useEffect(() => {
    const fetchChannels = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        //1. Obtener canales del usuario (DMs)
        const resUser = await fetch('http://localhost:3000/users/channels', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userChannels = resUser.ok ? await resUser.json() : [];

        //2. Obtener canales públicos
        const resPublic = await fetch('http://localhost:3000/channels/public');
        const publicChannels = resPublic.ok ? await resPublic.json() : [];

        //3. Combinar ambos (sin duplicar)
        const allChannels = [...publicChannels, ...userChannels];

        setChannels(allChannels);
      } catch (err) {
        console.error('Error al obtener canales:', err);
      }
    };

    fetchChannels();
  }, []);

  //FUNCIONES DEL CHAT//
  //Funcion seleccionar un canal
  const handleSelectChannel = (channel: any) => setSelectedChannel(channel);
  //Funcion al crear un canal
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

  //Renderizado
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
