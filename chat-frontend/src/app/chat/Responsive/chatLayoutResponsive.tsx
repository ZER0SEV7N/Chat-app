//src/app/chat/Responsive/chatLayoutResponsive.tsx
//Modulo para el layout responsivo del chat
'use client';
import React from 'react';
//Importar el hook de contexto de responsividad
import { useResponsiveContext } from './contextResponsive';

//Definir la interfaz de las props
interface ChatLayoutResponsiveProps {
    chatList: React.ReactNode;
    chatWindow: React.ReactNode;
    emptyState?: React.ReactNode;
}

//Componente principal del layout responsivo
export default function ChatLayoutResponsive({ chatList, chatWindow, emptyState }: ChatLayoutResponsiveProps) {
    const { isMobile, currentChat, goToList  } = useResponsiveContext();

    // - En móvil: mostrar lista SI NO hay chat activo, mostrar chat SI HAY chat activo
    // - En desktop: mostrar siempre ambos
    const shouldShowList = !isMobile || !currentChat;
    const shouldShowChat = !isMobile || currentChat;

    return(
        <div className={`responsive-chat-layout ${currentChat ? 'has-active-chat' : ''}`}>
            {/* Lista de chats - visible en desktop siempre, en móvil solo cuando no hay chat activo */}
            <div className={`chat-list-container ${shouldShowList ? 'visible' : 'hidden'}`}>
                {chatList}
            </div>

            {/* Área de chat - visible en desktop siempre, en móvil solo cuando hay chat activo */}
            <div className={`chat-window-container ${shouldShowChat ? 'visible' : 'hidden'}`}>
                {currentChat ? ( React.isValidElement(chatWindow)
                    ? React.cloneElement(chatWindow as React.ReactElement<any>, {
                    onBackToList: goToList,
                    key: currentChat.idChannel 
                }): chatWindow) : (emptyState || (
                    <div className="default-empty-state">
                        <div className="empty-message">
                            Selecciona un chat para comenzar a conversar 😊
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}