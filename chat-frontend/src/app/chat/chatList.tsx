//chat-frontend/src/app/chat/chatList.tsx
//Lista de canales y mensajes directos en la aplicacion de chat - Barra lateral
"use client";
//Importaciones importantes
import React, { useEffect, useState } from "react";
import './chat.css';
import "./chat-responsive.css"; 
import "./chat-dark.css";
import { LogOut, Users, Trash2 } from "lucide-react"; // ✅ Agregar LogOut
import socket from "@/lib/socket";
//Definicion de las props del componente
interface Props {
  channels: any[]; //Lista de canales
  onSelectChannel: (channel: any) => void; //Funcion al seleccionar un canal
  onChannelManager: () => void; //Funcion para crear un nuevo canal o buscar unirse a uno
  onAddUser: () => void; //Funcion para agregar un usuario (iniciar DM)
  onLogout: () => void; //Funcion para cerrar sesion
  onDeleteChannel: (idChannel: number) => void; //Funcion para eliminar un canal
  username: string; //Nombre de usuario actual
  unreadCounts?: { [key: number]: number }; //Conteo de mensajes no leidos por canal
  publicChannels?: any[]; //Lista de canales publicos
  privateChannels?: any[]; //Lista de canales privados
  dmChannels?: any[]; //Lista de canales de mensajes directos
}
//Componente de la lista de canales y DMs
export default function ChatList({
  channels,
  onSelectChannel,
  onChannelManager,
  onAddUser,
  onLogout,
  onDeleteChannel,
  username,
  unreadCounts = {}, 
}: Props) {
  const [searchTerm, setSearchTerm] = useState(""); //Estado para el termino de busqueda
  const [onlineUsers, setOnlineUsers] = useState<{ idUser: number; username: string }[]>([]); //Estado para usuarios en linea
  const [collapsedSections, setCollapsedSections] = useState({ dms: false, groups: false }); //Estado para secciones colapsadas
  //Efecto para manejar usuarios en linea via WebSocket
  useEffect(() => {
    if (!socket || !socket.connected) return;
    //Funcion para actualizar la lista de usuarios en linea
    const handleOnlineUsers = (users: { idUser: number; username: string }[]) => {
      setOnlineUsers(users);
    };
    //Escuchar evento de usuarios en linea
    socket.on("onlineUsers", handleOnlineUsers);
    socket.emit("userConnected", username);

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
    };
  }, [username]);

  const handleSelectChannel = (channel: any) => {
    onSelectChannel(channel);
  };

  //USAR LAS LISTAS SEPARADAS EN LUGAR DE FILTRAR
  const groups = channels.filter(ch => ch.type === "channel");

  const directMessages = channels.filter(ch => ch.type === "dm");

  //FUNCIÓN MEJORADA: Formatear nombre para DMs con manejo de errores
  const formatDMName = (channel: any) => {
    //PRIMERO: Manejar casos donde channel sea undefined
    if (!channel) return "Chat desconocido";
    
    //Si ya viene con displayName desde el backend, usarlo
    if (channel.displayName) {
      return channel.displayName.replace('DM con ', '');
    }
    
    //Fallback para DMs antiguos - verificar que name existe
    if (channel.name && typeof channel.name === "string" && channel.name.startsWith("DM ")) {
      const parts = channel.name.replace("DM ", "").split("-");
      const currentUser = username;
      const otherUser = parts[0] === currentUser ? parts[1] : parts[0];
      return otherUser || channel.name;
    }
    
    //Último fallback
    return channel.name || "Chat sin nombre";
  };

  const toggleSection = (section: 'dms' | 'groups') => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isUserOnline = (usernameToCheck: string) => {
    return onlineUsers.some((user) => user.username === usernameToCheck);
  }

  //CORREGIDO: Pasar el objeto completo 'ch' en lugar de 'ch.name'
  const handleDeleteClick = (ch: any) => {
    if (!ch.isPublic) {
      const displayName = formatDMName(ch); //Pasar 'ch' no 'ch.name'
      const confirmDelete = confirm(
        `¿Seguro que deseas eliminar este DM con ${displayName}?`
      );
      if (confirmDelete) onDeleteChannel(ch.idChannel);
    }
  };
  //Generar clave unica para cada canal
  const generateUniqueKey = (ch: any, type: 'group' | 'dm', index: number) => {
    if (ch.idChannel) {
      return `${type}-${ch.idChannel}`;
    }
    return `${type}-${ch.name}-${ch.creatorId || 'unknown'}-${index}`;
  };

  //FUNCIÓN Filtrar DMs con manejo de errores
  const filteredDMs = directMessages.filter((ch) => {
    try {
      const displayName = formatDMName(ch); 
      return displayName.toLowerCase().includes(searchTerm.toLowerCase());
    } catch (error) {
      console.warn('Error al formatear nombre del canal:', ch, error);
      return false;
    }
  });

  //Funcion para salir de un canal
  const handleLeaveChannel = (channel: any) => {
    const confirmLeave = confirm(
      `¿Seguro que deseas salir del canal ${channel.name}?`
    );
    if (confirmLeave){
      //Emitir el evento para salir del canal
      if(socket){
        socket.emit('leaveChannel', channel.idChannel);
      }
    }
  }

  //Renderizado del componente
  return (
    <div className="chat-list">
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
            <div className="chat-search-bar">
              <input 
                type="text" 
                placeholder="Buscar usuario..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input" 
              />
            </div>

            {filteredDMs.length > 0 ? (
              <ul className="channel-list">
                {filteredDMs.map((ch, index) => {
                  // ✅ CORREGIDO: Pasar 'ch' no 'ch.name'
                  const displayName = formatDMName(ch);
                  const unread = unreadCounts[ch.idChannel] || 0;
                  const isOnline = isUserOnline(displayName);
                  
                  return (
                    <li 
                      key={generateUniqueKey(ch, "dm", index)}
                      className="channel-item dm-item"
                      onClick={() => handleSelectChannel(ch)}
                    >
                      <div className="channel-info">
                        <div className="dm-user-main">
                          <strong className="channel-name">
                            {displayName}
                            <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
                              {isOnline ? '🟢 - Conectado' : '⚫ - Desconectado'}
                            </span>
                          </strong>
                        
                          <div className="dm-actions">
                            {unread > 0 && (
                            <span className="message-bubble unread-count">
                              {unread > 99 ? '99+' : unread}
                            </span>
                            )}
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

                      {ch.description && (
                        <p className="channel-description">{ch.description}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="empty-state">
                {searchTerm ? 'No hay resultados' : 'No tienes mensajes directos'}
              </p>
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
        
        {!collapsedSections.groups && (
          <>
            {groups.length > 0 ? (
              <ul className="channel-list">
                {groups.map((ch, index) => {
                  const unread = unreadCounts[ch.idChannel] || 0;
                  const isCreator = ch.creator?.username === username;
                  return (
                    <li
                      key={generateUniqueKey(ch, "group", index)}
                      className={`channel-item group-item ${unread > 0 ? 'has-unread' : ''}`}
                      onClick={() => handleSelectChannel(ch)}
                    >
                      <div className="channel-info">
                        <strong className="channel-name">
                          {ch.name || "Grupo sin nombre"}
                        </strong>
                        {unread > 0 && (
                        <span className="message-bubble unread-count group-unread">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}

                        {/* ✅ BOTÓN PARA SALIR DEL CANAL */}
                          {!isCreator && (
                            <button
                              className="leave-channel-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLeaveChannel(ch);
                              }}
                              title={`Salir del canal ${ch.name}`}
                            >
                              <LogOut size={14} />
                            </button>
                          )}

                        <small className="channel-type">
                          {ch.isPublic ? 'Público' : 'Privado'}
                        </small>
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

      <div className="chat-list-buttons">
        <button className="sidebar-button" onClick={onChannelManager}>
          ➕ Crear Grupo o Unirse a un Grupo
        </button>
        <button className="sidebar-button" onClick={onAddUser}>
          👥 Iniciar un DM
        </button>
      </div>
    </div>
  );
}