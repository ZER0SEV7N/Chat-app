import React from "react";
import './chat.css';

interface Props {
  channels: any[];
  onSelectChannel: (channel: any) => void;
  onCreateChannel: () => void;
  onAddUser: () => void;
  onLogout: () => void;
  username: string;
}

export default function ChatList({
  channels,
  onSelectChannel,
  onCreateChannel,
  onAddUser,
  onLogout,
  username,
}: Props) {
  return (
    <div className="chat-list">
      {/* Header del usuario */}
      <div className="chat-list-header">
        <span className="chat-username-header">{username}</span>
        <button className="logout-btn" onClick={onLogout}>
          🚪 Cerrar sesión
        </button>
      </div>

      <h2 className="chat-section-title">Canales</h2>
      <ul className="channel-list">
        {channels.map((ch) => (
          <li
            key={ch.idChannel}
            className="channel-item"
            onClick={() => onSelectChannel(ch)}
          >
            <div className="channel-info">
              <strong>{ch.name}</strong>
              <small className="channel-type">
                {ch.isPublic ? "🌐 Público" : "💬 Privado"}
              </small>
            </div>
            {ch.description && (
              <p className="channel-description">{ch.description}</p>
            )}
          </li>
        ))}
      </ul>

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
