import React from "react";
import './chat.css';
interface Props {
    channels: any[];
    onSelectChannel: (channel: any) => void;
    onCreateChannel: () => void;
    onAddUser: () => void;
}

export default function ChatList({ channels, onSelectChannel, onCreateChannel, onAddUser}: Props) {
    return(
        <div className="chat-list">
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