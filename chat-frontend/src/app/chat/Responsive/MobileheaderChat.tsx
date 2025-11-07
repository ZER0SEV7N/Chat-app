//src/app/chat/Responsive/headerChatResponsive.tsx
//Modulo para el header responsivo del chat
'use client';
import React from 'react';
//Importar el hook de contexto de responsividad
import { useResponsiveContext } from './contextResponsive';

//Definir la interfaz de las props
interface HeaderChatResponsiveProps {
    title: string;
    subtitle?: string;
    onBack: () => void;
    showBackButton?: boolean;
}

//Componente principal del header responsivo
export default function HeaderChatResponsive({ title, subtitle, onBack, showBackButton = true }: HeaderChatResponsiveProps) {
    const { isMobile } = useResponsiveContext();

    if(!isMobile) {
        return null; //No mostrar el header en escritorio
    }   
    return(
        <div className="mobile-chat-header">
        {showBackButton && (
            <button 
            className="back-button"
            onClick={onBack}
            aria-label="Volver a la lista de chats">←</button>
        )}
        <div className="header-info">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
        </div>
    </div>
  );
}