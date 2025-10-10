import { channel } from "diagnostics_channel";
import React from "react";

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
                {channels.map((ch)=> (
                    <li key={ch.idChannel} onClick={() => onSelectChannel(ch)}>
                        #{ch.name}
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