// src/app/chat/Side/UserInfoPopover.tsx - Nuevo componente para el popover
"use client"
import React from "react";
import "./UserInfoPanel.css";

interface UserInfoPopoverProps {
    user: any;
    channel?: any;
    onlineUsers?: any[];
    onClose: () => void;
} 

export default function UserInfoPopover({ user, channel, onlineUsers = [], onClose }: UserInfoPopoverProps) {
    if (!user) return null;

    return (
        <div className="user-info-popover">
            {/* Header del popover */}
            <div className="user-info-popover-header">
                <h3>Información del Contacto</h3>
                <button className="popover-close" onClick={onClose} aria-label="Cerrar">
                    ×
                </button>
            </div>

            {/* Contenido del popover */}
            <div className="user-info-popover-content">
                {/* Estado en línea/desconectado */}
                <div className="user-status-popover">
                    <div className={`status-indicator ${onlineUsers.some(onlineUser => onlineUser.idUser === user.idUser) ? 'online' : 'offline'}`}>
                        {onlineUsers.some(onlineUser => onlineUser.idUser === user.idUser) ? '🟢 En línea' : '⚫ Desconectado'}
                    </div>
                </div>

                {/* Información del usuario */}
                <div className="user-details-popover">
                    <div className="user-name-popover">{user.name || user.username}</div>
                    <div className="user-username-popover">@{user.username}</div>
                    <div className="user-context-popover">Mensaje Directo</div>
                </div>

                {/* Información de contacto */}
                <div className="contact-info-popover">
                    <div className="contact-item">
                        <span className="contact-label">📧 Correo:</span>
                        <span className="contact-value">{user.email}</span>
                    </div>
                    
                    <div className="contact-item">
                        <span className="contact-label">📞 Teléfono:</span>
                        <span className="contact-value">{user.phone || 'No disponible'}</span>
                    </div>
                    
                    <div className="contact-item">
                        <span className="contact-label">💬 Tipo:</span>
                        <span className="contact-value">Conversación privada</span>
                    </div>
                </div>
            </div>
        </div>
    );
}