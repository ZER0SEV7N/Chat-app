import React from "react";
import './chat.css';

type UnreadCounts = {
    [channelId: string]: number;
};

interface Props {
    channels: any[];
    onSelectChannel: (channel: any) => void;
    onCreateChannel: () => void;
    onAddUser: () => void;
    unreadCounts: UnreadCounts; 
}

export default function ChatList({ channels, onSelectChannel, onCreateChannel, onAddUser, unreadCounts }: Props) {
    return(
        <div className="chat-list">
            <h2>Canales</h2>
            <ul>
                {channels.map((ch) => {
                    const count = unreadCounts[ch.idChannel] || 0; 
                    
                    return (
                        <li 
                            key={ch.idChannel} 
                            onClick={() => onSelectChannel(ch)} 
                            className="channel-item"
                        >
                            <div className="channel-info">
                                <strong>{ch.name}</strong>
                                <span>{ch.isPublic ? '🌐 Público' : '💬 Privado'}</span>
                            </div>
                            
                            {count > 0 && (
                                <span className="unread-badge">{count > 99 ? '99+' : count}</span>
                            )}
                            
                        </li>
                    );
                })}
            </ul>
            <div className="chat-list-buttons">
                <button onClick={onCreateChannel}>+ Nuevo Canal</button>
                <button onClick={onAddUser}> 👥 Agregar un nuevo usuario</button>
            </div>
        </div>
    );
}
