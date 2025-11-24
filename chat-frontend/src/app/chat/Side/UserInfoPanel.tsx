// src/app/chat/Side/UserInfoPanel.tsx
"use client"
import React from "react";
import "./UserInfoPanel.css";

//Interfaz
interface UserInfoPanelProps {
    user: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function UserInfoPanel({ user, isOpen, onClose }: UserInfoPanelProps) {
    if (!isOpen || !user) return null;

    return (
        <div className="modal-overlay user-info-modal-overlay" onClick={onClose}>
            <div className="user-info-modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="user-info-modal-header">
                    <h3>Información del Contacto</h3>
                    <button className="modal-close" onClick={onClose} aria-label="Cerrar">
                        ×
                    </button>
                </div>

                {/* Contenido */}
                <div className="user-info-modal-body">
                    {/* ✅ REMOVIDO: Sección de avatar */}
                    
                    <div className="user-details">
                        <div className="user-name">{user.name}</div>
                        <div className="user-username">@{user.username}</div>
                        <div className="user-context">Mensaje Directo</div>
                    </div>

                    <div className="user-info-section">
                        <div className="info-item">
                            <span className="info-label">📧 Correo:</span>
                            <span className="info-value">{user.email}</span>
                        </div>
                        
                        <div className="info-item">
                            <span className="info-label">📞 Teléfono:</span>
                            <span className="info-value">{user.phone || 'No disponible'}</span>
                        </div>
                        
                        {/* ✅ NUEVO: Información específica de DM */}
                        <div className="info-item">
                            <span className="info-label">💬 Tipo:</span>
                            <span className="info-value">Conversación privada</span>
                        </div>
                    </div>
                </div>
                {/* Footer */}
                <div className="user-info-modal-footer">
                    <button className="btn-primary" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}