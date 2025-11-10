//src/app/chat/Responsive/headerChatResponsive.tsx
//Modulo para el botón de retroceso responsivo
'use client';
import React from 'react';
import { ArrowLeft } from 'lucide-react'; // Ícono más profesional
//Importar el hook de contexto de responsividad
import { useResponsiveContext } from './contextResponsive';

//Definir la interfaz de las props
interface HeaderChatResponsiveProps {
    onBack: () => void;
    showBackButton?: boolean;
    className?: string;
}

//Componente principal del botón de retroceso responsivo
export default function HeaderChatResponsive({ 
    onBack, 
    showBackButton = true,
    className = "" 
}: HeaderChatResponsiveProps) {
    const { isMobile, isTablet } = useResponsiveContext();

    // Mostrar en móvil Y tablet (opcional)
    if(!isMobile && !isTablet) {
        return null; // No mostrar en escritorio grande
    }   
    
    if(!showBackButton) {
        return null; // No mostrar si está desactivado
    }

    return(
        <button 
            className={`back-to-responsive ${className}`}
            onClick={onBack}
            aria-label="Volver a la lista de chats"
        >
            <ArrowLeft size={isMobile ? 20 : 22} />
            {isTablet && <span className="back-text">Volver</span>}
        </button>
    );
}