// chat-frontend/src/app/chat/chatList.tsx
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
  //Desestructurar las props recibidas
}: Props) {
  // Confirmación de borrado con ventana nativa
  const handleDeleteClick = (ch: any) => {
    if (!ch.isPublic) {
      let displayName = ch.name || "";
      if (typeof ch.name === "string" && ch.name.startsWith("DM ")) {
        const parts = ch.name.replace("DM ", "").split("-");
        const currentUser = username;
        const otherUser = parts[0] === currentUser ? parts[1] : parts[0];
        displayName = otherUser;
      }
      const confirmDelete = confirm(
        `¿Seguro que deseas eliminar este DM con ${displayName}?`
      );
      if (confirmDelete) onDeleteChannel(ch.idChannel);
    }
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

      {/* Canales en donde esta el usuario */}
      <h2 className="chat-section-title">Canales</h2>
      <ul className="channel-list">
        {channels.map((ch, index) => {
          if (!ch) return null; // Previene errores si el canal viene vacío
          let displayName = ch.name || "Canal sin nombre";

          // Si es un canal privado, mostrar el nombre del otro usuario
          if (!ch.isPublic && typeof ch.name === "string" && ch.name.startsWith("DM ")) {
            const currentUser = username;
            const parts = ch.name.replace("DM ", "").split("-");
            // Si el usuario actual es el primero, mostrar el segundo, y viceversa
            const otherUser = parts[0] === currentUser ? parts[1] : parts[0];
            displayName = `DM ${otherUser}`;
          }

          return (
            //Mostrar cada canal en la lista
            <li
              key={ch.idChannel || `channel-${index}`} // ✅ Evita warning de keys duplicadas
              className="channel-item"
              onClick={() => onSelectChannel(ch)}
            >
              <div className="channel-info">
                <strong>{displayName}</strong>
                <small className="channel-type">
                  {ch.isPublic ? "🌐 Público" : "💬 Privado"}{" "}
                  {/* Colocar un emoji al final para diferenciar entre publicos y privados */}
                </small>
              </div>

              {/*Boton para eliminar DM*/}
              {!ch.isPublic && (
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // Evita que se seleccione el canal al eliminarlo
                    handleDeleteClick(ch);
                  }}
                  title="Eliminar canal"
                >
                  🗑️
                </button>
              )}

              {/* Mostrar la descripción si existe */}
              {ch.description && (
                <p className="channel-description">{ch.description}</p>
              )}
            </li>
          );
        })}
      </ul>

      {/* Botones de acción lateral */}
      <div className="chat-list-buttons">
        <button className="sidebar-button" onClick={onCreateChannel}>
          ➕ Nuevo Canal
        </button>
        <button className="sidebar-button" onClick={onAddUser}>
          👥 Agregar un nuevo usuario
        </button>
      </div>
    </div>
  );
}
