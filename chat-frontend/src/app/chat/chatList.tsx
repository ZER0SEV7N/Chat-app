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
  unreadCounts?: { [key: number]: number }; //Contadores de mensajes no leídos por canal
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
  unreadCounts = {}, 
}: Props) {
  const [searchTerm, setSearchTerm] = useState(""); //Para buscar DM
  const [onlineUsers, setOnlineUsers] = useState<{ idUser: number; username: string }[]>([]); //Usuarios en línea
  const [collapsedSections, setCollapsedSections] = useState({ dms: false, groups: false });

  //Efecto: Escuchar mensajes y usuarios conectados
  useEffect(() => {
    if (!socket || !socket.connected) return;

    //Lista de usuarios en línea (ahora el backend manda [{idUser, username}])
    const handleOnlineUsers = (users: { idUser: number; username: string }[]) => {
      setOnlineUsers(users);
    };
    //Escuchar eventos del socket
    socket.on("onlineUsers", handleOnlineUsers);
    socket.emit("userConnected", username);

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
    };
  }, [username]);

    //Manejar selección de canal
   const handleSelectChannel = (channel: any) => {
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

  //Función para colapsar secciones
  const toggleSection = (section: 'dms' | 'groups') => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  //Verificar si un usuario esta en linea
  const isUserOnline = (usernameToCheck: string) => {
    return onlineUsers.some((user) => user.username === usernameToCheck);
  }

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

  //Renderizado del componente
  return (
    <div className="chat-list">
      {/*Header del usuario actual */}
      <div className="chat-list-header">
        <span className="chat-username-header">{username}</span>
        <button className="logout-btn" onClick={onLogout}>
          🚪 Cerrar sesión
        </button>
      </div>

      {/* 💬 Sección de Mensajes Directos */}
      <div className="channels-section">
        <div className="section-header" onClick={() => toggleSection('dms')}>
          <h2 className="section-title">
            <span className="section-icon">💬</span>
              Mensajes Directos
            <span className="section-count">({filteredDMs.length})</span>
          </h2>
          <span className="collapse-icon">
            {collapsedSections.dms ? '▶' : '▼'}
          </span>
        </div>
        {!collapsedSections.dms && (
          <>
            {/* 🔍 Barra de búsqueda */}
            <div className="chat-search-bar">
              <input type="text" placeholder="Buscar usuario..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input" />
            </div>

            {/* 📜 Lista de DMs */}
            {filteredDMs.length > 0 ? (
              <ul className="channel-list">
                {filteredDMs.map((ch, index) => {
                  const displayName = formatDMName(ch.name); //Formatear nombre de usuario con el que se tiene el DM
                  const unread = unreadCounts[ch.idChannel] || 0; //Cantidad de mensajes no leídos
                  const isOnline = isUserOnline(displayName); //Estado online
                  //Renderizar cada DM
                  return (
                    //Elemento de lista para cada DM
                    <li key={generateUniqueKey(ch, "dm", index)}
                      className="channel-item dm-item"
                      onClick={() => handleSelectChannel(ch)}>
                      <div className="channel-info">
                        <div className="dm-user-main">
                          <strong className="channel-name">
                            {displayName}
                            <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
                              {isOnline ? '🟢 - Conectado' : '⚫ - Desconectado'}
                            </span>
                          </strong>
                          <div className="dm-actions">
                            <span className="message-bubble unread-count">{unread > 99 ? '99+' : unread}</span>
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
                        </div>
                      </div>

                      {/* Descripción del DM */}
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
          </>
        )}
      </div>

      {/* 🌐 Sección de Grupos */}
      <div className="channels-section">
        <div className="section-header" onClick={() => toggleSection('groups')}>
          <h2 className="section-title">
            <span className="section-icon">🌐</span>
            Grupos
            <span className="section-count">({groups.length})</span>
          </h2>
          <span className="collapse-icon">
            {collapsedSections.groups ? '▶' : '▼'}
          </span>
        </div>
        {/* 📜 Lista de Grupos */}
        {!collapsedSections.groups && (
          <>
            {groups.length > 0 ? (
              <ul className="channel-list">
                {groups.map((ch, index) => {
                    const unread = unreadCounts[ch.idChannel] || 0;
                    return (
                  <li
                    key={generateUniqueKey(ch, "group", index)}
                    className="channel-item group-item"
                    onClick={() => handleSelectChannel(ch)}>
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
          </>
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