// src/app/chat/Responsive/useBackButton.tsx
'use client';
import { useEffect, useRef } from 'react';

export const useBackButton = (handler: () => void, isEnabled: boolean = true) => {
    const isHandlingRef = useRef(false);
    const handlerRef = useRef(handler);

    // Actualizar la referencia del handler
    useEffect(() => {
        handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
        if (!isEnabled) return;

        // Manejar el evento de popstate (botón de retroceso del navegador)
        const handlePopState = (event: PopStateEvent) => {
            // ✅ PREVENIR: No manejar si ya estamos procesando
            if (isHandlingRef.current) return;

            console.log('🔙 PopState detectado - Ejecutando handler');
            
            // ✅ PREVENIR la navegación por defecto
            event.preventDefault();
            event.stopPropagation();
            
            isHandlingRef.current = true;
            
            // Ejecutar nuestro handler personalizado
            handlerRef.current();
            
            // ✅ IMPORTANTE: Re-empujar el estado para mantenernos en la misma página
            setTimeout(() => {
                window.history.pushState({ type: 'prevent-back' }, '');
                isHandlingRef.current = false;
            }, 100);
        };

        // Manejar el back button nativo de móvil (Cordova/Capacitor)
        const handleNativeBackButton = (event: any) => {
            if (isHandlingRef.current) return;
            
            console.log('🔙 Native back button detectado - Ejecutando handler');
            
            event.preventDefault();
            event.stopPropagation();
            
            isHandlingRef.current = true;
            handlerRef.current();
            
            setTimeout(() => {
                isHandlingRef.current = false;
            }, 100);
            
            return false;
        };

        // ✅ INICIALIZAR: Empujar un estado inicial para poder detectar el back
        window.history.pushState({ type: 'chat-app-initial' }, '');

        // Agregar event listeners
        window.addEventListener('popstate', handlePopState, { capture: true });

        // Para aplicaciones híbridas (Android/iOS - Cordova/PhoneGap)
        if (typeof (window as any).cordova !== 'undefined') {
            document.addEventListener('backbutton', handleNativeBackButton, false);
        }
        
        // Para Capacitor (Ionic)
        if (typeof (window as any).Capacitor !== 'undefined') {
            document.addEventListener('backbutton', handleNativeBackButton, false);
        }

        // Para aplicaciones WebView nativas
        if (typeof (window as any).Android !== 'undefined') {
            document.addEventListener('backbutton', handleNativeBackButton, false);
        }

        return () => {
            console.log('🧹 Limpiando useBackButton listeners');
            window.removeEventListener('popstate', handlePopState, { capture: true });
            document.removeEventListener('backbutton', handleNativeBackButton, false);
            isHandlingRef.current = false;
        };
    }, [isEnabled]);
};