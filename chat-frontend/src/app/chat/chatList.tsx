//chat-frontend/src/app/chat/chatList.tsx
import React from "react";
//Importar estilos CSS
import './chat.css';
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
  //Renderizado del componente
  return (
    <div className="chat-list">
      {/* Header del usuario */}
      <div className="chat-list-header">
        <span className="chat-username-header">{username}</span>
        <button className="logout-btn" onClick={onLogout}>
          🚪 Cerrar sesión
        </button>
      </div>

      {/* Sección de Grupos */}
      <div className="channels-section">
        <h2 className="section-title"> 🌐 Grupos</h2>
        {groups.length > 0 ? (
          <ul className="channel-list">
            {groups.map((ch, index) => (
              <li
                key={generateUniqueKey(ch, 'group', index)}
                className="channel-item group-item"
                onClick={() => onSelectChannel(ch)}
              >
                <div className="channel-info">
                  <strong className="channel-name">{ch.name || "Grupo sin nombre"}</strong>
                  <small className="channel-type"> Público</small>
                </div>
                {ch.description && (
                  <p className="channel-description">{ch.description}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state"> No tienes grupos</p>
        )}
      </div>

      {/* Sección de Mensajes Directos */}
      <div className="channels-section">
        <h2 className="section-title"> 💬 Mensajes Directos</h2>
        {directMessages.length > 0 ? (
          <ul className="channel-list">
            {directMessages.map((ch, index) => {
              const displayName = formatDMName(ch.name);
              
              return (
                <li
                  key={generateUniqueKey(ch, 'dm', index)}
                  className="channel-item dm-item"
                  onClick={() => onSelectChannel(ch)}
                >
                  <div className="channel-info">
                    <strong className="channel-name">{displayName}</strong>
                    <small className="channel-type"> Privado</small>
                    {/* Botón para eliminar DM */}
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(ch);
                      }}
                      title={`Eliminar conversación con ${displayName}`}
                    > 🗑️ Eliminar MD</button>
                  </div>
                  {ch.description && (
                    <p className="channel-description">{ch.description}</p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty-state"> No tienes mensajes directos</p>
        )}
      </div>

      {/* Botones de acción lateral */}
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