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

export default function ChatList({ channels, onSelectChannel, onCreateChannel, onAddUser, onLogout, username}: Props) {
    
    return(
        <div className="chat-list">
            {/* Header con usuario y logout */}
            <div className="chat-list-header">
                <span className="chat-username">{username}</span>
                <button className="logout-button" onClick={onLogout}>Cerrar sesión</button>
            </div>
            <h2>Canales</h2>
            <ul>
                {channels.map((ch, i) => (
                <li key={ch.idChannel} onClick={() => onSelectChannel(ch)} className="channel-item">
                    <strong>{ch.name}</strong>
                    <span>{ch.isPublic ? '🌐 Público' : '💬 Privado'}</span>
                </li>
                ))}
            </ul>
            <div className="chat-list-buttons">
                <button onClick={onCreateChannel}>+ Nuevo Canal</button>
                <button onClick={onAddUser}> 👥 Agregar un nuevo usuario</button>
            </div>
        </div>
    );
}