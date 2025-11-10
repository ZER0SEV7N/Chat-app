//chat-frontend/src/app/chat/chatList.tsx
import React, { useEffect, useState } from "react";
//Importar estilos CSS
import './chat.css';
import "./chat-responsive.css"; 
import "./chat-dark.css";
import socket from "@/lib/socket";
//Definir las propiedades del componente
interface Props {
  channels: any[]; //Lista de canales
  onSelectChannel: (channel: any) => void; //Función al seleccionar un canal
  onCreateChannel: () => void; //Función para crear un canal
  onAddUser: () => void; //Función para agregar un usuario
  onLogout: () => void; //Función para cerrar sesión
  onDeleteChannel: (idChannel: number) => void; //Funcion para eliminar un canal
  username: string; //Nombre de usuario del usuario actual
}

//Definir y exportar el componente ChatList
export default function ChatList({
  channels,
  onSelectChannel,
  onCreateChannel,
  onAddUser,
  onLogout,
  onDeleteChannel,
  username,
}: Props) {
  const [searchTerm, setSearchTerm] = useState(""); //Para buscar DM
  const [unreadCounts, setUnreadCounts] = useState<{ [key: number]: number }>({});
  const [onlineUsers, setOnlineUsers] = useState<{ idUser: number; username: string }[]>([]);
  //Efecto: ✅ Escuchar mensajes y usuarios conectados
  useEffect(() => {
    if (!socket || !socket.connected) return;
    //Cuando llega un nuevo mensaje, aumentar el contador si no lo envió el usuario actual
    const handleNewMessage = (data: any) => {
      const { idChannel, sender } = data;
      if (sender !== username) {
        setUnreadCounts((prev) => ({
          ...prev,
          [idChannel]: (prev[idChannel] || 0) + 1,
        }));
      }
    };

    // 🟢 Lista de usuarios en línea (ahora el backend manda [{idUser, username}])
    const handleOnlineUsers = (users: { idUser: number; username: string }[]) => {
      setOnlineUsers(users);
    };

    socket.on("newMessageNotification", handleNewMessage);
    socket.on("onlineUsers", handleOnlineUsers);

    // Avisar al servidor que este usuario está conectado
    socket.emit("userConnected", username);

    return () => {
      socket.off("newMessageNotification", handleNewMessage);
      socket.off("onlineUsers", handleOnlineUsers);
    };
  }, [username]);

   const handleSelectChannel = (channel: any) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [channel.idChannel]: 0,
    }));
    onSelectChannel(channel);
  };


  //Separar canales en grupos y MDs
  const uniqueChannels = channels.filter((channel, index, self) => 
    index === self.findIndex(ch => 
      ch.idChannel === channel.idChannel && ch.idChannel !== undefined
    )
  );

  // Luego usar uniqueChannels en lugar de channels
  const groups = uniqueChannels.filter(ch => ch?.isPublic);
  const directMessages = uniqueChannels.filter(ch => ch && !ch.isPublic);

  //Formatear nombre para MDs
  const formatDMName = (channelName: string) => {
    if (typeof channelName === "string" && channelName.startsWith("DM ")) {
      const parts = channelName.replace("DM ", "").split("-");
      const currentUser = username;
      const otherUser = parts[0] === currentUser ? parts[1] : parts[0];
      return otherUser;
    }
    return channelName;
  };

  // Confirmación de borrado con ventana nativa
  const handleDeleteClick = (ch: any) => {
    if (!ch.isPublic) {
      const displayName = formatDMName(ch.name);
      const confirmDelete = confirm(
        `¿Seguro que deseas eliminar este DM con ${displayName}?`
      );
      if (confirmDelete) onDeleteChannel(ch.idChannel);
    }
  };
  //Función para generar keys únicas
  const generateUniqueKey = (ch: any, type: 'group' | 'dm', index: number) => {
    if (ch.idChannel) {
      return `${type}-${ch.idChannel}`;
    }
    //Si no hay idChannel, crear una key única basada en múltiples propiedades
    return `${type}-${ch.name}-${ch.creatorId || 'unknown'}-${index}`;
  };
  //Funcion para filtrar los dm
  const filteredDMs = directMessages.filter((ch) => {
    const displayName = formatDMName(ch.name).toLowerCase();
    return displayName.includes(searchTerm.toLowerCase());
  });

  // 🧱 Renderizado del componente
  return (
    <div className="chat-list">
      {/* 🧑 Header del usuario actual */}
      <div className="chat-list-header">
        <span className="chat-username-header">{username}</span>
        <button className="logout-btn" onClick={onLogout}>
          🚪 Cerrar sesión
        </button>
      </div>

      {/* 🟢 Sección de usuarios en línea */}
      <div className="online-users">
        <h3>Usuarios en línea:</h3>
        {onlineUsers.length > 0 ? (
          <ul>
            {onlineUsers.map((user) => (
              <li key={user.idUser} className={user.username === username ? "self" : ""}>
                {user.username === username ? `${user.username} (Tú)` : user.username}
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay usuarios conectados</p>
        )}
      </div>

      {/* 💬 Sección de Mensajes Directos */}
      <div className="channels-section">
        <h2 className="section-title">💬 Mensajes Directos</h2>

        {/* 🔍 Barra de búsqueda */}
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* 📜 Lista de DMs */}
        {filteredDMs.length > 0 ? (
          <ul className="channel-list">
            {filteredDMs.map((ch, index) => {
              const displayName = formatDMName(ch.name);
              const unread = unreadCounts[ch.idChannel] || 0; //Cantidad de mensajes no leídos
              const isOnline = onlineUsers.some((u) => u.username === displayName); //Estado online
              return (
                <li
                  key={generateUniqueKey(ch, "dm", index)}
                  className="channel-item dm-item"
                  onClick={() => handleSelectChannel(ch)}
                >
                  <div className="channel-info">
                    <strong className="channel-name">{displayName}</strong>
                    {isOnline && <span className="status-dot online"></span>}
                    {unread > 0 && <span className="message-bubble">{unread}</span>}
                    <small className="channel-type">Privado</small>
                    {/* Botón para eliminar DM */}
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(ch);
                      }}
                      title={`Eliminar conversación con ${displayName}`}
                    >
                      🗑️
                    </button>
                  </div>
                  {ch.description && (
                    <p className="channel-description">{ch.description}</p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty-state">No hay resultados</p>
        )}
      </div>

      {/* 🌐 Sección de Grupos */}
      <div className="channels-section">
        <h2 className="section-title">🌐 Grupos</h2>
        {groups.length > 0 ? (
          <ul className="channel-list">
            {groups.map((ch, index) => {
              const unread = unreadCounts[ch.idChannel] || 0;
              return (
                <li
                  key={generateUniqueKey(ch, "group", index)}
                  className="channel-item group-item"
                  onClick={() => handleSelectChannel(ch)}
                >
                  <div className="channel-info">
                    <strong className="channel-name">
                      {ch.name || "Grupo sin nombre"}
                    </strong>
                    {unread > 0 && <span className="message-bubble">{unread}</span>}
                    <small className="channel-type">Público</small>
                  </div>
                  {ch.description && (
                    <p className="channel-description">{ch.description}</p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty-state">No tienes grupos</p>
        )}
      </div>

      {/* ⚙️ Botones de acción lateral */}
      <div className="chat-list-buttons">
        <button className="sidebar-button" onClick={onCreateChannel}>
          ➕ Nuevo Grupo
        </button>
        <button className="sidebar-button" onClick={onAddUser}>
          👥 Iniciar un DM
        </button>
      </div>
    </div>
  );
}